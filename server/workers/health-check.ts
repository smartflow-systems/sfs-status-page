import { storage } from "../storage";
import type { Monitor, Service } from "../../shared/schema";
import { log } from "../vite";

// ============================================================================
// HEALTH CHECK ENGINE
// ============================================================================

export class HealthCheckWorker {
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) {
      log("Health check worker is already running");
      return;
    }

    this.isRunning = true;
    log("Starting health check worker...");

    // Run checks every 10 seconds
    this.checkInterval = setInterval(() => {
      this.runDueChecks();
    }, 10000);

    // Run initial check
    await this.runDueChecks();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    log("Health check worker stopped");
  }

  async runDueChecks() {
    try {
      const monitors = await storage.getMonitorsDue();
      if (monitors.length === 0) {
        return;
      }

      log(`Running ${monitors.length} health checks...`);

      // Run all checks in parallel
      await Promise.allSettled(
        monitors.map((monitor) => this.checkMonitor(monitor))
      );
    } catch (error) {
      console.error("Error running health checks:", error);
    }
  }

  async checkMonitor(monitor: Monitor) {
    const service = await storage.getService(monitor.serviceId);
    if (!service || !service.monitoringEnabled) {
      return;
    }

    const checkStart = Date.now();
    let isUp = false;
    let responseTime: number | null = null;
    let statusCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const result = await this.performHealthCheck(service, monitor);
      isUp = result.isUp;
      responseTime = result.responseTime;
      statusCode = result.statusCode;
      errorMessage = result.errorMessage;
    } catch (error: any) {
      isUp = false;
      errorMessage = error.message || "Unknown error";
      responseTime = Date.now() - checkStart;
    }

    // Record metric
    await storage.createMetric({
      serviceId: service.id,
      responseTime: responseTime || null,
      statusCode: statusCode || null,
      isUp,
      errorMessage,
      region: monitor.regions?.[0] || "us-east",
      checkedAt: new Date(),
    });

    // Update service status based on recent metrics
    await this.updateServiceStatus(service.id, isUp);

    // Schedule next check
    const nextCheck = new Date(Date.now() + (monitor.checkInterval * 1000));
    await storage.updateMonitorCheckTime(monitor.id, new Date(), nextCheck);

    // Check if we need to create or update an incident
    if (!isUp) {
      await this.handleServiceDown(service, errorMessage || "Service is down");
    } else {
      await this.handleServiceUp(service);
    }
  }

  async performHealthCheck(service: Service, monitor: Monitor): Promise<{
    isUp: boolean;
    responseTime: number;
    statusCode: number | null;
    errorMessage: string | null;
  }> {
    const startTime = Date.now();
    let isUp = false;
    let statusCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), monitor.timeout * 1000);

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: monitor.method || "GET",
        headers: monitor.headers || {},
        signal: controller.signal,
        redirect: monitor.followRedirects ? "follow" : "manual",
      };

      if (monitor.body && (monitor.method === "POST" || monitor.method === "PUT")) {
        fetchOptions.body = monitor.body;
      }

      // Perform HTTP check
      const response = await fetch(service.url, fetchOptions);
      clearTimeout(timeoutId);

      statusCode = response.status;
      const expectedStatus = monitor.expectedStatusCode || 200;

      // Check status code
      if (statusCode !== expectedStatus) {
        isUp = false;
        errorMessage = `Expected status ${expectedStatus}, got ${statusCode}`;
      } else {
        isUp = true;

        // Check for expected keyword if configured
        if (monitor.expectedKeyword) {
          const body = await response.text();
          if (!body.includes(monitor.expectedKeyword)) {
            isUp = false;
            errorMessage = `Expected keyword "${monitor.expectedKeyword}" not found in response`;
          }
        }
      }
    } catch (error: any) {
      isUp = false;
      if (error.name === "AbortError") {
        errorMessage = `Request timeout after ${monitor.timeout}s`;
      } else {
        errorMessage = error.message || "Network error";
      }
    }

    const responseTime = Date.now() - startTime;

    return {
      isUp,
      responseTime,
      statusCode,
      errorMessage,
    };
  }

  async updateServiceStatus(serviceId: string, currentCheckUp: boolean) {
    // Get last 5 checks to determine status
    const recentMetrics = await storage.getLatestMetrics(serviceId, 5);

    if (recentMetrics.length === 0) {
      return;
    }

    const failedCount = recentMetrics.filter((m) => !m.isUp).length;
    const totalCount = recentMetrics.length;

    let newStatus: string;

    if (failedCount === 0) {
      newStatus = "operational";
    } else if (failedCount >= totalCount) {
      newStatus = "down";
    } else if (failedCount >= totalCount / 2) {
      newStatus = "degraded";
    } else {
      newStatus = "operational";
    }

    await storage.updateServiceStatus(serviceId, newStatus);
  }

  async handleServiceDown(service: Service, errorMessage: string) {
    const workspace = await storage.getWorkspace(service.workspaceId);
    if (!workspace) return;

    // Check if there's already an active incident for this service
    const activeIncidents = await storage.getActiveIncidents(workspace.id);
    const existingIncident = activeIncidents.find((inc: any) =>
      inc.affectedServices?.includes(service.name)
    );

    if (!existingIncident) {
      // Create new incident
      const incident = await storage.createIncident({
        workspaceId: workspace.id,
        title: `${service.name} is experiencing issues`,
        description: errorMessage,
        status: "investigating",
        severity: "major",
        autoGenerated: true,
      });

      // Link service to incident
      await storage.addIncidentService(incident.id, service.id);

      // Create initial update
      await storage.createIncidentUpdate({
        incidentId: incident.id,
        status: "investigating",
        message: `We're investigating an issue with ${service.name}. ${errorMessage}`,
      });

      // Notify integrations
      await this.triggerNotifications(workspace.id, "incident.created", {
        incident,
        service,
      });
    }
  }

  async handleServiceUp(service: Service) {
    const workspace = await storage.getWorkspace(service.workspaceId);
    if (!workspace) return;

    // Check if there's an auto-generated incident for this service
    const activeIncidents = await storage.getActiveIncidents(workspace.id);
    const serviceIncident = activeIncidents.find(
      (inc: any) =>
        inc.autoGenerated && inc.affectedServices?.includes(service.name)
    );

    if (serviceIncident) {
      // Resolve the incident
      await storage.resolveIncident(serviceIncident.id);

      // Create resolution update
      await storage.createIncidentUpdate({
        incidentId: serviceIncident.id,
        status: "resolved",
        message: `${service.name} is now operational. The issue has been resolved.`,
      });

      // Notify integrations
      await this.triggerNotifications(workspace.id, "incident.resolved", {
        incident: serviceIncident,
        service,
      });
    }
  }

  async triggerNotifications(workspaceId: string, event: string, data: any) {
    try {
      const integrations = await storage.getActiveIntegrations(workspaceId, event);

      for (const integration of integrations) {
        try {
          await this.sendIntegrationNotification(integration, event, data);
        } catch (error) {
          console.error(`Failed to send notification to ${integration.channel}:`, error);
        }
      }
    } catch (error) {
      console.error("Error triggering notifications:", error);
    }
  }

  async sendIntegrationNotification(integration: any, event: string, data: any) {
    const { channel, config } = integration;

    switch (channel) {
      case "webhook":
        await this.sendWebhook(config.webhookUrl, data, config.customHeaders);
        break;
      case "slack":
        await this.sendSlackNotification(config.webhookUrl, data);
        break;
      case "discord":
        await this.sendDiscordNotification(config.discordWebhook, data);
        break;
      case "teams":
        await this.sendTeamsNotification(config.teamsWebhook, data);
        break;
      default:
        log(`Unsupported integration channel: ${channel}`);
    }
  }

  async sendWebhook(url: string, data: any, headers: Record<string, string> = {}) {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    });
  }

  async sendSlackNotification(webhookUrl: string, data: any) {
    const { incident, service } = data;
    const color = incident.severity === "critical" ? "danger" : "warning";

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: incident.title,
            text: incident.description,
            fields: [
              {
                title: "Service",
                value: service.name,
                short: true,
              },
              {
                title: "Status",
                value: incident.status,
                short: true,
              },
            ],
            footer: "SFS Status Page",
            ts: Math.floor(new Date(incident.createdAt).getTime() / 1000),
          },
        ],
      }),
    });
  }

  async sendDiscordNotification(webhookUrl: string, data: any) {
    const { incident, service } = data;
    const color = incident.severity === "critical" ? 0xff0000 : 0xffa500;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: incident.title,
            description: incident.description,
            color,
            fields: [
              {
                name: "Service",
                value: service.name,
                inline: true,
              },
              {
                name: "Status",
                value: incident.status,
                inline: true,
              },
            ],
            footer: {
              text: "SFS Status Page",
            },
            timestamp: incident.createdAt,
          },
        ],
      }),
    });
  }

  async sendTeamsNotification(webhookUrl: string, data: any) {
    const { incident, service } = data;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        themeColor: incident.severity === "critical" ? "FF0000" : "FFA500",
        summary: incident.title,
        sections: [
          {
            activityTitle: incident.title,
            activitySubtitle: service.name,
            facts: [
              {
                name: "Status",
                value: incident.status,
              },
              {
                name: "Description",
                value: incident.description,
              },
            ],
          },
        ],
      }),
    });
  }
}

// Singleton instance
export const healthCheckWorker = new HealthCheckWorker();
