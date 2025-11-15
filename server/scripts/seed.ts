import { storage } from "../storage";
import { db } from "../db";
import { log } from "../vite";

/**
 * Seed script to create demo data for testing
 * Run with: npm run seed
 */
async function seed() {
  try {
    log("🌱 Seeding database with demo data...");

    // Create demo user
    log("Creating demo user...");
    const user = await storage.createUser({
      username: "demo",
      email: "demo@sfs.com",
      password: "demo123",
      fullName: "Demo User",
    });
    log(`✓ User created: ${user.username} (${user.id})`);

    // Create demo workspace
    log("Creating demo workspace...");
    const workspace = await storage.createWorkspace({
      name: "Acme Corporation",
      slug: "acme",
      subdomain: "acme",
      ownerId: user.id,
    });
    log(`✓ Workspace created: ${workspace.name} (${workspace.id})`);

    // Create component groups
    log("Creating component groups...");
    const apiComponent = await storage.createComponent({
      workspaceId: workspace.id,
      name: "API Services",
      description: "Core API and backend services",
      displayOrder: 0,
      isExpanded: true,
    });

    const webComponent = await storage.createComponent({
      workspaceId: workspace.id,
      name: "Web & CDN",
      description: "Frontend applications and CDN",
      displayOrder: 1,
      isExpanded: true,
    });
    log(`✓ Created ${2} component groups`);

    // Create demo services
    log("Creating demo services...");
    const services = [
      {
        workspaceId: workspace.id,
        componentId: apiComponent.id,
        name: "Main API",
        description: "Primary REST API",
        url: "https://api.github.com",
        type: "https" as const,
        monitoringEnabled: true,
        displayOrder: 0,
      },
      {
        workspaceId: workspace.id,
        componentId: apiComponent.id,
        name: "Authentication Service",
        description: "User authentication and sessions",
        url: "https://httpbin.org/status/200",
        type: "https" as const,
        monitoringEnabled: true,
        displayOrder: 1,
      },
      {
        workspaceId: workspace.id,
        componentId: webComponent.id,
        name: "Website",
        description: "Main company website",
        url: "https://www.google.com",
        type: "https" as const,
        monitoringEnabled: true,
        displayOrder: 0,
      },
      {
        workspaceId: workspace.id,
        componentId: webComponent.id,
        name: "CDN",
        description: "Content delivery network",
        url: "https://cdn.jsdelivr.net/",
        type: "https" as const,
        monitoringEnabled: true,
        displayOrder: 1,
      },
    ];

    for (const serviceData of services) {
      const service = await storage.createService(serviceData);

      // Create monitor for each service
      await storage.createMonitor({
        serviceId: service.id,
        checkInterval: 60, // Check every 60 seconds
        timeout: 30,
        retries: 3,
        expectedStatusCode: 200,
      });

      log(`✓ Service created: ${service.name}`);
    }

    // Create demo subscriber
    log("Creating demo subscriber...");
    await storage.createSubscriber({
      workspaceId: workspace.id,
      email: "subscriber@example.com",
    });
    log("✓ Subscriber created");

    // Create demo integration
    log("Creating demo Slack integration...");
    await storage.createIntegration({
      workspaceId: workspace.id,
      name: "Engineering Alerts",
      channel: "slack",
      enabled: false, // Disabled by default (no webhook URL)
      config: {
        webhookUrl: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
      },
      events: ["incident.created", "incident.updated", "incident.resolved"],
    });
    log("✓ Integration created (disabled)");

    log("\n🎉 Seeding complete!\n");
    log("Demo credentials:");
    log("  Username: demo");
    log("  Password: demo123");
    log("  Email: demo@sfs.com\n");
    log("Demo workspace:");
    log(`  Name: ${workspace.name}`);
    log(`  Slug: ${workspace.slug}`);
    log(`  Public URL: http://localhost:5000/status/${workspace.slug}\n`);
    log("Services created: 4");
    log("Health checks will start automatically!\n");
    log("Watch the console for health check logs...");

  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

// Run seed
seed().then(() => {
  log("✓ Seed script completed");
  process.exit(0);
});
