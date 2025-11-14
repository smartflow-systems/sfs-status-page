import { IncidentCard } from '../IncidentCard';

export default function IncidentCardExample() {
  return (
    <div className="space-y-4">
      <IncidentCard
        title="API Response Time Degradation"
        affectedServices={["API Server", "Database"]}
        status="monitoring"
        startedAt="2 hours ago"
        updates={[
          {
            timestamp: "10 minutes ago",
            status: "monitoring",
            message: "Response times have improved. Continuing to monitor the situation.",
          },
          {
            timestamp: "1 hour ago",
            status: "identified",
            message: "Issue identified as database query optimization needed. Applying fixes.",
          },
          {
            timestamp: "2 hours ago",
            status: "investigating",
            message: "We are investigating elevated API response times.",
          },
        ]}
      />
      <IncidentCard
        title="Scheduled Maintenance"
        affectedServices={["Main Website"]}
        status="resolved"
        startedAt="Yesterday"
        updates={[
          {
            timestamp: "1 day ago",
            status: "resolved",
            message: "Maintenance completed successfully. All systems operational.",
          },
        ]}
      />
    </div>
  );
}
