import { Pill } from '@/shared/components/Pill';
import { ORDER_STATUSES } from '../constants';

export function OrderStatusBadge({ status }: { status: string }) {
  const cfg = ORDER_STATUSES[status];
  return <Pill tone={cfg?.tone ?? 'muted'} dot>{cfg?.label ?? status}</Pill>;
}
