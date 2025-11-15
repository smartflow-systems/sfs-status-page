/**
 * SFS Status Page - Monitoring Engine
 * Automated HTTP health checks with response time tracking
 */

import { storage } from "./storage";
import type { Service } from "@shared/schema";

export class MonitoringEngine {
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start monitoring all services
   */
  async start() {
    console.log("🔍 Starting monitoring engine...");
    const services = await storage.getAllServices();

    for (const service of services) {
      this.monitorService(service.id);
    }

    console.log(`✅ Monitoring ${services.length} service(s)`);
  }

  /**
   * Stop monitoring all services
   */
  stop() {
    console.log("⏹️  Stopping monitoring engine...");
    for (const [serviceId, interval] of this.checkIntervals) {
      clearInterval(interval);
      this.checkIntervals.delete(serviceId);
    }
    console.log("✅ Monitoring stopped");
  }

  /**
   * Start monitoring a specific service
   */
  async monitorService(serviceId: string) {
    const service = await storage.getService(serviceId);
    if (!service) {
      console.error(`❌ Service ${serviceId} not found`);
      return;
    }

    // Clear existing interval if any
    this.stopMonitoringService(serviceId);

    // Perform initial check immediately
    await this.checkService(service);

    // Schedule recurring checks
    const intervalMs = service.checkInterval * 1000;
    const interval = setInterval(async () => {
      await this.checkService(service);
    }, intervalMs);

    this.checkIntervals.set(serviceId, interval);
    console.log(`📡 Monitoring ${service.name} every ${service.checkInterval}s`);
  }

  /**
   * Stop monitoring a specific service
   */
  stopMonitoringService(serviceId: string) {
    const interval = this.checkIntervals.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(serviceId);
    }
  }

  /**
   * Perform health check on a service
   */
  private async checkService(service: Service) {
    const startTime = Date.now();
    let isUp = false;
    let responseTime: number | null = null;
    let statusCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(service.url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "SFS-StatusPage/1.0",
        },
      });

      clearTimeout(timeoutId);

      responseTime = Date.now() - startTime;
      statusCode = response.status;
      isUp = response.ok; // 2xx status codes

      if (!response.ok) {
        errorMessage = `HTTP ${statusCode}: ${response.statusText}`;
      }
    } catch (error: any) {
      responseTime = Date.now() - startTime;
      isUp = false;

      if (error.name === "AbortError") {
        errorMessage = "Request timeout (>10s)";
      } else if (error.code === "ENOTFOUND") {
        errorMessage = "DNS resolution failed";
      } else if (error.code === "ECONNREFUSED") {
        errorMessage = "Connection refused";
      } else if (error.code === "ETIMEDOUT") {
        errorMessage = "Connection timeout";
      } else {
        errorMessage = error.message || "Unknown error";
      }
    }

    // Save uptime record
    await storage.createUptimeRecord({
      serviceId: service.id,
      isUp,
      responseTime: isUp ? responseTime : null,
      statusCode,
      errorMessage,
    });

    // Update service status and metrics
    const newStatus = isUp ? "operational" : "down";
    const shouldUpdateStatus = service.status !== newStatus;

    // Calculate uptime percentage (last 30 days)
    const stats = await storage.getUptimeStats(service.id, 30);

    await storage.updateService(service.id, {
      status: newStatus,
      responseTime: isUp ? responseTime : service.responseTime,
      uptime: stats.uptime.toFixed(1),
      lastCheckedAt: new Date(),
    });

    // Log check result
    const emoji = isUp ? "✅" : "❌";
    const statusMsg = isUp
      ? `${responseTime}ms (${statusCode})`
      : errorMessage;

    console.log(`${emoji} ${service.name}: ${statusMsg}`);

    // Auto-create incident if service goes down
    if (!isUp && service.status === "operational") {
      await this.createDowntimeIncident(service);
    }

    // Auto-resolve incident if service comes back up
    if (isUp && service.status === "down") {
      await this.resolveDowntimeIncident(service);
    }
  }

  /**
   * Create an incident when a service goes down
   */
  private async createDowntimeIncident(service: Service) {
    console.log(`🚨 Creating incident for ${service.name}`);

    await storage.createIncident({
      title: `${service.name} is down`,
      status: "investigating",
      affectedServices: [service.id],
    });
  }

  /**
   * Resolve incident when service comes back up
   */
  private async resolveDowntimeIncident(service: Service) {
    console.log(`✅ Service ${service.name} is back up`);

    // Find active incidents affecting this service
    const activeIncidents = await storage.getActiveIncidents();
    const relatedIncidents = activeIncidents.filter(incident =>
      incident.affectedServices.includes(service.id)
    );

    for (const incident of relatedIncidents) {
      await storage.updateIncident(incident.id, {
        status: "resolved",
        resolvedAt: new Date(),
      });

      await storage.createIncidentUpdate({
        incidentId: incident.id,
        status: "resolved",
        message: `${service.name} is back online. Issue resolved.`,
      });
    }
  }
}

// Singleton instance
export const monitoringEngine = new MonitoringEngine();
