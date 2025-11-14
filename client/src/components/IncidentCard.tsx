import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

interface IncidentUpdate {
  timestamp: string;
  status: IncidentStatus;
  message: string;
}

interface IncidentCardProps {
  title: string;
  affectedServices: string[];
  status: IncidentStatus;
  startedAt: string;
  updates: IncidentUpdate[];
}

const statusConfig = {
  investigating: { label: "Investigating", color: "bg-status-degraded text-foreground" },
  identified: { label: "Identified", color: "bg-blue-600 text-primary-foreground" },
  monitoring: { label: "Monitoring", color: "bg-purple-600 text-primary-foreground" },
  resolved: { label: "Resolved", color: "bg-status-operational text-primary-foreground" },
};

export function IncidentCard({ title, affectedServices, status, startedAt, updates }: IncidentCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[status];

  return (
    <Card data-testid={`card-incident-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-4">
          <CollapsibleTrigger className="w-full hover-elevate active-elevate-2 -m-6 p-6 rounded-md" data-testid={`button-toggle-incident-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge className={config.color}>{config.label}</Badge>
                  <span className="text-xs text-muted-foreground">{startedAt}</span>
                </div>
                <h3 className="text-lg font-semibold" data-testid={`text-incident-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {title}
                </h3>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {affectedServices.map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="border-l-2 border-border pl-4 space-y-4">
                {updates.map((update, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[1.3rem] w-2 h-2 rounded-full bg-primary" />
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                      {update.timestamp}
                    </div>
                    <div className="text-sm font-semibold mb-1">{statusConfig[update.status].label}</div>
                    <p className="text-sm text-muted-foreground">{update.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
