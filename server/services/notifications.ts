import { storage } from "../storage";
import type { Incident, Service, Subscriber } from "../../shared/schema";

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  /**
   * Send incident notification to all subscribers
   */
  async notifyIncidentCreated(incident: Incident, affectedServices: Service[]) {
    const workspace = await storage.getWorkspace(incident.workspaceId);
    if (!workspace) return;

    const subscribers = await storage.getSubscribers(workspace.id);
    const verified Subscribers = subscribers.filter((s) => s.verified);

    for (const subscriber of verifiedSubscribers) {
      await this.sendIncidentEmail(subscriber.email, {
        type: "incident_created",
        workspaceName: workspace.name,
        incidentTitle: incident.title,
        incidentDescription: incident.description || "",
        affectedServices: affectedServices.map((s) => s.name),
        severity: incident.severity,
        statusPageUrl: `https://${workspace.subdomain || workspace.slug}.status.sfs.com`,
        unsubscribeUrl: `https://status.sfs.com/unsubscribe/${subscriber.unsubscribeToken}`,
      });
    }

    // Broadcast WebSocket update
    if ((global as any).broadcastUpdate) {
      (global as any).broadcastUpdate(workspace.id, "incident.created", { incident });
    }
  }

  /**
   * Send incident update notification
   */
  async notifyIncidentUpdated(incident: Incident, update: string) {
    const workspace = await storage.getWorkspace(incident.workspaceId);
    if (!workspace) return;

    const subscribers = await storage.getSubscribers(workspace.id);
    const verifiedSubscribers = subscribers.filter((s) => s.verified);

    for (const subscriber of verifiedSubscribers) {
      await this.sendIncidentEmail(subscriber.email, {
        type: "incident_updated",
        workspaceName: workspace.name,
        incidentTitle: incident.title,
        updateMessage: update,
        status: incident.status,
        statusPageUrl: `https://${workspace.subdomain || workspace.slug}.status.sfs.com`,
        unsubscribeUrl: `https://status.sfs.com/unsubscribe/${subscriber.unsubscribeToken}`,
      });
    }

    // Broadcast WebSocket update
    if ((global as any).broadcastUpdate) {
      (global as any).broadcastUpdate(workspace.id, "incident.updated", { incident, update });
    }
  }

  /**
   * Send incident resolved notification
   */
  async notifyIncidentResolved(incident: Incident) {
    const workspace = await storage.getWorkspace(incident.workspaceId);
    if (!workspace) return;

    const subscribers = await storage.getSubscribers(workspace.id);
    const verifiedSubscribers = subscribers.filter((s) => s.verified);

    for (const subscriber of verifiedSubscribers) {
      await this.sendIncidentEmail(subscriber.email, {
        type: "incident_resolved",
        workspaceName: workspace.name,
        incidentTitle: incident.title,
        statusPageUrl: `https://${workspace.subdomain || workspace.slug}.status.sfs.com`,
        unsubscribeUrl: `https://status.sfs.com/unsubscribe/${subscriber.unsubscribeToken}`,
      });
    }

    // Broadcast WebSocket update
    if ((global as any).broadcastUpdate) {
      (global as any).broadcastUpdate(workspace.id, "incident.resolved", { incident });
    }
  }

  /**
   * Send maintenance scheduled notification
   */
  async notifyMaintenanceScheduled(maintenanceId: string) {
    // Implementation for maintenance notifications
    console.log("Maintenance notification sent for:", maintenanceId);
  }

  /**
   * Send verification email to new subscriber
   */
  async sendSubscriberVerification(subscriber: Subscriber) {
    const workspace = await storage.getWorkspace(subscriber.workspaceId);
    if (!workspace) return;

    await this.sendEmail(subscriber.email, {
      subject: `Confirm your subscription to ${workspace.name} Status`,
      html: this.getVerificationEmailHtml({
        workspaceName: workspace.name,
        verifyUrl: `https://status.sfs.com/verify/${subscriber.id}?token=${subscriber.verificationToken}`,
      }),
    });
  }

  /**
   * Send email (placeholder - integrate with Resend, SendGrid, etc.)
   */
  private async sendEmail(to: string, options: { subject: string; html: string }) {
    // In production, integrate with email service like Resend
    console.log(`[EMAIL] To: ${to}, Subject: ${options.subject}`);

    // Example with Resend (add resend as dependency):
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'status@sfs.com',
    //   to,
    //   subject: options.subject,
    //   html: options.html,
    // });
  }

  /**
   * Send incident email with dynamic template
   */
  private async sendIncidentEmail(to: string, data: any) {
    let subject = "";
    let html = "";

    switch (data.type) {
      case "incident_created":
        subject = `[${data.severity.toUpperCase()}] ${data.incidentTitle} - ${data.workspaceName}`;
        html = this.getIncidentCreatedHtml(data);
        break;
      case "incident_updated":
        subject = `Update: ${data.incidentTitle} - ${data.workspaceName}`;
        html = this.getIncidentUpdateHtml(data);
        break;
      case "incident_resolved":
        subject = `Resolved: ${data.incidentTitle} - ${data.workspaceName}`;
        html = this.getIncidentResolvedHtml(data);
        break;
    }

    await this.sendEmail(to, { subject, html });
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  private getIncidentCreatedHtml(data: any): string {
    const severityColor = data.severity === "critical" ? "#dc2626" : data.severity === "major" ? "#f59e0b" : "#3b82f6";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .service-badge { display: inline-block; background: #e5e7eb; padding: 4px 12px; border-radius: 12px; margin: 4px; font-size: 14px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${data.incidentTitle}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">New incident reported</p>
            </div>
            <div class="content">
              <p><strong>Affected Services:</strong></p>
              ${data.affectedServices.map((s: string) => `<span class="service-badge">${s}</span>`).join("")}

              <p style="margin-top: 20px;"><strong>Description:</strong></p>
              <p>${data.incidentDescription}</p>

              <a href="${data.statusPageUrl}" class="button">View Status Page</a>
            </div>
            <div class="footer">
              <p>You're receiving this because you subscribed to ${data.workspaceName} status updates.</p>
              <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getIncidentUpdateHtml(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; background: #10b981; color: white; padding: 6px 16px; border-radius: 12px; font-weight: 600; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${data.incidentTitle}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Incident update</p>
            </div>
            <div class="content">
              <p><span class="status-badge">${data.status.toUpperCase()}</span></p>

              <p style="margin-top: 20px;"><strong>Update:</strong></p>
              <p>${data.updateMessage}</p>

              <a href="${data.statusPageUrl}" class="button">View Status Page</a>
            </div>
            <div class="footer">
              <p>You're receiving this because you subscribed to ${data.workspaceName} status updates.</p>
              <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getIncidentResolvedHtml(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .checkmark { font-size: 48px; color: #10b981; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="checkmark">✓</div>
              <h1 style="margin: 10px 0 0 0;">${data.incidentTitle}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Incident resolved</p>
            </div>
            <div class="content">
              <p>Good news! The incident has been resolved. All services are now operational.</p>

              <a href="${data.statusPageUrl}" class="button">View Status Page</a>
            </div>
            <div class="footer">
              <p>You're receiving this because you subscribed to ${data.workspaceName} status updates.</p>
              <p><a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getVerificationEmailHtml(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Confirm Your Subscription</h1>
            </div>
            <div class="content">
              <p>Thank you for subscribing to ${data.workspaceName} status updates!</p>
              <p>Please confirm your subscription by clicking the button below:</p>

              <a href="${data.verifyUrl}" class="button">Verify Subscription</a>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                If you didn't subscribe to these updates, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
