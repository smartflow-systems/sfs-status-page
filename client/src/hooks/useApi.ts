/**
 * SFS Status Page - API Hooks
 * TanStack Query hooks for all API endpoints
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type {
  Service,
  InsertService,
  UpdateService,
  Incident,
  InsertIncident,
  UpdateIncident,
  InsertIncidentUpdate,
  UptimeRecord,
} from "@shared/schema";

// ========================================
// SERVICES HOOKS
// ========================================

/**
 * Fetch all services
 */
export function useServices(): UseQueryResult<Service[], Error> {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30s
  });
}

/**
 * Fetch a single service
 */
export function useService(id: string): UseQueryResult<Service, Error> {
  return useQuery({
    queryKey: ["services", id],
    queryFn: async () => {
      const res = await fetch(`/api/services/${id}`);
      if (!res.ok) throw new Error("Failed to fetch service");
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Create a new service
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: InsertService) => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create service");
      }
      return res.json() as Promise<Service>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

/**
 * Update a service
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateService }) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update service");
      }
      return res.json() as Promise<Service>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services", data.id] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

/**
 * Delete a service
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete service");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

/**
 * Get uptime stats for a service
 */
export function useUptimeStats(serviceId: string, days: number = 30) {
  return useQuery({
    queryKey: ["uptime-stats", serviceId, days],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}/uptime?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch uptime stats");
      return res.json() as Promise<{ uptime: number; avgResponseTime: number }>;
    },
    enabled: !!serviceId,
  });
}

/**
 * Get uptime records for a service
 */
export function useUptimeRecords(serviceId: string, limit: number = 100) {
  return useQuery({
    queryKey: ["uptime-records", serviceId, limit],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}/records?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch uptime records");
      return res.json() as Promise<UptimeRecord[]>;
    },
    enabled: !!serviceId,
  });
}

// ========================================
// INCIDENTS HOOKS
// ========================================

type IncidentWithUpdates = Incident & {
  updates: Array<{
    id: string;
    incidentId: string;
    status: string;
    message: string;
    createdAt: Date | null;
  }>;
};

/**
 * Fetch all incidents
 */
export function useIncidents(activeOnly: boolean = false): UseQueryResult<IncidentWithUpdates[], Error> {
  return useQuery({
    queryKey: ["incidents", activeOnly ? "active" : "all"],
    queryFn: async () => {
      const url = activeOnly ? "/api/incidents?active=true" : "/api/incidents";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30s
  });
}

/**
 * Fetch a single incident
 */
export function useIncident(id: string): UseQueryResult<IncidentWithUpdates, Error> {
  return useQuery({
    queryKey: ["incidents", id],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) throw new Error("Failed to fetch incident");
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Create a new incident
 */
export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incident: InsertIncident) => {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incident),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create incident");
      }
      return res.json() as Promise<IncidentWithUpdates>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

/**
 * Update an incident
 */
export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateIncident }) => {
      const res = await fetch(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update incident");
      }
      return res.json() as Promise<IncidentWithUpdates>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incidents", data.id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

/**
 * Delete an incident
 */
export function useDeleteIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/incidents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete incident");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

/**
 * Add an update to an incident
 */
export function useCreateIncidentUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      update,
    }: {
      incidentId: string;
      update: Omit<InsertIncidentUpdate, "incidentId">;
    }) => {
      const res = await fetch(`/api/incidents/${incidentId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create incident update");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incidents", variables.incidentId] });
    },
  });
}

// ========================================
// SYSTEM STATUS HOOK
// ========================================

type SystemStatus = {
  status: "operational" | "degraded" | "down";
  totalServices: number;
  activeIncidents: number;
  averageUptime: string;
  services: Array<{
    id: string;
    name: string;
    status: string;
  }>;
};

/**
 * Get overall system status
 */
export function useSystemStatus(): UseQueryResult<SystemStatus, Error> {
  return useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to fetch system status");
      return res.json();
    },
    refetchInterval: 15000, // Refetch every 15s
  });
}
