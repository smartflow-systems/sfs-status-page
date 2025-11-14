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
import { Activity, AlertTriangle, TrendingUp, Search, Eye } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const services = [
    {
      name: "API Server",
      type: "api" as const,
      status: "operational" as const,
      uptime: "99.9",
      responseTime: 123,
    },
    {
      name: "Main Website",
      type: "website" as const,
      status: "operational" as const,
      uptime: "100.0",
      responseTime: 89,
    },
    {
      name: "Database",
      type: "database" as const,
      status: "operational" as const,
      uptime: "99.7",
      responseTime: 256,
    },
    {
      name: "CDN",
      type: "cdn" as const,
      status: "operational" as const,
      uptime: "100.0",
      responseTime: 45,
    },
    {
      name: "Auth Service",
      type: "api" as const,
      status: "operational" as const,
      uptime: "99.8",
      responseTime: 178,
    },
    {
      name: "Cache Server",
      type: "database" as const,
      status: "operational" as const,
      uptime: "99.9",
      responseTime: 12,
    },
  ];

  const incidents = [
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
    {
      title: "Scheduled Database Maintenance",
      affectedServices: ["Database"],
      status: "resolved" as const,
      startedAt: "3 days ago",
      updates: [
        {
          timestamp: "3 days ago",
          status: "resolved" as const,
          message: "Maintenance completed successfully. All systems operational.",
        },
      ],
    },
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <SystemStatusBanner status="operational" />

            <div className="grid gap-6 md:grid-cols-3">
              <MetricCard
                title="Total Services"
                value={services.length}
                icon={Activity}
                description="Monitored endpoints"
              />
              <MetricCard
                title="Active Incidents"
                value={0}
                icon={AlertTriangle}
                description="Currently investigating"
              />
              <MetricCard
                title="Average Uptime"
                value="99.8%"
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
                  key={service.name}
                  {...service}
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
                  key={service.name}
                  {...service}
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
              {incidents.map((incident, i) => (
                <IncidentCard key={i} {...incident} />
              ))}
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
