import { eq, and, desc, asc, gte, lte, sql, inArray } from "drizzle-orm";
import { db } from "./index";
import * as schema from "../../shared/schema";
import type {
  User,
  InsertUser,
  Workspace,
  InsertWorkspace,
  Service,
  InsertService,
  Monitor,
  InsertMonitor,
  Metric,
  Incident,
  InsertIncident,
  IncidentUpdate,
  InsertIncidentUpdate,
  MaintenanceWindow,
  InsertMaintenance,
  Subscriber,
  InsertSubscriber,
  Integration,
  InsertIntegration,
  Component,
} from "../../shared/schema";
import { randomUUID } from "crypto";
import { hash, compare } from "bcryptjs";

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  verifyPassword(username: string, password: string): Promise<User | null>;

  // Workspaces
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | undefined>;
  getWorkspaceBySubdomain(subdomain: string): Promise<Workspace | undefined>;
  getUserWorkspaces(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace & { ownerId: string }): Promise<Workspace>;
  updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<void>;

  // Workspace Members
  getWorkspaceMembers(workspaceId: string): Promise<any[]>;
  addWorkspaceMember(workspaceId: string, userId: string, role: string): Promise<any>;
  removeWorkspaceMember(workspaceId: string, userId: string): Promise<void>;
  getUserRole(workspaceId: string, userId: string): Promise<string | null>;

  // Components
  getComponents(workspaceId: string): Promise<Component[]>;
  getComponent(id: string): Promise<Component | undefined>;
  createComponent(component: Omit<Component, "id" | "createdAt" | "updatedAt">): Promise<Component>;
  updateComponent(id: string, data: Partial<Component>): Promise<Component | undefined>;
  deleteComponent(id: string): Promise<void>;

  // Services
  getServices(workspaceId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, data: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;
  updateServiceStatus(id: string, status: string): Promise<void>;

  // Monitors
  getMonitor(serviceId: string): Promise<Monitor | undefined>;
  getMonitorsDue(): Promise<Monitor[]>;
  createMonitor(monitor: InsertMonitor): Promise<Monitor>;
  updateMonitor(id: string, data: Partial<Monitor>): Promise<Monitor | undefined>;
  updateMonitorCheckTime(id: string, lastCheck: Date, nextCheck: Date): Promise<void>;

  // Metrics
  createMetric(metric: Omit<Metric, "id">): Promise<Metric>;
  getServiceMetrics(serviceId: string, since: Date): Promise<Metric[]>;
  getLatestMetrics(serviceId: string, limit: number): Promise<Metric[]>;
  calculateUptime(serviceId: string, since: Date): Promise<number>;

  // Status History
  getStatusHistory(serviceId: string, days: number): Promise<any[]>;
  aggregateDailyStatus(serviceId: string, date: Date): Promise<void>;

  // Incidents
  getIncidents(workspaceId: string): Promise<any[]>;
  getIncident(id: string): Promise<any | undefined>;
  getActiveIncidents(workspaceId: string): Promise<any[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, data: Partial<Incident>): Promise<Incident | undefined>;
  resolveIncident(id: string): Promise<void>;
  addIncidentService(incidentId: string, serviceId: string): Promise<void>;
  removeIncidentService(incidentId: string, serviceId: string): Promise<void>;

  // Incident Updates
  createIncidentUpdate(update: InsertIncidentUpdate): Promise<IncidentUpdate>;
  getIncidentUpdates(incidentId: string): Promise<IncidentUpdate[]>;

  // Maintenance Windows
  getMaintenanceWindows(workspaceId: string): Promise<MaintenanceWindow[]>;
  getUpcomingMaintenance(workspaceId: string): Promise<MaintenanceWindow[]>;
  createMaintenance(maintenance: InsertMaintenance): Promise<MaintenanceWindow>;
  updateMaintenance(id: string, data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow | undefined>;
  addMaintenanceService(maintenanceId: string, serviceId: string): Promise<void>;

  // Subscribers
  getSubscribers(workspaceId: string): Promise<Subscriber[]>;
  getSubscriber(workspaceId: string, email: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  verifySubscriber(id: string): Promise<void>;
  unsubscribe(token: string): Promise<void>;

  // Integrations
  getIntegrations(workspaceId: string): Promise<Integration[]>;
  getActiveIntegrations(workspaceId: string, event: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, data: Partial<Integration>): Promise<Integration | undefined>;
  deleteIntegration(id: string): Promise<void>;

  // API Keys
  createApiKey(workspaceId: string, name: string, createdBy: string): Promise<any>;
  getApiKey(key: string): Promise<any | undefined>;
  validateApiKey(key: string): Promise<Workspace | null>;
  revokeApiKey(id: string): Promise<void>;

  // Audit Logs
  createAuditLog(log: {
    workspaceId: string;
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
  getAuditLogs(workspaceId: string, limit: number): Promise<any[]>;
}

// ============================================================================
// DATABASE STORAGE IMPLEMENTATION
// ============================================================================

export class DatabaseStorage implements IStorage {
  // -------------------------
  // USERS
  // -------------------------

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hash(insertUser.password, 10);
    const [user] = await db
      .insert(schema.users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updated;
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const isValid = await compare(password, user.password);
    return isValid ? user : null;
  }

  // -------------------------
  // WORKSPACES
  // -------------------------

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.id, id));
    return workspace;
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, slug));
    return workspace;
  }

  async getWorkspaceBySubdomain(subdomain: string): Promise<Workspace | undefined> {
    const [workspace] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.subdomain, subdomain));
    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const workspaces = await db
      .select({ workspace: schema.workspaces })
      .from(schema.workspaces)
      .leftJoin(schema.workspaceMembers, eq(schema.workspaces.id, schema.workspaceMembers.workspaceId))
      .where(eq(schema.workspaceMembers.userId, userId));
    return workspaces.map((w) => w.workspace);
  }

  async createWorkspace(data: InsertWorkspace & { ownerId: string }): Promise<Workspace> {
    const [workspace] = await db.insert(schema.workspaces).values(data).returning();
    // Add owner as admin member
    await db.insert(schema.workspaceMembers).values({
      workspaceId: workspace.id,
      userId: data.ownerId,
      role: "owner",
    });
    return workspace;
  }

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace | undefined> {
    const [updated] = await db
      .update(schema.workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.workspaces.id, id))
      .returning();
    return updated;
  }

  async deleteWorkspace(id: string): Promise<void> {
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, id));
  }

  // -------------------------
  // WORKSPACE MEMBERS
  // -------------------------

  async getWorkspaceMembers(workspaceId: string): Promise<any[]> {
    const members = await db
      .select({
        id: schema.workspaceMembers.id,
        role: schema.workspaceMembers.role,
        joinedAt: schema.workspaceMembers.joinedAt,
        user: schema.users,
      })
      .from(schema.workspaceMembers)
      .innerJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id))
      .where(eq(schema.workspaceMembers.workspaceId, workspaceId));
    return members;
  }

  async addWorkspaceMember(workspaceId: string, userId: string, role: string): Promise<any> {
    const [member] = await db
      .insert(schema.workspaceMembers)
      .values({ workspaceId, userId, role: role as any })
      .returning();
    return member;
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    await db
      .delete(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.userId, userId),
        ),
      );
  }

  async getUserRole(workspaceId: string, userId: string): Promise<string | null> {
    const [member] = await db
      .select({ role: schema.workspaceMembers.role })
      .from(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, workspaceId),
          eq(schema.workspaceMembers.userId, userId),
        ),
      );
    return member?.role || null;
  }

  // -------------------------
  // COMPONENTS
  // -------------------------

  async getComponents(workspaceId: string): Promise<Component[]> {
    return await db
      .select()
      .from(schema.components)
      .where(eq(schema.components.workspaceId, workspaceId))
      .orderBy(asc(schema.components.displayOrder));
  }

  async getComponent(id: string): Promise<Component | undefined> {
    const [component] = await db.select().from(schema.components).where(eq(schema.components.id, id));
    return component;
  }

  async createComponent(data: Omit<Component, "id" | "createdAt" | "updatedAt">): Promise<Component> {
    const [component] = await db.insert(schema.components).values(data).returning();
    return component;
  }

  async updateComponent(id: string, data: Partial<Component>): Promise<Component | undefined> {
    const [updated] = await db
      .update(schema.components)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.components.id, id))
      .returning();
    return updated;
  }

  async deleteComponent(id: string): Promise<void> {
    await db.delete(schema.components).where(eq(schema.components.id, id));
  }

  // -------------------------
  // SERVICES
  // -------------------------

  async getServices(workspaceId: string): Promise<Service[]> {
    return await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.workspaceId, workspaceId))
      .orderBy(asc(schema.services.displayOrder));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(schema.services).where(eq(schema.services.id, id));
    return service;
  }

  async createService(data: InsertService): Promise<Service> {
    const [service] = await db.insert(schema.services).values(data).returning();
    return service;
  }

  async updateService(id: string, data: Partial<Service>): Promise<Service | undefined> {
    const [updated] = await db
      .update(schema.services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.services.id, id))
      .returning();
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(schema.services).where(eq(schema.services.id, id));
  }

  async updateServiceStatus(id: string, status: string): Promise<void> {
    await db
      .update(schema.services)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(schema.services.id, id));
  }

  // -------------------------
  // MONITORS
  // -------------------------

  async getMonitor(serviceId: string): Promise<Monitor | undefined> {
    const [monitor] = await db.select().from(schema.monitors).where(eq(schema.monitors.serviceId, serviceId));
    return monitor;
  }

  async getMonitorsDue(): Promise<Monitor[]> {
    const now = new Date();
    return await db
      .select()
      .from(schema.monitors)
      .where(
        sql`${schema.monitors.nextCheckAt} <= ${now} OR ${schema.monitors.nextCheckAt} IS NULL`,
      );
  }

  async createMonitor(data: InsertMonitor): Promise<Monitor> {
    const now = new Date();
    const [monitor] = await db
      .insert(schema.monitors)
      .values({
        ...data,
        nextCheckAt: now,
      })
      .returning();
    return monitor;
  }

  async updateMonitor(id: string, data: Partial<Monitor>): Promise<Monitor | undefined> {
    const [updated] = await db
      .update(schema.monitors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.monitors.id, id))
      .returning();
    return updated;
  }

  async updateMonitorCheckTime(id: string, lastCheck: Date, nextCheck: Date): Promise<void> {
    await db
      .update(schema.monitors)
      .set({ lastCheckAt: lastCheck, nextCheckAt: nextCheck })
      .where(eq(schema.monitors.id, id));
  }

  // -------------------------
  // METRICS
  // -------------------------

  async createMetric(data: Omit<Metric, "id">): Promise<Metric> {
    const [metric] = await db.insert(schema.metrics).values(data).returning();
    return metric;
  }

  async getServiceMetrics(serviceId: string, since: Date): Promise<Metric[]> {
    return await db
      .select()
      .from(schema.metrics)
      .where(and(eq(schema.metrics.serviceId, serviceId), gte(schema.metrics.checkedAt, since)))
      .orderBy(desc(schema.metrics.checkedAt));
  }

  async getLatestMetrics(serviceId: string, limit: number): Promise<Metric[]> {
    return await db
      .select()
      .from(schema.metrics)
      .where(eq(schema.metrics.serviceId, serviceId))
      .orderBy(desc(schema.metrics.checkedAt))
      .limit(limit);
  }

  async calculateUptime(serviceId: string, since: Date): Promise<number> {
    const [result] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        successful: sql<number>`COUNT(*) FILTER (WHERE ${schema.metrics.isUp} = true)`,
      })
      .from(schema.metrics)
      .where(and(eq(schema.metrics.serviceId, serviceId), gte(schema.metrics.checkedAt, since)));

    if (!result || result.total === 0) return 100;
    return (result.successful / result.total) * 100;
  }

  // -------------------------
  // STATUS HISTORY
  // -------------------------

  async getStatusHistory(serviceId: string, days: number): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return await db
      .select()
      .from(schema.statusHistory)
      .where(and(eq(schema.statusHistory.serviceId, serviceId), gte(schema.statusHistory.date, since)))
      .orderBy(asc(schema.statusHistory.date));
  }

  async aggregateDailyStatus(serviceId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        successful: sql<number>`COUNT(*) FILTER (WHERE ${schema.metrics.isUp} = true)`,
        avgResponseTime: sql<number>`AVG(${schema.metrics.responseTime})`,
      })
      .from(schema.metrics)
      .where(
        and(
          eq(schema.metrics.serviceId, serviceId),
          gte(schema.metrics.checkedAt, startOfDay),
          lte(schema.metrics.checkedAt, endOfDay),
        ),
      );

    if (stats && stats.total > 0) {
      const uptimePercentage = (stats.successful / stats.total) * 100;
      await db
        .insert(schema.statusHistory)
        .values({
          serviceId,
          date: startOfDay,
          uptimePercentage,
          totalChecks: stats.total,
          successfulChecks: stats.successful,
          avgResponseTime: Math.round(stats.avgResponseTime || 0),
        })
        .onConflictDoUpdate({
          target: [schema.statusHistory.serviceId, schema.statusHistory.date],
          set: {
            uptimePercentage,
            totalChecks: stats.total,
            successfulChecks: stats.successful,
            avgResponseTime: Math.round(stats.avgResponseTime || 0),
          },
        });
    }
  }

  // -------------------------
  // INCIDENTS
  // -------------------------

  async getIncidents(workspaceId: string): Promise<any[]> {
    const incidents = await db
      .select({
        incident: schema.incidents,
        affectedServices: sql<string[]>`
          ARRAY_AGG(${schema.services.name}) FILTER (WHERE ${schema.services.name} IS NOT NULL)
        `,
      })
      .from(schema.incidents)
      .leftJoin(schema.incidentServices, eq(schema.incidents.id, schema.incidentServices.incidentId))
      .leftJoin(schema.services, eq(schema.incidentServices.serviceId, schema.services.id))
      .where(eq(schema.incidents.workspaceId, workspaceId))
      .groupBy(schema.incidents.id)
      .orderBy(desc(schema.incidents.createdAt));

    return incidents;
  }

  async getIncident(id: string): Promise<any | undefined> {
    const [incident] = await db
      .select({
        incident: schema.incidents,
        updates: sql<any[]>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${schema.incidentUpdates.id},
                'status', ${schema.incidentUpdates.status},
                'message', ${schema.incidentUpdates.message},
                'createdAt', ${schema.incidentUpdates.createdAt}
              )
              ORDER BY ${schema.incidentUpdates.createdAt} DESC
            ) FILTER (WHERE ${schema.incidentUpdates.id} IS NOT NULL),
            '[]'
          )
        `,
      })
      .from(schema.incidents)
      .leftJoin(schema.incidentUpdates, eq(schema.incidents.id, schema.incidentUpdates.incidentId))
      .where(eq(schema.incidents.id, id))
      .groupBy(schema.incidents.id);

    return incident;
  }

  async getActiveIncidents(workspaceId: string): Promise<any[]> {
    return await db
      .select()
      .from(schema.incidents)
      .where(
        and(
          eq(schema.incidents.workspaceId, workspaceId),
          sql`${schema.incidents.status} != 'resolved'`,
        ),
      )
      .orderBy(desc(schema.incidents.createdAt));
  }

  async createIncident(data: InsertIncident): Promise<Incident> {
    const [incident] = await db.insert(schema.incidents).values(data).returning();
    return incident;
  }

  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident | undefined> {
    const [updated] = await db
      .update(schema.incidents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.incidents.id, id))
      .returning();
    return updated;
  }

  async resolveIncident(id: string): Promise<void> {
    await db
      .update(schema.incidents)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.incidents.id, id));
  }

  async addIncidentService(incidentId: string, serviceId: string): Promise<void> {
    await db.insert(schema.incidentServices).values({ incidentId, serviceId });
  }

  async removeIncidentService(incidentId: string, serviceId: string): Promise<void> {
    await db
      .delete(schema.incidentServices)
      .where(
        and(
          eq(schema.incidentServices.incidentId, incidentId),
          eq(schema.incidentServices.serviceId, serviceId),
        ),
      );
  }

  // -------------------------
  // INCIDENT UPDATES
  // -------------------------

  async createIncidentUpdate(data: InsertIncidentUpdate): Promise<IncidentUpdate> {
    const [update] = await db.insert(schema.incidentUpdates).values(data).returning();
    // Also update the incident status
    await db
      .update(schema.incidents)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(schema.incidents.id, data.incidentId));
    return update;
  }

  async getIncidentUpdates(incidentId: string): Promise<IncidentUpdate[]> {
    return await db
      .select()
      .from(schema.incidentUpdates)
      .where(eq(schema.incidentUpdates.incidentId, incidentId))
      .orderBy(desc(schema.incidentUpdates.createdAt));
  }

  // -------------------------
  // MAINTENANCE WINDOWS
  // -------------------------

  async getMaintenanceWindows(workspaceId: string): Promise<MaintenanceWindow[]> {
    return await db
      .select()
      .from(schema.maintenanceWindows)
      .where(eq(schema.maintenanceWindows.workspaceId, workspaceId))
      .orderBy(desc(schema.maintenanceWindows.scheduledStart));
  }

  async getUpcomingMaintenance(workspaceId: string): Promise<MaintenanceWindow[]> {
    const now = new Date();
    return await db
      .select()
      .from(schema.maintenanceWindows)
      .where(
        and(
          eq(schema.maintenanceWindows.workspaceId, workspaceId),
          gte(schema.maintenanceWindows.scheduledStart, now),
          sql`${schema.maintenanceWindows.status} != 'completed' AND ${schema.maintenanceWindows.status} != 'cancelled'`,
        ),
      )
      .orderBy(asc(schema.maintenanceWindows.scheduledStart));
  }

  async createMaintenance(data: InsertMaintenance): Promise<MaintenanceWindow> {
    const [maintenance] = await db.insert(schema.maintenanceWindows).values(data).returning();
    return maintenance;
  }

  async updateMaintenance(id: string, data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow | undefined> {
    const [updated] = await db
      .update(schema.maintenanceWindows)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.maintenanceWindows.id, id))
      .returning();
    return updated;
  }

  async addMaintenanceService(maintenanceId: string, serviceId: string): Promise<void> {
    await db.insert(schema.maintenanceServices).values({ maintenanceId, serviceId });
  }

  // -------------------------
  // SUBSCRIBERS
  // -------------------------

  async getSubscribers(workspaceId: string): Promise<Subscriber[]> {
    return await db
      .select()
      .from(schema.subscribers)
      .where(
        and(
          eq(schema.subscribers.workspaceId, workspaceId),
          sql`${schema.subscribers.unsubscribedAt} IS NULL`,
        ),
      );
  }

  async getSubscriber(workspaceId: string, email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db
      .select()
      .from(schema.subscribers)
      .where(
        and(eq(schema.subscribers.workspaceId, workspaceId), eq(schema.subscribers.email, email)),
      );
    return subscriber;
  }

  async createSubscriber(data: InsertSubscriber): Promise<Subscriber> {
    const unsubscribeToken = randomUUID();
    const verificationToken = randomUUID();
    const [subscriber] = await db
      .insert(schema.subscribers)
      .values({
        ...data,
        unsubscribeToken,
        verificationToken,
      })
      .returning();
    return subscriber;
  }

  async verifySubscriber(id: string): Promise<void> {
    await db
      .update(schema.subscribers)
      .set({ verified: true, verificationToken: null })
      .where(eq(schema.subscribers.id, id));
  }

  async unsubscribe(token: string): Promise<void> {
    await db
      .update(schema.subscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(schema.subscribers.unsubscribeToken, token));
  }

  // -------------------------
  // INTEGRATIONS
  // -------------------------

  async getIntegrations(workspaceId: string): Promise<Integration[]> {
    return await db
      .select()
      .from(schema.integrations)
      .where(eq(schema.integrations.workspaceId, workspaceId));
  }

  async getActiveIntegrations(workspaceId: string, event: string): Promise<Integration[]> {
    return await db
      .select()
      .from(schema.integrations)
      .where(
        and(
          eq(schema.integrations.workspaceId, workspaceId),
          eq(schema.integrations.enabled, true),
          sql`${schema.integrations.events} @> ARRAY[${event}]::text[]`,
        ),
      );
  }

  async createIntegration(data: InsertIntegration): Promise<Integration> {
    const [integration] = await db.insert(schema.integrations).values(data).returning();
    return integration;
  }

  async updateIntegration(id: string, data: Partial<Integration>): Promise<Integration | undefined> {
    const [updated] = await db
      .update(schema.integrations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.integrations.id, id))
      .returning();
    return updated;
  }

  async deleteIntegration(id: string): Promise<void> {
    await db.delete(schema.integrations).where(eq(schema.integrations.id, id));
  }

  // -------------------------
  // API KEYS
  // -------------------------

  async createApiKey(workspaceId: string, name: string, createdBy: string): Promise<any> {
    const key = `sfs_${randomUUID().replace(/-/g, "")}`;
    const [apiKey] = await db
      .insert(schema.apiKeys)
      .values({
        workspaceId,
        name,
        key,
        createdBy,
      })
      .returning();
    return apiKey;
  }

  async getApiKey(key: string): Promise<any | undefined> {
    const [apiKey] = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.key, key));
    return apiKey;
  }

  async validateApiKey(key: string): Promise<Workspace | null> {
    const [result] = await db
      .select({ workspace: schema.workspaces })
      .from(schema.apiKeys)
      .innerJoin(schema.workspaces, eq(schema.apiKeys.workspaceId, schema.workspaces.id))
      .where(
        and(
          eq(schema.apiKeys.key, key),
          sql`(${schema.apiKeys.expiresAt} IS NULL OR ${schema.apiKeys.expiresAt} > NOW())`,
        ),
      );

    if (result) {
      // Update last used timestamp
      await db
        .update(schema.apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(schema.apiKeys.key, key));
      return result.workspace;
    }
    return null;
  }

  async revokeApiKey(id: string): Promise<void> {
    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id));
  }

  // -------------------------
  // AUDIT LOGS
  // -------------------------

  async createAuditLog(data: {
    workspaceId: string;
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await db.insert(schema.auditLogs).values(data);
  }

  async getAuditLogs(workspaceId: string, limit: number = 100): Promise<any[]> {
    return await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.workspaceId, workspaceId))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
