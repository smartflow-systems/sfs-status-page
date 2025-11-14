import { ServiceListItem } from '../ServiceListItem';

export default function ServiceListItemExample() {
  return (
    <div className="space-y-0 bg-card p-6 rounded-md">
      <ServiceListItem
        name="API Server"
        type="api"
        status="operational"
        uptime="99.9"
      />
      <ServiceListItem
        name="Main Website"
        type="website"
        status="operational"
        uptime="100.0"
      />
      <ServiceListItem
        name="Database"
        type="database"
        status="degraded"
        uptime="97.2"
      />
    </div>
  );
}
