import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertWorkspaceSchema,
  insertServiceSchema,
  insertMonitorSchema,
  insertIncidentSchema,
  insertIncidentUpdateSchema,
  insertMaintenanceSchema,
  insertSubscriberSchema,
  insertIntegrationSchema,
} from "../../shared/schema";

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Simple session middleware (extend with proper session management)
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // For now, this is a placeholder
  // In production, implement proper JWT or session-based auth
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).userId = userId;
  next();
};

export const requireWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  const workspaceId = req.params.workspaceId || req.body.workspaceId;
  if (!workspaceId) {
    return res.status(400).json({ error: "Workspace ID required" });
  }

  const workspace = await storage.getWorkspace(workspaceId);
  if (!workspace) {
    return res.status(404).json({ error: "Workspace not found" });
  }

  (req as any).workspace = workspace;
  next();
};

// Validate request body against Zod schema
const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ error: error.errors });
    }
  };
};

// ============================================================================
// API ROUTES
// ============================================================================

export function setupApiRoutes(app: Express) {
  // -------------------------
  // AUTH ROUTES
  // -------------------------

  app.post("/api/auth/register", validateBody(insertUserSchema), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const user = await storage.createUser(req.body);
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.verifyPassword(username, password);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // WORKSPACE ROUTES
  // -------------------------

  app.get("/api/workspaces", requireAuth, async (req, res) => {
    try {
      const workspaces = await storage.getUserWorkspaces((req as any).userId);
      res.json({ workspaces });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workspaces", requireAuth, validateBody(insertWorkspaceSchema), async (req, res) => {
    try {
      const workspace = await storage.createWorkspace({
        ...req.body,
        ownerId: (req as any).userId,
      });
      res.json({ workspace });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workspaces/:workspaceId", requireAuth, requireWorkspace, async (req, res) => {
    res.json({ workspace: (req as any).workspace });
  });

  app.patch("/api/workspaces/:workspaceId", requireAuth, requireWorkspace, async (req, res) => {
    try {
      const updated = await storage.updateWorkspace(req.params.workspaceId, req.body);
      res.json({ workspace: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workspaces/:workspaceId", requireAuth, requireWorkspace, async (req, res) => {
    try {
      await storage.deleteWorkspace(req.params.workspaceId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // WORKSPACE MEMBERS ROUTES
  // -------------------------

  app.get("/api/workspaces/:workspaceId/members", requireAuth, requireWorkspace, async (req, res) => {
    try {
      const members = await storage.getWorkspaceMembers(req.params.workspaceId);
      res.json({ members });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workspaces/:workspaceId/members", requireAuth, requireWorkspace, async (req, res) => {
    try {
      const { userId, role } = req.body;
      const member = await storage.addWorkspaceMember(req.params.workspaceId, userId, role);
      res.json({ member });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workspaces/:workspaceId/members/:userId", requireAuth, requireWorkspace, async (req, res) => {
    try {
      await storage.removeWorkspaceMember(req.params.workspaceId, req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // COMPONENT ROUTES
  // -------------------------

  app.get("/api/workspaces/:workspaceId/components", async (req, res) => {
    try {
      const components = await storage.getComponents(req.params.workspaceId);
      res.json({ components });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workspaces/:workspaceId/components", requireAuth, requireWorkspace, async (req, res) => {
    try {
      const component = await storage.createComponent({
        ...req.body,
        workspaceId: req.params.workspaceId,
      });
      res.json({ component });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/components/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateComponent(req.params.id, req.body);
      res.json({ component: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/components/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteComponent(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // SERVICE ROUTES
  // -------------------------

  app.get("/api/workspaces/:workspaceId/services", async (req, res) => {
    try {
      const services = await storage.getServices(req.params.workspaceId);
      res.json({ services });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ service });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workspaces/:workspaceId/services", requireAuth, validateBody(insertServiceSchema), async (req, res) => {
    try {
      const service = await storage.createService({
        ...req.body,
        workspaceId: req.params.workspaceId,
      });

      // Create default monitor for the service
      await storage.createMonitor({
        serviceId: service.id,
        checkInterval: 60,
        timeout: 30,
        retries: 3,
      });

      res.json({ service });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateService(req.params.id, req.body);
      res.json({ service: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // MONITOR ROUTES
  // -------------------------

  app.get("/api/services/:serviceId/monitor", requireAuth, async (req, res) => {
    try {
      const monitor = await storage.getMonitor(req.params.serviceId);
      res.json({ monitor });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/monitors/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateMonitor(req.params.id, req.body);
      res.json({ monitor: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // METRICS ROUTES
  // -------------------------

  app.get("/api/services/:serviceId/metrics", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const metrics = await storage.getServiceMetrics(req.params.serviceId, since);
      res.json({ metrics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/services/:serviceId/uptime", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const uptime = await storage.calculateUptime(req.params.serviceId, since);
      res.json({ uptime });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/services/:serviceId/status-history", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 90;
      const history = await storage.getStatusHistory(req.params.serviceId, days);
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // INCIDENT ROUTES
  // -------------------------

  app.get("/api/workspaces/:workspaceId/incidents", async (req, res) => {
    try {
      const incidents = await storage.getIncidents(req.params.workspaceId);
      res.json({ incidents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/incidents/:id", async (req, res) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json({ incident });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workspaces/:workspaceId/incidents", requireAuth, validateBody(insertIncidentSchema), async (req, res) => {
    try {
      const incident = await storage.createIncident({
        ...req.body,
        workspaceId: req.params.workspaceId,
        createdBy: (req as any).userId,
      });

      // Add affected services
      if (req.body.affectedServices && Array.isArray(req.body.affectedServices)) {
        for (const serviceId of req.body.affectedServices) {
          await storage.addIncidentService(incident.id, serviceId);
        }
      }

      res.json({ incident });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/incidents/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateIncident(req.params.id, req.body);
      res.json({ incident: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/incidents/:id/resolve", requireAuth, async (req, res) => {
    try {
      await storage.resolveIncident(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // INCIDENT UPDATE ROUTES
  // -------------------------

  app.get("/api/incidents/:incidentId/updates", async (req, res) => {
    try {
      const updates = await storage.getIncidentUpdates(req.params.incidentId);
      res.json({ updates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/incidents/:incidentId/updates", requireAuth, validateBody(insertIncidentUpdateSchema), async (req, res) => {
    try {
      const update = await storage.createIncidentUpdate({
        ...req.body,
        incidentId: req.params.incidentId,
        createdBy: (req as any).userId,
      });
      res.json({ update });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // MAINTENANCE ROUTES
  // -------------------------

  app.get("/api/workspaces/:workspaceId/maintenance", async (req, res) => {
    try {
      const maintenance = await storage.getMaintenanceWindows(req.params.workspaceId);
      res.json({ maintenance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workspaces/:workspaceId/maintenance/upcoming", async (req, res) => {
    try {
      const maintenance = await storage.getUpcomingMaintenance(req.params.workspaceId);
      res.json({ maintenance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workspaces/:workspaceId/maintenance", requireAuth, validateBody(insertMaintenanceSchema), async (req, res) => {
    try {
      const maintenance = await storage.createMaintenance({
        ...req.body,
        workspaceId: req.params.workspaceId,
        createdBy: (req as any).userId,
      });

      // Add affected services
      if (req.body.affectedServices && Array.isArray(req.body.affectedServices)) {
        for (const serviceId of req.body.affectedServices) {
          await storage.addMaintenanceService(maintenance.id, serviceId);
        }
      }

      res.json({ maintenance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/maintenance/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateMaintenance(req.params.id, req.body);
      res.json({ maintenance: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // SUBSCRIBER ROUTES
  // -------------------------

  app.get("/api/workspaces/:workspaceId/subscribers", requireAuth, requireWorkspace, async (req, res) => {
    try {
      const subscribers = await storage.getSubscribers(req.params.workspaceId);
      res.json({ subscribers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workspaces/:workspaceId/subscribe", validateBody(insertSubscriberSchema), async (req, res) => {
    try {
      const subscriber = await storage.createSubscriber({
        workspaceId: req.params.workspaceId,
        email: req.body.email,
      });
      res.json({ subscriber });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/subscribers/:id/verify", async (req, res) => {
    try {
      await storage.verifySubscriber(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/unsubscribe/:token", async (req, res) => {
    try {
      await storage.unsubscribe(req.params.token);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // INTEGRATION ROUTES
  // -------------------------

  app.get("/api/workspaces/:workspaceId/integrations", requireAuth, requireWorkspace, async (req, res) => {
    try {
      const integrations = await storage.getIntegrations(req.params.workspaceId);
      res.json({ integrations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workspaces/:workspaceId/integrations", requireAuth, validateBody(insertIntegrationSchema), async (req, res) => {
    try {
      const integration = await storage.createIntegration({
        ...req.body,
        workspaceId: req.params.workspaceId,
      });
      res.json({ integration });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/integrations/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateIntegration(req.params.id, req.body);
      res.json({ integration: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/integrations/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteIntegration(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // API KEY ROUTES
  // -------------------------

  app.post("/api/workspaces/:workspaceId/api-keys", requireAuth, requireWorkspace, async (req, res) => {
    try {
      const apiKey = await storage.createApiKey(
        req.params.workspaceId,
        req.body.name,
        (req as any).userId
      );
      res.json({ apiKey });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/api-keys/:id", requireAuth, async (req, res) => {
    try {
      await storage.revokeApiKey(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // AUDIT LOG ROUTES
  // -------------------------

  app.get("/api/workspaces/:workspaceId/audit-logs", requireAuth, requireWorkspace, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(req.params.workspaceId, limit);
      res.json({ logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // -------------------------
  // PUBLIC STATUS PAGE ROUTES (no auth required)
  // -------------------------

  app.get("/api/public/status/:slug", async (req, res) => {
    try {
      const workspace = await storage.getWorkspaceBySlug(req.params.slug);
      if (!workspace) {
        return res.status(404).json({ error: "Status page not found" });
      }

      const [services, activeIncidents, upcomingMaintenance] = await Promise.all([
        storage.getServices(workspace.id),
        storage.getActiveIncidents(workspace.id),
        storage.getUpcomingMaintenance(workspace.id),
      ]);

      res.json({
        workspace: {
          name: workspace.name,
          logoUrl: workspace.logoUrl,
          primaryColor: workspace.primaryColor,
        },
        services,
        activeIncidents,
        upcomingMaintenance,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
