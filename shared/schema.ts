import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ===== USERS TABLE =====
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ===== SERVICES TABLE =====
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("api"), // api, website, database, cdn
  url: text("url").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("operational"), // operational, degraded, down
  checkInterval: integer("check_interval").notNull().default(300), // seconds (default 5min)
  uptime: text("uptime").default("100.0"), // percentage as string
  responseTime: integer("response_time").default(0), // milliseconds
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services, {
  name: z.string().min(1, "Service name is required"),
  url: z.string().url("Must be a valid URL"),
  type: z.enum(["api", "website", "database", "cdn"]).default("api"),
  checkInterval: z.number().min(30).max(3600).default(300),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateServiceSchema = insertServiceSchema.partial();

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type UpdateService = z.infer<typeof updateServiceSchema>;

// ===== INCIDENTS TABLE =====
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("investigating"), // investigating, monitoring, resolved
  affectedServices: text("affected_services").array().notNull(), // array of service IDs
  startedAt: timestamp("started_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIncidentSchema = createInsertSchema(incidents, {
  title: z.string().min(1, "Title is required"),
  status: z.enum(["investigating", "monitoring", "resolved"]).default("investigating"),
  affectedServices: z.array(z.string()).min(1, "At least one affected service required"),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateIncidentSchema = insertIncidentSchema.partial();

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type UpdateIncident = z.infer<typeof updateIncidentSchema>;

// ===== INCIDENT UPDATES TABLE =====
export const incidentUpdates = pgTable("incident_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentId: varchar("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIncidentUpdateSchema = createInsertSchema(incidentUpdates, {
  incidentId: z.string(),
  status: z.enum(["investigating", "monitoring", "resolved"]),
  message: z.string().min(1, "Message is required"),
}).omit({ id: true, createdAt: true });

export type IncidentUpdate = typeof incidentUpdates.$inferSelect;
export type InsertIncidentUpdate = z.infer<typeof insertIncidentUpdateSchema>;

// ===== UPTIME RECORDS TABLE =====
export const uptimeRecords = pgTable("uptime_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  isUp: boolean("is_up").notNull(),
  responseTime: integer("response_time"), // milliseconds (null if down)
  statusCode: integer("status_code"), // HTTP status code
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

export const insertUptimeRecordSchema = createInsertSchema(uptimeRecords).omit({
  id: true,
  checkedAt: true,
});

export type UptimeRecord = typeof uptimeRecords.$inferSelect;
export type InsertUptimeRecord = z.infer<typeof insertUptimeRecordSchema>;
