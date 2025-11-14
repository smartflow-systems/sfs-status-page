import { SystemStatusBanner } from "@/components/SystemStatusBanner";
import { ServiceListItem } from "@/components/ServiceListItem";
import { IncidentCard } from "@/components/IncidentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";

export default function StatusPage() {
  const services = [
    { name: "API Server", type: "api" as const, status: "operational" as const, uptime: "99.9" },
    { name: "Main Website", type: "website" as const, status: "operational" as const, uptime: "100.0" },
    { name: "Database", type: "database" as const, status: "operational" as const, uptime: "99.7" },
    { name: "CDN", type: "cdn" as const, status: "operational" as const, uptime: "100.0" },
    { name: "Authentication Service", type: "api" as const, status: "operational" as const, uptime: "99.8" },
  ];

  const recentIncidents = [
    {
      title: "API Response Time Degradation",
      affectedServices: ["API Server", "Database"],
      status: "resolved" as const,
      startedAt: "Yesterday at 2:30 PM",
      updates: [
        {
          timestamp: "Yesterday at 4:15 PM",
          status: "resolved" as const,
          message: "Issue has been fully resolved. All systems are operating normally.",
        },
        {
          timestamp: "Yesterday at 3:45 PM",
          status: "monitoring" as const,
          message: "Response times have improved. Continuing to monitor the situation.",
        },
        {
          timestamp: "Yesterday at 2:30 PM",
          status: "investigating" as const,
          message: "We are investigating elevated API response times.",
        },
      ],
    },
  ];

  const uptimeStats = [
    { period: "7 days", uptime: "99.95%" },
    { period: "30 days", uptime: "99.87%" },
    { period: "90 days", uptime: "99.92%" },
  ];

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
              Last updated: Just now
            </p>
          </div>
          <SystemStatusBanner status="operational" />
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
              {services.map((service) => (
                <ServiceListItem key={service.name} {...service} />
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Recent Incidents</h2>
          <div className="space-y-4">
            {recentIncidents.map((incident, i) => (
              <IncidentCard key={i} {...incident} />
            ))}
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
            {uptimeStats.map((stat) => (
              <Card key={stat.period}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.period}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums" data-testid={`text-uptime-${stat.period.replace(/\s+/g, '-')}`}>
                    {stat.uptime}
                  </div>
                </CardContent>
              </Card>
            ))}
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
