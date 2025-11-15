import {
  type User,
  type InsertUser,
  type Service,
  type InsertService,
  type UpdateService,
  type Incident,
  type InsertIncident,
  type UpdateIncident,
  type IncidentUpdate,
  type InsertIncidentUpdate,
  type UptimeRecord,
  type InsertUptimeRecord,
} from "@shared/schema";
import { randomUUID } from "crypto";

// ===== STORAGE INTERFACE =====
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Services
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: UpdateService): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

  // Incidents
  getIncident(id: string): Promise<Incident | undefined>;
  getAllIncidents(): Promise<Incident[]>;
  getActiveIncidents(): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, updates: UpdateIncident): Promise<Incident | undefined>;
  deleteIncident(id: string): Promise<boolean>;

  // Incident Updates
  getIncidentUpdates(incidentId: string): Promise<IncidentUpdate[]>;
  createIncidentUpdate(update: InsertIncidentUpdate): Promise<IncidentUpdate>;

  // Uptime Records
  getUptimeRecords(serviceId: string, limit?: number): Promise<UptimeRecord[]>;
  createUptimeRecord(record: InsertUptimeRecord): Promise<UptimeRecord>;
  getUptimeStats(serviceId: string, days: number): Promise<{ uptime: number; avgResponseTime: number }>;
}

// ===== IN-MEMORY STORAGE IMPLEMENTATION =====
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private services: Map<string, Service>;
  private incidents: Map<string, Incident>;
  private incidentUpdates: Map<string, IncidentUpdate>;
  private uptimeRecords: Map<string, UptimeRecord>;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.incidents = new Map();
    this.incidentUpdates = new Map();
    this.uptimeRecords = new Map();
  }

  // ===== USERS =====
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      createdAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  // ===== SERVICES =====
  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values()).sort((a, b) =>
      (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    );
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const now = new Date();
    const service: Service = {
      id,
      name: insertService.name,
      type: insertService.type || "api",
      url: insertService.url,
      status: insertService.status || "operational",
      checkInterval: insertService.checkInterval || 300,
      uptime: insertService.uptime || "100.0",
      responseTime: insertService.responseTime || 0,
      lastCheckedAt: insertService.lastCheckedAt || null,
      createdAt: now,
      updatedAt: now,
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, updates: UpdateService): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;

    const updated: Service = {
      ...service,
      ...updates,
      updatedAt: new Date(),
    };
    this.services.set(id, updated);
    return updated;
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  // ===== INCIDENTS =====
  async getIncident(id: string): Promise<Incident | undefined> {
    return this.incidents.get(id);
  }

  async getAllIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values()).sort((a, b) =>
      (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0)
    );
  }

  async getActiveIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .filter(incident => incident.status !== "resolved")
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const id = randomUUID();
    const now = new Date();
    const incident: Incident = {
      id,
      title: insertIncident.title,
      status: insertIncident.status || "investigating",
      affectedServices: insertIncident.affectedServices,
      startedAt: insertIncident.startedAt || now,
      resolvedAt: insertIncident.resolvedAt || null,
      createdAt: now,
      updatedAt: now,
    };
    this.incidents.set(id, incident);

    // Create initial incident update
    await this.createIncidentUpdate({
      incidentId: id,
      status: incident.status,
      message: `Incident created: ${incident.title}`,
    });

    return incident;
  }

  async updateIncident(id: string, updates: UpdateIncident): Promise<Incident | undefined> {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;

    const updated: Incident = {
      ...incident,
      ...updates,
      updatedAt: new Date(),
    };

    // If resolving, set resolvedAt
    if (updates.status === "resolved" && !updated.resolvedAt) {
      updated.resolvedAt = new Date();
    }

    this.incidents.set(id, updated);
    return updated;
  }

  async deleteIncident(id: string): Promise<boolean> {
    // Also delete related incident updates
    const updates = Array.from(this.incidentUpdates.values())
      .filter(update => update.incidentId === id);
    updates.forEach(update => this.incidentUpdates.delete(update.id));

    return this.incidents.delete(id);
  }

  // ===== INCIDENT UPDATES =====
  async getIncidentUpdates(incidentId: string): Promise<IncidentUpdate[]> {
    return Array.from(this.incidentUpdates.values())
      .filter(update => update.incidentId === incidentId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createIncidentUpdate(insertUpdate: InsertIncidentUpdate): Promise<IncidentUpdate> {
    const id = randomUUID();
    const update: IncidentUpdate = {
      id,
      incidentId: insertUpdate.incidentId,
      status: insertUpdate.status,
      message: insertUpdate.message,
      createdAt: new Date(),
    };
    this.incidentUpdates.set(id, update);
    return update;
  }

  // ===== UPTIME RECORDS =====
  async getUptimeRecords(serviceId: string, limit: number = 100): Promise<UptimeRecord[]> {
    return Array.from(this.uptimeRecords.values())
      .filter(record => record.serviceId === serviceId)
      .sort((a, b) => (b.checkedAt?.getTime() || 0) - (a.checkedAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createUptimeRecord(insertRecord: InsertUptimeRecord): Promise<UptimeRecord> {
    const id = randomUUID();
    const record: UptimeRecord = {
      id,
      serviceId: insertRecord.serviceId,
      isUp: insertRecord.isUp,
      responseTime: insertRecord.responseTime || null,
      statusCode: insertRecord.statusCode || null,
      errorMessage: insertRecord.errorMessage || null,
      checkedAt: new Date(),
    };
    this.uptimeRecords.set(id, record);
    return record;
  }

  async getUptimeStats(serviceId: string, days: number): Promise<{ uptime: number; avgResponseTime: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const records = Array.from(this.uptimeRecords.values())
      .filter(record =>
        record.serviceId === serviceId &&
        record.checkedAt &&
        record.checkedAt >= cutoffDate
      );

    if (records.length === 0) {
      return { uptime: 100, avgResponseTime: 0 };
    }

    const upRecords = records.filter(r => r.isUp);
    const uptime = (upRecords.length / records.length) * 100;

    const responseTimes = upRecords
      .map(r => r.responseTime)
      .filter((rt): rt is number => rt !== null);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
      : 0;

    return {
      uptime: Math.round(uptime * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
    };
  }
}

export const storage = new MemStorage();
