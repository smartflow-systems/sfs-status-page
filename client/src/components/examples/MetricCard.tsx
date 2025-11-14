import { MetricCard } from '../MetricCard';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title="Total Services"
        value={12}
        icon={Activity}
        description="Monitored endpoints"
      />
      <MetricCard
        title="Active Incidents"
        value={1}
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
  );
}
