import { StatusBadge } from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex gap-4">
      <StatusBadge status="operational" />
      <StatusBadge status="degraded" />
      <StatusBadge status="down" />
    </div>
  );
}
