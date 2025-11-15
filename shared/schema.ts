import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  real,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "member", "viewer"]);
export const serviceTypeEnum = pgEnum("service_type", [
  "http",
  "https",
  "tcp",
  "udp",
  "ping",
  "dns",
  "ssl",
  "api",
  "database",
  "custom"
]);
export const serviceStatusEnum = pgEnum("service_status", [
  "operational",
  "degraded",
  "down",
  "maintenance",
  "unknown"
]);
export const incidentStatusEnum = pgEnum("incident_status", [
  "investigating",
  "identified",
  "monitoring",
  "resolved"
]);
export const incidentSeverityEnum = pgEnum("incident_severity", [
  "minor",
  "major",
  "critical"
]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "slack",
  "discord",
  "teams",
  "webhook",
  "sms",
  "pagerduty",
  "opsgenie"
]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled"
]);

// ============================================================================
// CORE TABLES
// ============================================================================

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
  };
});

// Workspaces (multi-tenant isolation)
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subdomain: text("subdomain").unique(),
  customDomain: text("custom_domain"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default("#3B82F6"),
  customCss: text("custom_css"),
  whiteLabel: boolean("white_label").default(false),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  settings: jsonb("settings").$type<{
    enableSubscriptions?: boolean;
    enableMaintenanceMode?: boolean;
    enablePrivatePage?: boolean;
    pagePassword?: string;
    allowedIps?: string[];
    timezone?: string;
    language?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    slugIdx: uniqueIndex("workspaces_slug_idx").on(table.slug),
    subdomainIdx: index("workspaces_subdomain_idx").on(table.subdomain),
  };
});

// Workspace members (team management)
export const workspaceMembers = pgTable("workspace_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("viewer"),
  invitedBy: varchar("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => {
  return {
    workspaceUserIdx: uniqueIndex("workspace_members_workspace_user_idx").on(table.workspaceId, table.userId),
  };
});

// Status page components (grouped services)
export const components = pgTable("components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  isExpanded: boolean("is_expanded").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    workspaceIdx: index("components_workspace_idx").on(table.workspaceId),
  };
});

// Services (monitored endpoints)
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  componentId: varchar("component_id").references(() => components.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  type: serviceTypeEnum("type").notNull().default("https"),
  status: serviceStatusEnum("status").notNull().default("unknown"),
  monitoringEnabled: boolean("monitoring_enabled").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    workspaceIdx: index("services_workspace_idx").on(table.workspaceId),
    componentIdx: index("services_component_idx").on(table.componentId),
    statusIdx: index("services_status_idx").on(table.status),
  };
});

// Monitors (health check configurations)
export const monitors = pgTable("monitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  checkInterval: integer("check_interval").notNull().default(60), // seconds
  timeout: integer("timeout").notNull().default(30), // seconds
  retries: integer("retries").default(3),
  regions: jsonb("regions").$type<string[]>().default(["us-east"]),
  expectedStatusCode: integer("expected_status_code").default(200),
  expectedKeyword: text("expected_keyword"),
  headers: jsonb("headers").$type<Record<string, string>>(),
  body: text("body"),
  method: text("method").default("GET"),
  followRedirects: boolean("follow_redirects").default(true),
  verifySsl: boolean("verify_ssl").default(true),
  lastCheckAt: timestamp("last_check_at"),
  nextCheckAt: timestamp("next_check_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    serviceIdx: uniqueIndex("monitors_service_idx").on(table.serviceId),
    nextCheckIdx: index("monitors_next_check_idx").on(table.nextCheckAt),
  };
});

// Metrics (response time data points)
export const metrics = pgTable("metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  responseTime: integer("response_time"), // milliseconds
  statusCode: integer("status_code"),
  isUp: boolean("is_up").notNull(),
  errorMessage: text("error_message"),
  region: text("region").default("us-east"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
}, (table) => {
  return {
    serviceTimeIdx: index("metrics_service_time_idx").on(table.serviceId, table.checkedAt),
    checkedAtIdx: index("metrics_checked_at_idx").on(table.checkedAt),
  };
});

// Status history (uptime calendar data)
export const statusHistory = pgTable("status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  uptimePercentage: real("uptime_percentage").notNull(),
  totalChecks: integer("total_checks").notNull(),
  successfulChecks: integer("successful_checks").notNull(),
  avgResponseTime: integer("avg_response_time"),
}, (table) => {
  return {
    serviceDateIdx: uniqueIndex("status_history_service_date_idx").on(table.serviceId, table.date),
  };
});

// Incidents
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: incidentStatusEnum("status").notNull().default("investigating"),
  severity: incidentSeverityEnum("severity").notNull().default("minor"),
  autoGenerated: boolean("auto_generated").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    workspaceIdx: index("incidents_workspace_idx").on(table.workspaceId),
    statusIdx: index("incidents_status_idx").on(table.status),
    createdAtIdx: index("incidents_created_at_idx").on(table.createdAt),
  };
});

// Incident updates (timeline)
export const incidentUpdates = pgTable("incident_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentId: varchar("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  status: incidentStatusEnum("status").notNull(),
  message: text("message").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    incidentIdx: index("incident_updates_incident_idx").on(table.incidentId),
    createdAtIdx: index("incident_updates_created_at_idx").on(table.createdAt),
  };
});

// Affected services (which services are impacted by an incident)
export const incidentServices = pgTable("incident_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentId: varchar("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    incidentServiceIdx: uniqueIndex("incident_services_incident_service_idx").on(table.incidentId, table.serviceId),
  };
});

// Maintenance windows
export const maintenanceWindows = pgTable("maintenance_windows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: maintenanceStatusEnum("status").notNull().default("scheduled"),
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  notifySubscribers: boolean("notify_subscribers").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    workspaceIdx: index("maintenance_workspace_idx").on(table.workspaceId),
    scheduledStartIdx: index("maintenance_scheduled_start_idx").on(table.scheduledStart),
  };
});

// Services affected by maintenance
export const maintenanceServices = pgTable("maintenance_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceId: varchar("maintenance_id").notNull().references(() => maintenanceWindows.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    maintenanceServiceIdx: uniqueIndex("maintenance_services_maintenance_service_idx").on(table.maintenanceId, table.serviceId),
  };
});

// Subscribers
export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  verified: boolean("verified").default(false),
  verificationToken: text("verification_token"),
  unsubscribeToken: text("unsubscribe_token").notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
}, (table) => {
  return {
    workspaceEmailIdx: uniqueIndex("subscribers_workspace_email_idx").on(table.workspaceId, table.email),
  };
});

// Integrations (webhooks, Slack, etc.)
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  enabled: boolean("enabled").default(true),
  config: jsonb("config").$type<{
    webhookUrl?: string;
    slackChannel?: string;
    teamsWebhook?: string;
    discordWebhook?: string;
    pagerdutyKey?: string;
    opsgenieKey?: string;
    twilioPhone?: string;
    customHeaders?: Record<string, string>;
  }>().notNull(),
  events: jsonb("events").$type<string[]>().default(["incident.created", "incident.updated", "incident.resolved"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    workspaceIdx: index("integrations_workspace_idx").on(table.workspaceId),
  };
});

// API keys
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    keyIdx: uniqueIndex("api_keys_key_idx").on(table.key),
    workspaceIdx: index("api_keys_workspace_idx").on(table.workspaceId),
  };
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    workspaceIdx: index("audit_logs_workspace_idx").on(table.workspaceId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  };
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  ownedWorkspaces: many(workspaces),
  memberships: many(workspaceMembers),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  services: many(services),
  incidents: many(incidents),
  subscribers: many(subscribers),
  integrations: many(integrations),
  components: many(components),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const componentsRelations = relations(components, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [components.workspaceId],
    references: [workspaces.id],
  }),
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [services.workspaceId],
    references: [workspaces.id],
  }),
  component: one(components, {
    fields: [services.componentId],
    references: [components.id],
  }),
  monitor: one(monitors),
  metrics: many(metrics),
  statusHistory: many(statusHistory),
  incidents: many(incidentServices),
}));

export const monitorsRelations = relations(monitors, ({ one }) => ({
  service: one(services, {
    fields: [monitors.serviceId],
    references: [services.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [incidents.workspaceId],
    references: [workspaces.id],
  }),
  updates: many(incidentUpdates),
  affectedServices: many(incidentServices),
}));

export const incidentServicesRelations = relations(incidentServices, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentServices.incidentId],
    references: [incidents.id],
  }),
  service: one(services, {
    fields: [incidentServices.serviceId],
    references: [services.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).pick({
  name: true,
  slug: true,
  subdomain: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertMonitorSchema = createInsertSchema(monitors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastCheckAt: true,
  nextCheckAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertIncidentUpdateSchema = createInsertSchema(incidentUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertMaintenanceSchema = createInsertSchema(maintenanceWindows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  actualStart: true,
  actualEnd: true,
});

export const insertSubscriberSchema = createInsertSchema(subscribers).pick({
  workspaceId: true,
  email: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Monitor = typeof monitors.$inferSelect;
export type InsertMonitor = z.infer<typeof insertMonitorSchema>;

export type Metric = typeof metrics.$inferSelect;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type IncidentUpdate = typeof incidentUpdates.$inferSelect;
export type InsertIncidentUpdate = z.infer<typeof insertIncidentUpdateSchema>;

export type MaintenanceWindow = typeof maintenanceWindows.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

export type Component = typeof components.$inferSelect;
