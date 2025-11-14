import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { ResponseTimeChart } from "./ResponseTimeChart";
import { Globe, Server, Database, Cloud } from "lucide-react";

type ServiceType = "api" | "website" | "database" | "cdn";
type StatusType = "operational" | "degraded" | "down";

interface ServiceCardProps {
  name: string;
  type?: ServiceType;
  status: StatusType;
  uptime: string;
  responseTime: number;
  onClick?: () => void;
}

const serviceIcons = {
  api: Server,
  website: Globe,
  database: Database,
  cdn: Cloud,
};

export function ServiceCard({
  name,
  type = "api",
  status,
  uptime,
  responseTime,
  onClick,
}: ServiceCardProps) {
  const Icon = serviceIcons[type];

  return (
    <Card
      className="hover-elevate active-elevate-2 cursor-pointer"
      onClick={onClick}
      data-testid={`card-service-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
            <h3 className="text-lg font-medium truncate" data-testid={`text-service-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
              {name}
            </h3>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Uptime (30d)
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1" data-testid={`text-uptime-${name.toLowerCase().replace(/\s+/g, '-')}`}>
              {uptime}%
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Response Time
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1" data-testid={`text-response-time-${name.toLowerCase().replace(/\s+/g, '-')}`}>
              {responseTime}ms
            </div>
          </div>
        </div>
        <ResponseTimeChart height={50} />
      </CardContent>
    </Card>
  );
}
