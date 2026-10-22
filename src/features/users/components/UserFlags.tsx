import { Pill } from '@/shared/components/Pill';
import type { AdminUser } from '../api';

export function UserFlags({ u }: { u: Pick<AdminUser, 'is_blocked' | 'is_active'> }) {
  if (u.is_blocked) return <Pill tone="danger">Bloklangan</Pill>;
  if (!u.is_active) return <Pill tone="muted">Nofaol</Pill>;
  return <Pill tone="success">Faol</Pill>;
}
