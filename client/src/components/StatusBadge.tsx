import { Badge } from "@/components/ui/badge";

type StatusType = "operational" | "degraded" | "down";

interface StatusBadgeProps {
  status: StatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    operational: {
      label: "Operational",
      className: "bg-status-operational text-primary-foreground",
    },
    degraded: {
      label: "Degraded",
      className: "bg-status-degraded text-foreground animate-pulse",
    },
    down: {
      label: "Down",
      className: "bg-status-down text-primary-foreground animate-pulse",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge className={config.className} data-testid={`badge-status-${status}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </Badge>
  );
}
