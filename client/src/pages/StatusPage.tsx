import { SystemStatusBanner } from "@/components/SystemStatusBanner";
import { ServiceListItem } from "@/components/ServiceListItem";
import { IncidentCard } from "@/components/IncidentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Bell, Loader2, AlertTriangle } from "lucide-react";
import { useServices, useIncidents, useSystemStatus } from "@/hooks/useApi";

export default function StatusPage() {
  // Fetch real data from API
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();
  const { data: incidents = [], isLoading: incidentsLoading, error: incidentsError } = useIncidents(false);
  const { data: systemStatus, isLoading: statusLoading, error: statusError } = useSystemStatus();

  // Show loading state
  if (servicesLoading || incidentsLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading status page...</p>
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
            <h2 className="text-xl font-semibold mb-2">Failed to Load Status Page</h2>
            <p className="text-muted-foreground mb-4">
              {servicesError?.message || incidentsError?.message || statusError?.message}
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter to recent incidents (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentIncidents = incidents
    .filter(incident => {
      if (!incident.startedAt) return false;
      return new Date(incident.startedAt) > thirtyDaysAgo;
    })
    .slice(0, 5); // Show max 5 recent incidents

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Status Monitor</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section className="min-h-[40vh] flex flex-col justify-center">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">System Status</h2>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <SystemStatusBanner status={systemStatus?.status || "operational"} />
          <div className="mt-6 flex justify-center">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="your@email.com"
                className="w-64"
                data-testid="input-subscribe-email"
              />
              <Button data-testid="button-subscribe">
                <Bell className="w-4 h-4 mr-2" />
                Subscribe to Updates
              </Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Services</h2>
          <Card>
            <CardContent className="p-6">
              {services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No services configured</p>
              ) : (
                services.map((service) => (
                  <ServiceListItem
                    key={service.id}
                    name={service.name}
                    type={service.type as "api" | "website" | "database" | "cdn"}
                    status={service.status as "operational" | "degraded" | "down"}
                    uptime={service.uptime || "0.0"}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Recent Incidents</h2>
          <div className="space-y-4">
            {recentIncidents.map((incident) => {
              // Map service IDs to service names
              const affectedServiceNames = incident.affectedServices
                .map((serviceId) => {
                  const service = services.find(s => s.id === serviceId);
                  return service?.name || serviceId;
                });

              // Format the incident data
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
          {recentIncidents.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No recent incidents</p>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Uptime Statistics</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  7 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums" data-testid="text-uptime-7-days">
                  {systemStatus?.averageUptime || "0.00"}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  30 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums" data-testid="text-uptime-30-days">
                  {systemStatus?.averageUptime || "0.00"}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  90 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums" data-testid="text-uptime-90-days">
                  {systemStatus?.averageUptime || "0.00"}%
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-sm text-muted-foreground text-center">
            © 2024 Status Monitor. All systems monitored in real-time.
          </p>
        </div>
      </footer>
    </div>
  );
}
