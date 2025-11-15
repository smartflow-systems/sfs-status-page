import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  User,
  Workspace,
  Service,
  Incident,
  Monitor,
  Integration,
  Subscriber,
  MaintenanceWindow,
} from "@shared/schema";

// ============================================================================
// API CLIENT
// ============================================================================

const API_BASE = "/api";

export class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(data: { username: string; email: string; password: string }) {
    return this.request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { username: string; password: string }) {
    return this.request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<{ user: User }>("/auth/me");
  }

  // Workspaces
  async getWorkspaces() {
    return this.request<{ workspaces: Workspace[] }>("/workspaces");
  }

  async getWorkspace(id: string) {
    return this.request<{ workspace: Workspace }>(`/workspaces/${id}`);
  }

  async createWorkspace(data: { name: string; slug: string; subdomain?: string }) {
    return this.request<{ workspace: Workspace }>("/workspaces", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWorkspace(id: string, data: Partial<Workspace>) {
    return this.request<{ workspace: Workspace }>(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspace(id: string) {
    return this.request<{ success: boolean }>(`/workspaces/${id}`, {
      method: "DELETE",
    });
  }

  // Services
  async getServices(workspaceId: string) {
    return this.request<{ services: Service[] }>(`/workspaces/${workspaceId}/services`);
  }

  async getService(id: string) {
    return this.request<{ service: Service }>(`/services/${id}`);
  }

  async createService(workspaceId: string, data: Partial<Service>) {
    return this.request<{ service: Service }>(`/workspaces/${workspaceId}/services`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: Partial<Service>) {
    return this.request<{ service: Service }>(`/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string) {
    return this.request<{ success: boolean }>(`/services/${id}`, {
      method: "DELETE",
    });
  }

  // Monitors
  async getMonitor(serviceId: string) {
    return this.request<{ monitor: Monitor }>(`/services/${serviceId}/monitor`);
  }

  async updateMonitor(id: string, data: Partial<Monitor>) {
    return this.request<{ monitor: Monitor }>(`/monitors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Metrics
  async getMetrics(serviceId: string, hours: number = 24) {
    return this.request<{ metrics: any[] }>(`/services/${serviceId}/metrics?hours=${hours}`);
  }

  async getUptime(serviceId: string, hours: number = 24) {
    return this.request<{ uptime: number }>(`/services/${serviceId}/uptime?hours=${hours}`);
  }

  async getStatusHistory(serviceId: string, days: number = 90) {
    return this.request<{ history: any[] }>(`/services/${serviceId}/status-history?days=${days}`);
  }

  // Incidents
  async getIncidents(workspaceId: string) {
    return this.request<{ incidents: any[] }>(`/workspaces/${workspaceId}/incidents`);
  }

  async getIncident(id: string) {
    return this.request<{ incident: any }>(`/incidents/${id}`);
  }

  async createIncident(workspaceId: string, data: Partial<Incident> & { affectedServices?: string[] }) {
    return this.request<{ incident: Incident }>(`/workspaces/${workspaceId}/incidents`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateIncident(id: string, data: Partial<Incident>) {
    return this.request<{ incident: Incident }>(`/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async resolveIncident(id: string) {
    return this.request<{ success: boolean }>(`/incidents/${id}/resolve`, {
      method: "POST",
    });
  }

  // Incident Updates
  async getIncidentUpdates(incidentId: string) {
    return this.request<{ updates: any[] }>(`/incidents/${incidentId}/updates`);
  }

  async createIncidentUpdate(incidentId: string, data: { status: string; message: string }) {
    return this.request<{ update: any }>(`/incidents/${incidentId}/updates`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Subscribers
  async subscribe(workspaceId: string, email: string) {
    return this.request<{ subscriber: Subscriber }>(`/workspaces/${workspaceId}/subscribe`, {
      method: "POST",
      body: JSON.stringify({ workspaceId, email }),
    });
  }

  // Integrations
  async getIntegrations(workspaceId: string) {
    return this.request<{ integrations: Integration[] }>(`/workspaces/${workspaceId}/integrations`);
  }

  async createIntegration(workspaceId: string, data: Partial<Integration>) {
    return this.request<{ integration: Integration }>(`/workspaces/${workspaceId}/integrations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateIntegration(id: string, data: Partial<Integration>) {
    return this.request<{ integration: Integration }>(`/integrations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteIntegration(id: string) {
    return this.request<{ success: boolean }>(`/integrations/${id}`, {
      method: "DELETE",
    });
  }

  // Public Status Page
  async getPublicStatus(slug: string) {
    return this.request<{
      workspace: { name: string; logoUrl?: string; primaryColor?: string };
      services: Service[];
      activeIncidents: any[];
      upcomingMaintenance: MaintenanceWindow[];
    }>(`/public/status/${slug}`);
  }
}

export const apiClient = new ApiClient();

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

// Workspaces
export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiClient.getWorkspaces(),
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ["workspace", id],
    queryFn: () => apiClient.getWorkspace(id),
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; subdomain?: string }) =>
      apiClient.createWorkspace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

// Services
export function useServices(workspaceId: string) {
  return useQuery({
    queryKey: ["services", workspaceId],
    queryFn: () => apiClient.getServices(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateService(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Service>) => apiClient.createService(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", workspaceId] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      apiClient.updateService(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["service", variables.id] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

// Incidents
export function useIncidents(workspaceId: string) {
  return useQuery({
    queryKey: ["incidents", workspaceId],
    queryFn: () => apiClient.getIncidents(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateIncident(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Incident> & { affectedServices?: string[] }) =>
      apiClient.createIncident(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents", workspaceId] });
    },
  });
}

export function useCreateIncidentUpdate(incidentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; message: string }) =>
      apiClient.createIncidentUpdate(incidentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

// Metrics
export function useServiceMetrics(serviceId: string, hours: number = 24) {
  return useQuery({
    queryKey: ["metrics", serviceId, hours],
    queryFn: () => apiClient.getMetrics(serviceId, hours),
    enabled: !!serviceId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useServiceUptime(serviceId: string, hours: number = 24) {
  return useQuery({
    queryKey: ["uptime", serviceId, hours],
    queryFn: () => apiClient.getUptime(serviceId, hours),
    enabled: !!serviceId,
    refetchInterval: 60000,
  });
}

// Public Status Page
export function usePublicStatus(slug: string) {
  return useQuery({
    queryKey: ["publicStatus", slug],
    queryFn: () => apiClient.getPublicStatus(slug),
    enabled: !!slug,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Subscribe
export function useSubscribe(workspaceId: string) {
  return useMutation({
    mutationFn: (email: string) => apiClient.subscribe(workspaceId, email),
  });
}

// Integrations
export function useIntegrations(workspaceId: string) {
  return useQuery({
    queryKey: ["integrations", workspaceId],
    queryFn: () => apiClient.getIntegrations(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateIntegration(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Integration>) => apiClient.createIntegration(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", workspaceId] });
    },
  });
}
