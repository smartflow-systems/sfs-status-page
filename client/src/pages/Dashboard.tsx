import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemStatusBanner } from "@/components/SystemStatusBanner";
import { ServiceCard } from "@/components/ServiceCard";
import { MetricCard } from "@/components/MetricCard";
import { IncidentCard } from "@/components/IncidentCard";
import { AddServiceDialog } from "@/components/AddServiceDialog";
import { CreateIncidentDialog } from "@/components/CreateIncidentDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, AlertTriangle, TrendingUp, Search, Eye, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useServices, useIncidents, useSystemStatus } from "@/hooks/useApi";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch real data from API
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();
  const { data: incidents = [], isLoading: incidentsLoading, error: incidentsError } = useIncidents(false);
  const { data: systemStatus, isLoading: statusLoading, error: statusError } = useSystemStatus();

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Show loading state
  if (servicesLoading || incidentsLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (servicesError || incidentsError || statusError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
            <p className="text-muted-foreground mb-4">
              {servicesError?.message || incidentsError?.message || statusError?.message}
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-3">
              <Link href="/" data-testid="link-status-page">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Status Page
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-dashboard">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
            <TabsTrigger value="incidents" data-testid="tab-incidents">Incidents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <SystemStatusBanner status={systemStatus?.status || "operational"} />

            <div className="grid gap-6 md:grid-cols-3">
              <MetricCard
                title="Total Services"
                value={systemStatus?.totalServices || 0}
                icon={Activity}
                description="Monitored endpoints"
              />
              <MetricCard
                title="Active Incidents"
                value={systemStatus?.activeIncidents || 0}
                icon={AlertTriangle}
                description="Currently investigating"
              />
              <MetricCard
                title="Average Uptime"
                value={`${systemStatus?.averageUptime || "0.00"}%`}
                icon={TrendingUp}
                description="Last 30 days"
              />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Services Overview</h2>
              <AddServiceDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  name={service.name}
                  type={service.type as "api" | "website" | "database" | "cdn"}
                  status={service.status as "operational" | "degraded" | "down"}
                  uptime={service.uptime || "0.0"}
                  responseTime={service.responseTime || 0}
                  onClick={() => console.log(`Viewing ${service.name} details`)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6 mt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-services"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="degraded">Degraded</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                </SelectContent>
              </Select>
              <AddServiceDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  name={service.name}
                  type={service.type as "api" | "website" | "database" | "cdn"}
                  status={service.status as "operational" | "degraded" | "down"}
                  uptime={service.uptime || "0.0"}
                  responseTime={service.responseTime || 0}
                  onClick={() => console.log(`Viewing ${service.name} details`)}
                />
              ))}
            </div>

            {filteredServices.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No services match your filters</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Incident Management</h2>
              <CreateIncidentDialog />
            </div>

            <div className="space-y-4">
              {incidents.map((incident) => {
                // Map service IDs to service names
                const affectedServiceNames = incident.affectedServices
                  .map((serviceId) => {
                    const service = services.find(s => s.id === serviceId);
                    return service?.name || serviceId;
                  });

                // Format the incident data for IncidentCard
                const formattedIncident = {
                  title: incident.title,
                  affectedServices: affectedServiceNames,
                  status: incident.status as "investigating" | "identified" | "monitoring" | "resolved",
                  startedAt: incident.startedAt
                    ? new Date(incident.startedAt).toLocaleString()
                    : "Unknown",
                  updates: incident.updates.map(update => ({
                    timestamp: update.createdAt
                      ? new Date(update.createdAt).toLocaleString()
                      : "Unknown",
                    status: update.status as "investigating" | "identified" | "monitoring" | "resolved",
                    message: update.message,
                  })),
                };

                return <IncidentCard key={incident.id} {...formattedIncident} />;
              })}
            </div>

            {incidents.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No incidents to display</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
