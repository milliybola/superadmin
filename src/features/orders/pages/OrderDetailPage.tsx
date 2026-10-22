import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bike, Ban, MapPin, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/shared/components/PageHeader';
import { InfoRow, Section } from '@/shared/components/InfoRow';
import { ErrorState } from '@/shared/components/State';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { formatDateTime, formatMoney, formatPhone } from '@/shared/lib/format';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { ChangeStatusDialog } from '../components/ChangeStatusDialog';
import { AssignCourierDialog } from '../components/AssignCourierDialog';
import { useOrder, useOrderActions } from '../hooks';
import { ACTOR_LABELS, DELIVERY_TYPES, ORDER_SOURCES, PAYMENT_METHODS, TERMINAL_STATUSES, orderStatusLabel } from '../constants';

export default function OrderDetailPage() {
  const { uuid = '' } = useParams();
  const { data: order, isLoading, error, refetch } = useOrder(uuid);
  const { changeStatus } = useOrderActions(uuid);
  const [statusOpen, setStatusOpen] = useState(false);
  const [courierOpen, setCourierOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (error && !order) return <ErrorState onRetry={refetch} />;
  if (isLoading || !order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  const terminal = TERMINAL_STATUSES.includes(order.status);
  const canAssign = !terminal && order.delivery_type === 'DELIVERY';

  return (
    <>
      <PageHeader
        back={{ to: '/orders', label: 'Buyurtmalar' }}
        title={<span className="flex items-center gap-3">{order.order_number}<OrderStatusBadge status={order.status} /></span>}
        description={`${formatDateTime(order.created_at)} · ${DELIVERY_TYPES[order.delivery_type] ?? order.delivery_type}`}
        actions={
          <>
            {canAssign && <Button variant="outline" onClick={() => setCourierOpen(true)}><Bike className="mr-2 size-4" />{order.courier ? "Kuryerni almashtirish" : 'Kuryer biriktirish'}</Button>}
            <Button variant="outline" onClick={() => setStatusOpen(true)}><Repeat className="mr-2 size-4" />Holatni o'zgartirish</Button>
            {!terminal && <Button variant="destructive" onClick={() => setCancelOpen(true)}><Ban className="mr-2 size-4" />Bekor qilish</Button>}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title={`Mahsulotlar (${order.items.length})`}>
            {order.items.map((it) => (
              <div key={it.uuid} className="flex items-start gap-3 py-3">
                {it.product.image
                  ? <img src={it.product.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  : <div className="size-12 shrink-0 rounded-lg bg-muted" />}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{it.product.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {it.quantity} {it.unit === 'KG' ? 'kg' : 'dona'}{it.packaging_name && ` · ${it.packaging_name}`} × {formatMoney(it.price_at_time_of_order)}
                    {it.free_quantity > 0 && ` · +${it.free_quantity} bepul`}
                  </div>
                  {it.options.length > 0 && (
                    <div className="mt-0.5 text-xs text-muted-foreground">{it.options.map((o) => o.name).join(', ')}</div>
                  )}
                  {it.promotion_label && <Pill tone="success" className="mt-1">{it.promotion_label}</Pill>}
                </div>
                <div className="text-right">
                  <div className="font-medium tabular-nums">{formatMoney(it.line_total)}</div>
                  {it.discount_amount > 0 && <div className="text-xs text-emerald-600">−{formatMoney(it.discount_amount)}</div>}
                </div>
              </div>
            ))}
            <div className="space-y-0.5 pt-2">
              <InfoRow label="Mahsulotlar">{formatMoney(order.subtotal)}</InfoRow>
              {order.discount_amount > 0 && <InfoRow label="Chegirma">−{formatMoney(order.discount_amount)}</InfoRow>}
              <InfoRow label="Yetkazish">{formatMoney(order.delivery_fee)}</InfoRow>
              <InfoRow label="Jami"><span className="text-base">{formatMoney(order.total_price)}</span></InfoRow>
            </div>
          </Section>

          <Section title="Holatlar tarixi">
            {order.status_history.length === 0 && <p className="py-3 text-sm text-muted-foreground">Tarix yozilmagan.</p>}
            <ol className="space-y-4 py-3">
              {[...order.status_history].reverse().map((h, i) => (
                <li key={i} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{h.from_status ? `${orderStatusLabel(h.from_status)} → ` : ''}{orderStatusLabel(h.to_status)}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ACTOR_LABELS[h.actor_type] ?? h.actor_type}{h.actor_name && ` · ${h.actor_name}`}
                  </div>
                  {h.note && <div className="mt-0.5 text-sm">{h.note}</div>}
                </li>
              ))}
            </ol>
          </Section>

          {order.dispatch_log.length > 0 && (
            <Section title="Kuryer qidiruvi">
              {order.dispatch_log.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <span>{d.courier?.name ?? '—'} · {d.action}</span>
                  <span className="flex items-center gap-2">
                    <Pill tone={d.success ? 'success' : 'muted'}>{d.success ? 'Muvaffaqiyatli' : 'Yo\'q'}</Pill>
                    <span className="text-xs text-muted-foreground">{formatDateTime(d.created_at)}</span>
                  </span>
                </div>
              ))}
            </Section>
          )}
        </div>

        <div className="space-y-4">
          <Section title="Mijoz">
            <InfoRow label="Ism">
              {order.customer.uuid ? <Link className="text-primary hover:underline" to={`/users/${order.customer.uuid}`}>{order.customer.name || '—'}</Link> : (order.customer.name || '—')}
            </InfoRow>
            <InfoRow label="Telefon">{formatPhone(order.customer.phone)}</InfoRow>
            <InfoRow label="Ro'yxatdan o'tgan">{order.customer.registered ? 'Ha' : "Yo'q"}</InfoRow>
          </Section>

          <Section title="Hamkor">
            <InfoRow label="Nomi">{order.partner ? <Link className="text-primary hover:underline" to={`/partners/${order.partner.uuid}`}>{order.partner.name}</Link> : '—'}</InfoRow>
            {order.filial_name && <InfoRow label="Filial">{order.filial_name}</InfoRow>}
            {order.partner && <InfoRow label="Telefon">{formatPhone(order.partner.phone)}</InfoRow>}
          </Section>

          <Section title="Kuryer">
            {order.courier ? (
              <>
                <InfoRow label="Ism"><Link className="text-primary hover:underline" to={`/couriers/${order.courier.uuid}`}>{order.courier.name}</Link></InfoRow>
                <InfoRow label="Telefon">{formatPhone(order.courier.phone)}</InfoRow>
              </>
            ) : (
              <p className="py-3 text-sm text-muted-foreground">
                {order.no_couriers_nearby ? "Yaqin atrofda kuryer topilmadi." : 'Kuryer biriktirilmagan.'}
              </p>
            )}
          </Section>

          <Section title="Yetkazish va to'lov">
            {order.address && <InfoRow label="Manzil"><span className="inline-flex items-start gap-1"><MapPin className="mt-0.5 size-3.5 shrink-0" />{order.address}</span></InfoRow>}
            {order.table_number && <InfoRow label="Stol">{order.table_number}</InfoRow>}
            <InfoRow label="To'lov usuli">{PAYMENT_METHODS[order.payment_method] ?? order.payment_method}</InfoRow>
            <InfoRow label="To'lov holati"><Pill tone={order.is_paid ? 'success' : 'warning'}>{order.is_paid ? "To'langan" : "To'lanmagan"}</Pill></InfoRow>
            <InfoRow label="Manba">{ORDER_SOURCES[order.order_source] ?? order.order_source}</InfoRow>
            {order.description && <InfoRow label="Izoh">{order.description}</InfoRow>}
            {order.reject_reason && <InfoRow label="Bekor sababi"><span className="text-destructive">{order.reject_reason}</span></InfoRow>}
          </Section>
        </div>
      </div>

      <ChangeStatusDialog order={order} open={statusOpen} onOpenChange={setStatusOpen} />
      <AssignCourierDialog order={order} open={courierOpen} onOpenChange={setCourierOpen} />
      <ConfirmDialog
        open={cancelOpen} onOpenChange={setCancelOpen} destructive confirmLabel="Buyurtmani bekor qilish"
        title="Buyurtmani bekor qilish" description={`${order.order_number} bekor qilinadi, mijozga bildirishnoma yuboriladi.`}
        reason={{ label: 'Bekor qilish sababi', required: true, placeholder: 'Mijoz va hamkorga ko\'rsatiladi' }}
        onConfirm={(note) => changeStatus.mutateAsync({ status: 'CANCELLED', note })}
      />
    </>
  );
}
