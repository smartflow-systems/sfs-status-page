import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ title, value, icon: Icon, description }: MetricCardProps) {
  return (
    <Card data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">{title}</div>
            <div className="text-3xl font-bold tabular-nums" data-testid={`text-metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </div>
            {description && (
              <div className="text-xs text-muted-foreground mt-1">{description}</div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-md">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
