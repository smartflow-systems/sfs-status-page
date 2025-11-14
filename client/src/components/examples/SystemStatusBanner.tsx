import { SystemStatusBanner } from '../SystemStatusBanner';

export default function SystemStatusBannerExample() {
  return (
    <div className="space-y-4">
      <SystemStatusBanner 
        status="operational" 
        lastUpdated="Just now"
      />
      <SystemStatusBanner 
        status="degraded" 
        message="API response times are higher than normal. We are investigating."
        lastUpdated="5 minutes ago"
      />
      <SystemStatusBanner 
        status="down" 
        message="Database service is currently unavailable. Our team is working on a fix."
        lastUpdated="10 minutes ago"
      />
    </div>
  );
}
