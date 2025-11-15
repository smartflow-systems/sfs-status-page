import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { monitoringEngine } from "./monitoring";
import {
  insertServiceSchema,
  updateServiceSchema,
  insertIncidentSchema,
  updateIncidentSchema,
  insertIncidentUpdateSchema,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {

  // ========================================
  // SERVICES ROUTES
  // ========================================

  // GET /api/services - Get all services
  app.get("/api/services", async (req: Request, res: Response) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // GET /api/services/:id - Get a single service
  app.get("/api/services/:id", async (req: Request, res: Response) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // POST /api/services - Create a new service
  app.post("/api/services", async (req: Request, res: Response) => {
    try {
      const result = insertServiceSchema.safeParse(req.body);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationError.details,
        });
      }

      const service = await storage.createService(result.data);

      // Start monitoring the new service
      await monitoringEngine.monitorService(service.id);

      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // PATCH /api/services/:id - Update a service
  app.patch("/api/services/:id", async (req: Request, res: Response) => {
    try {
      const result = updateServiceSchema.safeParse(req.body);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationError.details,
        });
      }

      const service = await storage.updateService(req.params.id, result.data);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // DELETE /api/services/:id - Delete a service
  app.delete("/api/services/:id", async (req: Request, res: Response) => {
    try {
      // Stop monitoring before deleting
      monitoringEngine.stopMonitoringService(req.params.id);

      const deleted = await storage.deleteService(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // GET /api/services/:id/uptime - Get uptime stats for a service
  app.get("/api/services/:id/uptime", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getUptimeStats(req.params.id, days);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching uptime stats:", error);
      res.status(500).json({ message: "Failed to fetch uptime stats" });
    }
  });

  // GET /api/services/:id/records - Get uptime records for a service
  app.get("/api/services/:id/records", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const records = await storage.getUptimeRecords(req.params.id, limit);
      res.json(records);
    } catch (error) {
      console.error("Error fetching uptime records:", error);
      res.status(500).json({ message: "Failed to fetch uptime records" });
    }
  });

  // ========================================
  // INCIDENTS ROUTES
  // ========================================

  // GET /api/incidents - Get all incidents
  app.get("/api/incidents", async (req: Request, res: Response) => {
    try {
      const active = req.query.active === "true";
      const incidents = active
        ? await storage.getActiveIncidents()
        : await storage.getAllIncidents();

      // Fetch updates for each incident
      const incidentsWithUpdates = await Promise.all(
        incidents.map(async (incident) => {
          const updates = await storage.getIncidentUpdates(incident.id);
          return { ...incident, updates };
        })
      );

      res.json(incidentsWithUpdates);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  // GET /api/incidents/:id - Get a single incident
  app.get("/api/incidents/:id", async (req: Request, res: Response) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      const updates = await storage.getIncidentUpdates(incident.id);
      res.json({ ...incident, updates });
    } catch (error) {
      console.error("Error fetching incident:", error);
      res.status(500).json({ message: "Failed to fetch incident" });
    }
  });

  // POST /api/incidents - Create a new incident
  app.post("/api/incidents", async (req: Request, res: Response) => {
    try {
      const result = insertIncidentSchema.safeParse(req.body);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationError.details,
        });
      }

      const incident = await storage.createIncident(result.data);

      // Update affected services status to "down"
      for (const serviceId of result.data.affectedServices) {
        await storage.updateService(serviceId, { status: "down" });
      }

      const updates = await storage.getIncidentUpdates(incident.id);
      res.status(201).json({ ...incident, updates });
    } catch (error) {
      console.error("Error creating incident:", error);
      res.status(500).json({ message: "Failed to create incident" });
    }
  });

  // PATCH /api/incidents/:id - Update an incident
  app.patch("/api/incidents/:id", async (req: Request, res: Response) => {
    try {
      const result = updateIncidentSchema.safeParse(req.body);

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationError.details,
        });
      }

      const incident = await storage.updateIncident(req.params.id, result.data);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // If resolving, update affected services back to operational
      if (result.data.status === "resolved") {
        for (const serviceId of incident.affectedServices) {
          await storage.updateService(serviceId, { status: "operational" });
        }
      }

      const updates = await storage.getIncidentUpdates(incident.id);
      res.json({ ...incident, updates });
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(500).json({ message: "Failed to update incident" });
    }
  });

  // DELETE /api/incidents/:id - Delete an incident
  app.delete("/api/incidents/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteIncident(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Incident not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(500).json({ message: "Failed to delete incident" });
    }
  });

  // POST /api/incidents/:id/updates - Add an update to an incident
  app.post("/api/incidents/:id/updates", async (req: Request, res: Response) => {
    try {
      const result = insertIncidentUpdateSchema.safeParse({
        ...req.body,
        incidentId: req.params.id,
      });

      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationError.details,
        });
      }

      // Verify incident exists
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      const update = await storage.createIncidentUpdate(result.data);

      // Update the incident status to match the new update status
      await storage.updateIncident(req.params.id, { status: result.data.status });

      res.status(201).json(update);
    } catch (error) {
      console.error("Error creating incident update:", error);
      res.status(500).json({ message: "Failed to create incident update" });
    }
  });

  // ========================================
  // SYSTEM STATUS ROUTE
  // ========================================

  // GET /api/status - Get overall system status
  app.get("/api/status", async (req: Request, res: Response) => {
    try {
      const services = await storage.getAllServices();
      const activeIncidents = await storage.getActiveIncidents();

      // Determine overall status
      let status: "operational" | "degraded" | "down" = "operational";
      const downServices = services.filter(s => s.status === "down");
      const degradedServices = services.filter(s => s.status === "degraded");

      if (downServices.length > 0) {
        status = "down";
      } else if (degradedServices.length > 0 || activeIncidents.length > 0) {
        status = "degraded";
      }

      // Calculate average uptime
      const uptimes = services
        .map(s => parseFloat(s.uptime || "100"))
        .filter(u => !isNaN(u));
      const avgUptime = uptimes.length > 0
        ? (uptimes.reduce((sum, u) => sum + u, 0) / uptimes.length).toFixed(2)
        : "100.00";

      res.json({
        status,
        totalServices: services.length,
        activeIncidents: activeIncidents.length,
        averageUptime: avgUptime,
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
        })),
      });
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
