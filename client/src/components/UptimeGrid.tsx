import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UptimeGridProps {
  days?: number;
}

export function UptimeGrid({ days = 90 }: UptimeGridProps) {
  const uptimeData = Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000),
    status: Math.random() > 0.95 ? (Math.random() > 0.5 ? "degraded" : "down") : "operational",
    uptime: Math.random() > 0.95 ? (Math.random() * 30 + 70).toFixed(1) : "100.0",
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-status-operational";
      case "degraded":
        return "bg-status-degraded";
      case "down":
        return "bg-status-down";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="flex gap-0.5 flex-wrap" data-testid="grid-uptime">
      {uptimeData.map((day, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <div
              className={`w-2 h-6 rounded-sm ${getStatusColor(day.status)} hover-elevate cursor-pointer`}
            />
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">{day.date.toLocaleDateString()}</div>
              <div className="text-muted-foreground">{day.uptime}% uptime</div>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
