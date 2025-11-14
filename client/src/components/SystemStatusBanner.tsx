import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type SystemStatus = "operational" | "degraded" | "down";

interface SystemStatusBannerProps {
  status: SystemStatus;
  message?: string;
  lastUpdated?: string;
}

const statusConfig = {
  operational: {
    icon: CheckCircle2,
    bg: "bg-status-operational/10",
    border: "border-status-operational/20",
    iconColor: "text-status-operational",
    title: "All Systems Operational",
    defaultMessage: "All monitored services are running smoothly.",
  },
  degraded: {
    icon: AlertTriangle,
    bg: "bg-status-degraded/10",
    border: "border-status-degraded/20",
    iconColor: "text-status-degraded",
    title: "Degraded Performance",
    defaultMessage: "Some services are experiencing degraded performance.",
  },
  down: {
    icon: XCircle,
    bg: "bg-status-down/10",
    border: "border-status-down/20",
    iconColor: "text-status-down",
    title: "Service Outage",
    defaultMessage: "One or more services are currently unavailable.",
  },
};

export function SystemStatusBanner({ status, message, lastUpdated }: SystemStatusBannerProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`${config.bg} border ${config.border}`} data-testid="banner-system-status">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <Icon className={`w-6 h-6 ${config.iconColor} shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold mb-1" data-testid="text-status-title">
              {config.title}
            </h2>
            <p className="text-sm text-muted-foreground" data-testid="text-status-message">
              {message || config.defaultMessage}
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
