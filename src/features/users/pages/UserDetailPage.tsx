import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Ban, Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/shared/components/PageHeader';
import { InfoRow, Section } from '@/shared/components/InfoRow';
import { ErrorState } from '@/shared/components/State';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { formatDateTime, formatMoney, formatNumber, formatPhone, timeAgo } from '@/shared/lib/format';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { useUser, useUserActions } from '../hooks';
import { EditUserDialog } from '../components/EditUserDialog';
import { ROLE_LABELS } from '../constants';
import { CustomerVerificationPanel } from '@/features/verification/components/CustomerVerificationPanel';
import { UserFlags } from '../components/UserFlags';

export default function UserDetailPage() {
  const { uuid = '' } = useParams();
  const navigate = useNavigate();
  const { data: u, isLoading, error, refetch } = useUser(uuid);
  const { setBlocked } = useUserActions(uuid);
  const [editOpen, setEditOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (error && !u) return <ErrorState onRetry={refetch} />;
  if (isLoading || !u) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-72" /></div>;

  return (
    <>
      <PageHeader
        back={{ to: '/users', label: 'Foydalanuvchilar' }}
        title={<span className="flex items-center gap-3">{u.full_name || formatPhone(u.phone_number)}<UserFlags u={u} /></span>}
        description={`${ROLE_LABELS[u.role] ?? u.role} · qo'shilgan: ${formatDateTime(u.date_joined)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-2 size-4" />Tahrirlash</Button>
            {u.is_blocked
              ? <Button variant="outline" disabled={setBlocked.isPending} onClick={() => setBlocked.mutate(false)}><ShieldCheck className="mr-2 size-4" />Blokdan chiqarish</Button>
              : <Button variant="destructive" onClick={() => setBlockOpen(true)}><Ban className="mr-2 size-4" />Bloklash</Button>}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Section title="Ma'lumotlar">
            <InfoRow label="Telefon">{formatPhone(u.phone_number)}</InfoRow>
            <InfoRow label="Email">{u.email ?? '—'}</InfoRow>
            <InfoRow label="Telegram ID">{u.telegram_id ?? '—'}</InfoRow>
            <InfoRow label="Tasdiqlangan">{u.is_verified ? 'Ha' : "Yo'q"}</InfoRow>
            <InfoRow label="Oxirgi kirish">{u.last_login ? timeAgo(u.last_login) : '—'}</InfoRow>
            <InfoRow label="O'qilmagan xabarlar">{u.unread_notifications}</InfoRow>
          </Section>

          {u.role === 'customer' && (
            <Section title="Tasdiqlash holati">
              <CustomerVerificationPanel userUuid={u.uuid} />
            </Section>
          )}

          <Section title="Statistika">
            <InfoRow label="Buyurtmalar">{formatNumber(u.orders_count)}</InfoRow>
            <InfoRow label="Yetkazilgan">{formatNumber(u.delivered_count)}</InfoRow>
            <InfoRow label="Xarid summasi">{formatMoney(u.total_spent)}</InfoRow>
            <InfoRow label="Oxirgi buyurtma">{u.last_order_at ? timeAgo(u.last_order_at) : '—'}</InfoRow>
          </Section>

          <Section title={`Qurilmalar (${u.devices.length})`}>
            {u.devices.length === 0 && <p className="py-3 text-sm text-muted-foreground">Push uchun qurilma yo'q.</p>}
            {u.devices.map((d, i) => (
              <InfoRow key={i} label={d.device_type}>
                <Pill tone={d.is_active ? 'success' : 'muted'}>{d.is_active ? 'Faol' : 'Nofaol'}</Pill>
              </InfoRow>
            ))}
          </Section>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Section title="Oxirgi buyurtmalar">
            {u.recent_orders.length === 0 && <p className="py-3 text-sm text-muted-foreground">Buyurtmalar yo'q.</p>}
            {u.recent_orders.map((o) => (
              <button key={o.uuid} type="button" onClick={() => navigate(`/orders/${o.uuid}`)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-accent/40">
                <div className="min-w-0">
                  <div className="font-medium">{o.order_number}</div>
                  <div className="truncate text-xs text-muted-foreground">{o.partner?.name ?? '—'} · {timeAgo(o.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="min-w-[90px] text-right font-medium tabular-nums">{formatMoney(o.total_price)}</span>
                </div>
              </button>
            ))}
            {u.recent_orders.length > 0 && (
              <div className="pt-3"><Link className="text-sm text-primary hover:underline" to={`/orders?search=${encodeURIComponent(u.phone_number)}`}>Barcha buyurtmalar →</Link></div>
            )}
          </Section>

          <Section title={`Manzillar (${u.addresses.length})`}>
            {u.addresses.length === 0 && <p className="py-3 text-sm text-muted-foreground">Saqlangan manzil yo'q.</p>}
            {u.addresses.map((a) => (
              <div key={a.uuid} className="py-3 text-sm">
                <div className="flex items-center gap-2 font-medium">{a.name || a.label}{a.is_default && <Pill tone="primary">Asosiy</Pill>}</div>
                <div className="text-muted-foreground">{a.address}</div>
              </div>
            ))}
          </Section>
        </div>
      </div>

      <EditUserDialog user={u} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={blockOpen} onOpenChange={setBlockOpen} destructive confirmLabel="Bloklash"
        title="Foydalanuvchini bloklash" description={`${u.full_name || u.phone_number} tizimga kira olmaydi.`}
        onConfirm={() => setBlocked.mutateAsync(true)}
      />
    </>
  );
}
