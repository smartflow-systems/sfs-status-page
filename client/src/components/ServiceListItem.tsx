import { StatusBadge } from "./StatusBadge";
import { UptimeGrid } from "./UptimeGrid";
import { Globe, Server, Database, Cloud } from "lucide-react";

type ServiceType = "api" | "website" | "database" | "cdn";
type StatusType = "operational" | "degraded" | "down";

interface ServiceListItemProps {
  name: string;
  type?: ServiceType;
  status: StatusType;
  uptime: string;
  showUptimeGrid?: boolean;
}

const serviceIcons = {
  api: Server,
  website: Globe,
  database: Database,
  cdn: Cloud,
};

export function ServiceListItem({
  name,
  type = "api",
  status,
  uptime,
  showUptimeGrid = true,
}: ServiceListItemProps) {
  const Icon = serviceIcons[type];

  return (
    <div className="py-4 border-b border-border last:border-0" data-testid={`item-service-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
          <h3 className="text-lg font-medium truncate" data-testid={`text-service-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
            {name}
          </h3>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Uptime (90d)
            </div>
            <div className="text-xl font-bold tabular-nums" data-testid={`text-uptime-${name.toLowerCase().replace(/\s+/g, '-')}`}>
              {uptime}%
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>
      {showUptimeGrid && <UptimeGrid days={90} />}
    </div>
  );
}
