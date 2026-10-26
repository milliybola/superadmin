import { useState } from 'react';
import { BellRing, CheckCircle2, Clock, Copy, ExternalLink, MapPin, MapPinOff, Phone, PhoneMissed, PhoneOff, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pill } from '@/shared/components/Pill';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { formatDateTime, formatMoney, formatNumber, formatPhone, timeAgo } from '@/shared/lib/format';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { DELIVERY_TYPES, PAYMENT_METHODS } from '@/features/orders/constants';
import type { VerificationItem } from '../api';
import { ATTEMPT_OUTCOMES, RISK_TONES, VERIFICATION_STATUS, mapLinks, waitTone } from '../constants';
import { useVerificationActions } from '../hooks';
import { CustomerVerificationPanel } from './CustomerVerificationPanel';
import { RejectDialog } from './RejectDialog';

type Outcome = 'NO_ANSWER' | 'BUSY' | 'CALLBACK' | 'OTHER';
const ATTEMPT_BUTTONS: { outcome: Outcome; label: string; icon: typeof PhoneOff }[] = [
  { outcome: 'NO_ANSWER', label: 'Javob bermadi', icon: PhoneMissed },
  { outcome: 'BUSY', label: 'Band', icon: PhoneOff },
  { outcome: 'CALLBACK', label: "Keyinroq qayta qo'ng'iroq", icon: BellRing },
  { outcome: 'OTHER', label: 'Boshqa', icon: Clock },
];

const mmss = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Raqam nusxalandi');
  } catch {
    toast.error("Nusxalab bo'lmadi");
  }
}

/** Navbatdagi (yoki tarixdagi) bitta buyurtma: mijozga qo'ng'iroq qilish uchun hamma ma'lumot va amallar */
export function VerificationCard({ item, fetchedAt, now, readOnly }: {
  item: VerificationItem;
  /** Ro'yxat oxirgi marta yuklangan vaqt (ms) — taymer shundan boshlab hisoblanadi */
  fetchedAt: number;
  now: number;
  readOnly?: boolean;
}) {
  const { approve, reject, attempt } = useVerificationActions();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [attemptOutcome, setAttemptOutcome] = useState<Outcome | null>(null);
  const [showCustomer, setShowCustomer] = useState(false);

  const waiting = item.waiting_seconds + Math.max(0, now - fetchedAt) / 1000;
  const remaining = (new Date(item.expires_at).getTime() - now) / 1000;
  const tone = waitTone(remaining);
  const c = item.customer;
  const phone = c.phone || item.contact_phone;
  const st = c.verification_status ? VERIFICATION_STATUS[c.verification_status] : null;
  const hasPoint = item.latitude != null && item.longitude != null;
  const links = hasPoint ? mapLinks(item.latitude as number, item.longitude as number) : null;
  const busy = approve.isPending || reject.isPending || attempt.isPending;
  const border = readOnly ? undefined : tone === 'danger' ? 'border-red-500/50' : tone === 'warning' ? 'border-amber-500/40' : undefined;

  return (
    <Card className={border}>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{item.order_number}</span>
              {readOnly && <OrderStatusBadge status={item.status} />}
            </div>
            <div className="text-xs text-muted-foreground">{formatDateTime(item.created_at)} · {timeAgo(item.created_at)}</div>
          </div>
          {!readOnly && (
            <div className="text-right">
              <Pill tone={tone} className="text-sm tabular-nums"><Clock className="size-3.5" />Kutmoqda {mmss(waiting)}</Pill>
              <div className="mt-1 text-xs text-muted-foreground">
                {remaining > 0 ? `Muddat tugashiga ${mmss(remaining)}` : 'Muddat tugadi — tez orada avtomatik bekor qilinadi'}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{c.name || item.contact_name || "Noma'lum"}</div>
                <div className="text-xs text-muted-foreground">
                  {c.registered
                    ? `Buyurtmalar: ${formatNumber(c.orders_total)} · yetkazilgan ${formatNumber(c.delivered)} · bekor ${formatNumber(c.cancelled)}`
                    : "Ro'yxatdan o'tmagan mijoz"}
                </div>
              </div>
              {st && <Pill tone={st.tone} dot>{st.label}</Pill>}
            </div>
            <a href={`tel:${phone}`} className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary hover:underline">
              <Phone className="size-5" />{formatPhone(phone)}
            </a>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${phone}`}><Phone className="mr-1.5 size-4" />Qo'ng'iroq qilish</a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => copy(phone)}><Copy className="mr-1.5 size-4" />Nusxalash</Button>
              {c.uuid && (
                <Button size="sm" variant="ghost" onClick={() => setShowCustomer((v) => !v)}>
                  {showCustomer ? 'Mijoz holatini yopish' : 'Mijoz holati'}
                </Button>
              )}
            </div>
            {showCustomer && c.uuid && <div className="border-t pt-3"><CustomerVerificationPanel userUuid={c.uuid} /></div>}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="primary">{item.partner?.name ?? "Hamkor yo'q"}</Pill>
              <Pill>{DELIVERY_TYPES[item.delivery_type] ?? item.delivery_type}</Pill>
              <Pill>{PAYMENT_METHODS[item.payment_method] ?? item.payment_method}</Pill>
            </div>
            <div className="text-xl font-semibold tabular-nums">
              {formatMoney(item.total_price)}
              {item.delivery_fee > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">(yetkazish {formatMoney(item.delivery_fee)})</span>}
            </div>
            {item.delivery_type === 'DELIVERY' && (
              <div className="flex items-start gap-2">
                {hasPoint ? <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> : <MapPinOff className="mt-0.5 size-4 shrink-0 text-amber-500" />}
                <div className="min-w-0">
                  <div className="break-words">{item.address || <span className="text-muted-foreground">Manzil yozilmagan</span>}</div>
                  {links ? (
                    <div className="flex gap-3 text-xs">
                      <a className="inline-flex items-center gap-1 text-primary hover:underline" href={links.yandex} target="_blank" rel="noreferrer">Yandex xarita <ExternalLink className="size-3" /></a>
                      <a className="inline-flex items-center gap-1 text-primary hover:underline" href={links.google} target="_blank" rel="noreferrer">Google xarita <ExternalLink className="size-3" /></a>
                    </div>
                  ) : (
                    <Pill tone="warning">Xaritada nuqta yo'q</Pill>
                  )}
                </div>
              </div>
            )}
            {item.description && (
              <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">Mijoz izohi: {item.description}</div>
            )}
            {item.risk_flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.risk_flags.map((f) => <Pill key={f.code} tone={RISK_TONES[f.code] ?? 'warning'}>{f.label}</Pill>)}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border">
          <div className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Buyurtma tarkibi ({item.items.length})</div>
          <ul className="divide-y text-sm">
            {item.items.map((it, i) => (
              <li key={it.uuid ?? i} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{it.product.name}</span>
                  {it.packaging_name && <span className="text-muted-foreground"> · {it.packaging_name}</span>}
                  {it.options?.length > 0 && <span className="text-muted-foreground"> · {it.options.map((o) => o.name).join(', ')}</span>}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {it.quantity}{it.unit === 'KG' ? ' kg' : '×'}{it.free_quantity > 0 && ` (+${it.free_quantity} bepul)`} · {formatMoney(it.line_total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {item.attempts.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Qo'ng'iroq urinishlari</div>
            {item.attempts.map((a, i) => {
              const cfg = ATTEMPT_OUTCOMES[a.outcome];
              return (
                <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                  <Pill tone={cfg?.tone ?? 'muted'}>{cfg?.label ?? a.outcome}</Pill>
                  {a.note && <span>{a.note}</span>}
                  <span className="text-xs text-muted-foreground">· {a.admin_name || 'Tizim'} · {formatDateTime(a.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}

        {readOnly && item.reject_reason && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">Sabab: {item.reject_reason}</div>
        )}

        {!readOnly && (
          <div className="space-y-3 border-t pt-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button size="lg" className="h-12 bg-emerald-600 text-base text-white hover:bg-emerald-700" disabled={busy} onClick={() => setApproveOpen(true)}>
                <CheckCircle2 className="mr-2 size-5" />Tasdiqlash
              </Button>
              <Button size="lg" variant="destructive" className="h-12 text-base" disabled={busy} onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 size-5" />Rad etish
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ATTEMPT_BUTTONS.map(({ outcome, label, icon: Icon }) => (
                <Button key={outcome} size="sm" variant="outline" disabled={busy} onClick={() => setAttemptOutcome(outcome)}>
                  <Icon className="mr-1.5 size-4" />{label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title={`${item.order_number} — mijozni tasdiqlash`}
        description={`${formatPhone(phone)} bilan gaplashib, buyurtma haqiqiy ekanini aniqladingizmi? Buyurtma ${item.partner?.name ?? 'hamkor'}ga yuboriladi.`}
        confirmLabel="Ha, tasdiqlash"
        reason={{ label: 'Izoh (ixtiyoriy)', placeholder: 'Masalan: manzil aniqlashtirildi' }}
        onConfirm={(note) => approve.mutateAsync({ uuid: item.uuid, note: note || undefined })}
      />
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        orderNumber={item.order_number}
        onConfirm={(reason, block) => reject.mutateAsync({ uuid: item.uuid, reason, block })}
      />
      {attemptOutcome && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setAttemptOutcome(null)}
          title={ATTEMPT_BUTTONS.find((b) => b.outcome === attemptOutcome)?.label ?? 'Urinish'}
          description="Buyurtma navbatda qoladi; urinish jurnalga yoziladi."
          confirmLabel="Jurnalga yozish"
          reason={{ label: attemptOutcome === 'OTHER' ? 'Izoh' : 'Izoh (ixtiyoriy)', required: attemptOutcome === 'OTHER', placeholder: "Masalan: 15:30 da qayta qo'ng'iroq qilaman" }}
          onConfirm={(note) => attempt.mutateAsync({ uuid: item.uuid, outcome: attemptOutcome, note: note || undefined })}
        />
      )}
    </Card>
  );
}
