import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ban, BadgeCheck, MapPin, Pencil, ShieldCheck, Star, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/shared/components/PageHeader';
import { InfoRow, Section } from '@/shared/components/InfoRow';
import { ErrorState } from '@/shared/components/State';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field } from '@/shared/components/Field';
import { Pill } from '@/shared/components/Pill';
import { StatCard } from '@/shared/components/StatCard';
import { formatDateTime, formatMoney, formatNumber, formatPhone, timeAgo } from '@/shared/lib/format';
import { Bike, CheckCircle2 } from 'lucide-react';
import type { CourierDetail } from '../api';
import { COURIER_STATUSES, COURIER_TYPES, DOC_TYPE_LABELS, REVIEW_STATUSES, TRANSPORT_TYPES } from '../constants';
import { useCourier, useCourierActions } from '../hooks';
import { CourierFlags } from './CouriersPage';
import { DocumentsTab } from '../components/DocumentsTab';
import { FinanceTab } from '../components/FinanceTab';
import { CourierOrdersTab, CourierRatingsTab } from '../components/OrdersAndRatingsTabs';

function EditDialog({ courier, onClose }: { courier: CourierDetail; onClose: () => void }) {
  const { update } = useCourierActions(courier.uuid);
  const [first, ...rest] = courier.full_name.split(' ');
  const [firstName, setFirst] = useState(first ?? '');
  const [lastName, setLast] = useState(rest.join(' '));
  const [city, setCity] = useState(courier.city);
  const [type, setType] = useState(courier.courier_type);
  return (
    <FormDialog open onOpenChange={onClose} title="Kuryer ma'lumotlari" submitting={update.isPending}
      onSubmit={(e) => {
        e.preventDefault();
        if (!firstName.trim()) return;
        update.mutate({ first_name: firstName.trim(), last_name: lastName.trim(), city: city.trim(), courier_type: type }, { onSuccess: onClose });
      }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ism" required><Input value={firstName} onChange={(e) => setFirst(e.target.value)} /></Field>
        <Field label="Familiya"><Input value={lastName} onChange={(e) => setLast(e.target.value)} /></Field>
      </div>
      <Field label="Shahar"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
      <Field label="Kuryer turi">
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(COURIER_TYPES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </FormDialog>
  );
}

function Overview({ c }: { c: CourierDetail }) {
  const st = COURIER_STATUSES[c.status];
  const r = REVIEW_STATUSES[c.review_status];
  const loc = c.last_location;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Bike} label="Bugun yetkazgan" value={formatNumber(c.stats.today.delivered)} hint={`${formatMoney(c.stats.today.earned)} ishladi`} />
        <StatCard icon={Bike} tone="info" label="7 kunda" value={formatNumber(c.stats.week.delivered)} hint={formatMoney(c.stats.week.earned)} />
        <StatCard icon={Bike} tone="info" label="30 kunda" value={formatNumber(c.stats.month.delivered)} hint={formatMoney(c.stats.month.earned)} />
        <StatCard icon={CheckCircle2} tone="success" label="Bajarish ko'rsatkichi" value={c.stats.completion_rate === null ? '—' : `${c.stats.completion_rate}%`} hint={`${c.stats.cancelled_total} ta bekor qilingan`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Shaxsiy ma'lumotlar">
          <InfoRow label="Telefon">{formatPhone(c.phone)}</InfoRow>
          <InfoRow label="Shahar">{c.city || '—'}</InfoRow>
          <InfoRow label="Telegram ID">{c.telegram_id ?? <span className="text-amber-600">Bog'lanmagan (Telegram xabarlari bormaydi)</span>}</InfoRow>
          <InfoRow label="Turi">{COURIER_TYPES[c.courier_type]}{c.partner && ` · ${c.partner.name}`}</InfoRow>
          <InfoRow label="Reyting"><span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" />{c.rating.toFixed(2)} ({c.stats.ratings_count})</span></InfoRow>
          <InfoRow label="Ro'yxatdan o'tgan">{formatDateTime(c.created_at)}</InfoRow>
        </Section>

        <Section title="Transport">
          {c.vehicle ? (
            <>
              <InfoRow label="Turi">{TRANSPORT_TYPES[c.vehicle.type] ?? c.vehicle.type}</InfoRow>
              <InfoRow label="Model">{[c.vehicle.brand, c.vehicle.model].filter(Boolean).join(' ') || '—'}</InfoRow>
              <InfoRow label="Davlat raqami">{c.vehicle.plate ?? '—'}</InfoRow>
              <InfoRow label="Rang / yil">{[c.vehicle.color, c.vehicle.year].filter(Boolean).join(' · ') || '—'}</InfoRow>
            </>
          ) : <p className="py-3 text-sm text-muted-foreground">Transport ma'lumoti kiritilmagan.</p>}
        </Section>

        <Section title="Ariza va ruxsat">
          <InfoRow label="Ariza holati"><Pill tone={r.tone}>{r.label}</Pill></InfoRow>
          {c.reviewed_at && <InfoRow label="Ko'rib chiqdi">{c.reviewed_by_name || 'Admin'} · {formatDateTime(c.reviewed_at)}</InfoRow>}
          {c.review_note && <InfoRow label="Rad sababi"><span className="text-destructive">{c.review_note}</span></InfoRow>}
          <InfoRow label="Hujjatlar">{c.docs_approved} / {c.docs_total} tasdiqlangan</InfoRow>
          {c.is_blocked && <InfoRow label="Bloklangan">{c.block_reason}{c.blocked_at && <span className="block text-xs text-muted-foreground">{formatDateTime(c.blocked_at)}</span>}</InfoRow>}
        </Section>

        <Section title="Hozirgi holat">
          <InfoRow label="Holat"><Pill tone={st?.tone ?? 'muted'} dot>{st?.label ?? c.status}</Pill></InfoRow>
          <InfoRow label="Faol buyurtma">{c.active_orders}</InfoRow>
          <InfoRow label="Ishga chiqqan">{c.stats.active_session_since ? timeAgo(c.stats.active_session_since) : '—'}</InfoRow>
          <InfoRow label="Oxirgi joylashuv">
            {loc ? (
              <a className="inline-flex items-center gap-1 text-primary hover:underline" target="_blank" rel="noreferrer"
                href={`https://yandex.com/maps/?pt=${loc.longitude},${loc.latitude}&z=16`}>
                <MapPin className="size-3.5" />{timeAgo(loc.updated_at)}
              </a>
            ) : '—'}
          </InfoRow>
        </Section>
      </div>
    </div>
  );
}

export default function CourierDetailPage() {
  const { uuid = '' } = useParams();
  const { data: c, isLoading, error, refetch } = useCourier(uuid);
  const actions = useCourierActions(uuid);
  const [editOpen, setEditOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (error && !c) return <ErrorState onRetry={refetch} />;
  if (isLoading || !c) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-72" /></div>;

  const isPartner = c.courier_type === 'PARTNER';
  const { approval } = c;
  const pending = c.review_status !== 'approved';
  const issues = [
    approval.missing.length ? `Yuklanmagan: ${approval.missing.map((t) => DOC_TYPE_LABELS[t] ?? t).join(', ')}` : '',
    approval.unapproved.length ? `Tasdiqlanmagan: ${approval.unapproved.map((t) => DOC_TYPE_LABELS[t] ?? t).join(', ')}` : '',
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        back={{ to: '/couriers', label: 'Kuryerlar' }}
        title={<span className="flex items-center gap-3">{c.full_name || formatPhone(c.phone)}<CourierFlags c={c} /></span>}
        description={`${TRANSPORT_TYPES[c.vehicle?.type ?? ''] ?? 'Transport yo\'q'} · ${formatPhone(c.phone)}`}
        actions={
          <>
            {pending && <Button onClick={() => setApproveOpen(true)}><BadgeCheck className="mr-2 size-4" />Tasdiqlash</Button>}
            {c.review_status === 'pending' && <Button variant="outline" className="text-destructive" onClick={() => setRejectOpen(true)}><XCircle className="mr-2 size-4" />Rad etish</Button>}
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-2 size-4" />Tahrirlash</Button>
            {c.is_blocked
              ? <Button variant="outline" disabled={actions.unblock.isPending} onClick={() => actions.unblock.mutate()}><ShieldCheck className="mr-2 size-4" />Blokdan chiqarish</Button>
              : <Button variant="destructive" onClick={() => setBlockOpen(true)}><Ban className="mr-2 size-4" />Bloklash</Button>}
          </>
        }
      />

      {c.review_status === 'pending' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <span><b>Ariza ko'rib chiqilmoqda.</b> {issues.length ? issues.join(' · ') : 'Hamma hujjat tasdiqlangan — arizani tasdiqlashingiz mumkin.'}</span>
        </div>
      )}
      {c.review_status === 'rejected' && c.review_note && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">Ariza rad etilgan: {c.review_note}</div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          {!isPartner && <TabsTrigger value="docs">Hujjatlar ({c.docs_approved}/{c.docs_total})</TabsTrigger>}
          {!isPartner && <TabsTrigger value="finance">Moliya</TabsTrigger>}
          <TabsTrigger value="orders">Buyurtmalar</TabsTrigger>
          <TabsTrigger value="ratings">Baholar</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Overview c={c} /></TabsContent>
        {!isPartner && <TabsContent value="docs"><DocumentsTab courier={c} /></TabsContent>}
        {!isPartner && <TabsContent value="finance"><FinanceTab courier={c} /></TabsContent>}
        <TabsContent value="orders"><CourierOrdersTab courier={c} /></TabsContent>
        <TabsContent value="ratings"><CourierRatingsTab courier={c} /></TabsContent>
      </Tabs>

      {editOpen && <EditDialog courier={c} onClose={() => setEditOpen(false)} />}

      <ConfirmDialog
        open={approveOpen} onOpenChange={setApproveOpen} confirmLabel={approval.ready ? 'Tasdiqlash' : 'Baribir tasdiqlash'}
        destructive={!approval.ready} title="Kuryerni tasdiqlash"
        description={approval.ready
          ? `${c.full_name} buyurtma qabul qila boshlaydi va unga xabar yuboriladi.`
          : <>Hujjatlar to'liq tasdiqlanmagan:<br /><b>{issues.join(' · ')}</b><br />Baribir tasdiqlansinmi?</>}
        onConfirm={() => actions.approve.mutateAsync(!approval.ready)}
      />
      <ConfirmDialog
        open={rejectOpen} onOpenChange={setRejectOpen} destructive confirmLabel="Arizani rad etish" title="Arizani rad etish"
        description="Sabab kuryerga ilovada va xabar sifatida ko'rsatiladi; u ma'lumotlarini to'g'rilab qayta yuboradi."
        reason={{ label: 'Rad etish sababi', required: true, placeholder: "Masalan: pasport rasmi xira, selfi talab qilinadi" }}
        onConfirm={(reason) => actions.reject.mutateAsync(reason)}
      />
      <ConfirmDialog
        open={blockOpen} onOpenChange={setBlockOpen} destructive confirmLabel="Bloklash" title="Kuryerni bloklash"
        description={c.active_orders > 0 ? `Diqqat: kuryerda ${c.active_orders} ta faol buyurtma bor. Ularni boshqa kuryerga o'tkazing.` : 'Bloklangan kuryer ishga chiqolmaydi va buyurtma ololmaydi.'}
        reason={{ label: 'Bloklash sababi', required: true, placeholder: 'Masalan: mijozlardan takroriy shikoyat' }}
        onConfirm={(reason) => actions.block.mutateAsync(reason)}
      />
    </>
  );
}
