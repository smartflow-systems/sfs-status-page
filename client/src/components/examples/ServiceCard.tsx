import { ServiceCard } from '../ServiceCard';

export default function ServiceCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ServiceCard
        name="API Server"
        type="api"
        status="operational"
        uptime="99.9"
        responseTime={123}
        onClick={() => console.log('API Server clicked')}
      />
      <ServiceCard
        name="Main Website"
        type="website"
        status="operational"
        uptime="100.0"
        responseTime={89}
        onClick={() => console.log('Website clicked')}
      />
      <ServiceCard
        name="Database"
        type="database"
        status="degraded"
        uptime="97.2"
        responseTime={256}
        onClick={() => console.log('Database clicked')}
      />
    </div>
  );
}
