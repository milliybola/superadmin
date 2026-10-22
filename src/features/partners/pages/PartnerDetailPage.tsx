import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, KeyRound, Pencil, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ENDPOINTS } from '@/core/config/constants';
import { PageHeader } from '@/shared/components/PageHeader';
import { InfoRow, Section } from '@/shared/components/InfoRow';
import { ErrorState } from '@/shared/components/State';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { StatCard } from '@/shared/components/StatCard';
import { formatMoney, formatNumber, formatPhone } from '@/shared/lib/format';
import { Banknote, CheckCircle2, ShoppingBag, XCircle } from 'lucide-react';
import { filialHooks, partnerHooks, staffHooks, type Filial, type Staff } from '../api';
import { FILIAL_STATUSES, PARTNER_TYPE_LABELS, STAFF_ROLES } from '../constants';
import { PartnerFormDialog } from '../components/PartnerFormDialog';
import { CommissionCard } from '../components/CommissionCard';
import { FilialDialog, OpeningHoursDialog } from '../components/FilialDialogs';
import { PasswordDialog, StaffDialog } from '../components/StaffDialogs';
import { PartnerStatePills } from './PartnersPage';

function FilialsTab({ partnerUuid }: { partnerUuid: string }) {
  const { data, isLoading } = filialHooks.useList({ partner: partnerUuid, page_size: 100 });
  const { remove } = filialHooks.useMutations();
  const [edit, setEdit] = useState<Filial | 'new' | null>(null);
  const [hours, setHours] = useState<Filial | null>(null);
  const [del, setDel] = useState<Filial | null>(null);

  return (
    <Section title={`Filiallar (${data?.count ?? 0})`} action={<Button size="sm" onClick={() => setEdit('new')}><Plus className="mr-1.5 size-4" />Filial</Button>}>
      {isLoading && <Skeleton className="my-3 h-16" />}
      {data?.results.map((f) => (
        <div key={f.uuid} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-medium">{f.filial_name}{f.is_main && <Pill tone="primary">Bosh</Pill>}
              <Pill tone={f.filial_status === 'ACTIVE' ? 'success' : 'muted'}>{FILIAL_STATUSES[f.filial_status] ?? f.filial_status}</Pill></div>
            <div className="text-xs text-muted-foreground">{f.address || 'Manzil kiritilmagan'}{f.manager_name && ` · Menejer: ${f.manager_name}`}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setHours(f)}>Ish vaqti</Button>
            <Button variant="outline" size="sm" onClick={() => setEdit(f)}>Tahrirlash</Button>
            {!f.is_main && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDel(f)}>O'chirish</Button>}
          </div>
        </div>
      ))}
      {edit && <FilialDialog open partnerUuid={partnerUuid} filial={edit === 'new' ? undefined : edit} onOpenChange={() => setEdit(null)} />}
      {hours && <OpeningHoursDialog open filial={hours} onOpenChange={() => setHours(null)} />}
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} destructive confirmLabel="O'chirish" title="Filialni o'chirish"
        description={`«${del?.filial_name}» o'chiriladi. Buyurtmalari bor filialni o'chirib bo'lmaydi.`}
        onConfirm={() => remove.mutateAsync(del!.uuid)} />
    </Section>
  );
}

function StaffTab({ partnerUuid }: { partnerUuid: string }) {
  const { data, isLoading } = staffHooks.useList({ partner: partnerUuid, page_size: 100 });
  const { update } = staffHooks.useMutations();
  const [edit, setEdit] = useState<Staff | 'new' | null>(null);
  const [pw, setPw] = useState<Staff | null>(null);

  return (
    <Section title={`Xodimlar (${data?.count ?? 0})`} action={<Button size="sm" onClick={() => setEdit('new')}><Plus className="mr-1.5 size-4" />Xodim</Button>}>
      {isLoading && <Skeleton className="my-3 h-16" />}
      {data?.results.length === 0 && <p className="py-3 text-sm text-muted-foreground">Xodimlar yo'q.</p>}
      {data?.results.map((s) => (
        <div key={s.uuid} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-medium">{s.name}<Pill tone="info">{STAFF_ROLES[s.role] ?? s.role}</Pill></div>
            <div className="text-xs text-muted-foreground">{formatPhone(s.phone)}{s.home_filial_name && ` · ${s.home_filial_name}`}</div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={s.is_active} onCheckedChange={(v) => update.mutate({ id: s.uuid, body: { is_active: v } })} aria-label="Faol" />
            <Button variant="outline" size="sm" onClick={() => setPw(s)}><KeyRound className="mr-1.5 size-3.5" />Parol</Button>
            <Button variant="outline" size="sm" onClick={() => setEdit(s)}>Tahrirlash</Button>
          </div>
        </div>
      ))}
      {edit && <StaffDialog open partnerUuid={partnerUuid} staff={edit === 'new' ? undefined : edit} onOpenChange={() => setEdit(null)} />}
      {pw && <PasswordDialog open url={`${ENDPOINTS.ADMIN.STAFF}${pw.uuid}/set-password/`} title="Xodim parolini yangilash" subject={pw.name} onOpenChange={() => setPw(null)} />}
    </Section>
  );
}

export default function PartnerDetailPage() {
  const { uuid = '' } = useParams();
  const { data: p, isLoading, error, refetch } = partnerHooks.useDetail(uuid);
  const { act, update } = partnerHooks.useMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (error && !p) return <ErrorState onRetry={refetch} />;
  if (isLoading || !p) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-72" /></div>;

  return (
    <>
      <PageHeader
        back={{ to: '/partners', label: 'Hamkorlar' }}
        title={<span className="flex items-center gap-3">{p.name}<PartnerStatePills p={p} /></span>}
        description={`${PARTNER_TYPE_LABELS[p.partner_type] ?? p.partner_type} · ${formatPhone(p.phone)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-2 size-4" />Tahrirlash</Button>
            <Button variant="outline" onClick={() => setPwOpen(true)}><KeyRound className="mr-2 size-4" />Parol</Button>
            {p.is_blocked
              ? <Button variant="outline" disabled={act.isPending} onClick={() => act.mutate({ id: p.uuid, name: 'unblock', message: 'Blok olib tashlandi' })}><ShieldCheck className="mr-2 size-4" />Blokdan chiqarish</Button>
              : <Button variant="destructive" onClick={() => setBlockOpen(true)}><Ban className="mr-2 size-4" />Bloklash</Button>}
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="filials">Filiallar ({p.filials.length})</TabsTrigger>
          <TabsTrigger value="staff">Xodimlar ({p.staff_count})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={ShoppingBag} label="Buyurtmalar" value={formatNumber(p.stats.orders)} />
            <StatCard icon={CheckCircle2} tone="success" label="Yetkazilgan" value={formatNumber(p.stats.delivered)} />
            <StatCard icon={XCircle} tone="danger" label="Bekor qilingan" value={formatNumber(p.stats.cancelled)} />
            <StatCard icon={Banknote} tone="info" label="Tushum" value={formatMoney(p.stats.revenue)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Asosiy ma'lumotlar">
              <InfoRow label="Manzil">{p.address}</InfoRow>
              <InfoRow label="Email">{p.email ?? '—'}</InfoRow>
              <InfoRow label="Egasi">{p.owner ? <Link className="text-primary hover:underline" to={`/users/${p.owner.uuid}`}>{p.owner.full_name || p.owner.phone}</Link> : '—'}</InfoRow>
              <InfoRow label="Reyting">{p.rating.toFixed(1)}</InfoRow>
              <InfoRow label="Koordinata">{p.location_lat}, {p.location_long}</InfoRow>
              <InfoRow label="Telegram guruh">{p.telegram_group_id ?? '—'}</InfoRow>
              {p.cuisines.length > 0 && <InfoRow label="Oshxona turlari">{p.cuisines.map((c) => c.name).join(', ')}</InfoRow>}
              <InfoRow label="Hozir ochiq">
                <Switch checked={p.is_open} disabled={p.is_blocked || update.isPending} onCheckedChange={(v) => update.mutate({ id: p.uuid, body: { is_open: v } })} aria-label="Ochiq" />
              </InfoRow>
            </Section>

            <div className="space-y-4">
              <Section title="Yetkazish shartlari">
                <InfoRow label="Yetkazish narxi">{formatMoney(p.delivery_fee)}</InfoRow>
                <InfoRow label="Yetkazish vaqti">{p.delivery_time_minutes} daqiqa</InfoRow>
                <InfoRow label="Minimal buyurtma">{formatMoney(p.min_order_amount)}</InfoRow>
                <InfoRow label="Maksimal buyurtma">{p.max_order_amount ? formatMoney(p.max_order_amount) : 'Cheklov yo\'q'}</InfoRow>
                <InfoRow label="Bepul yetkazish">{p.free_delivery_threshold ? `${formatMoney(p.free_delivery_threshold)} dan` : 'Yo\'q'}</InfoRow>
              </Section>
              <Section title="Tarif" action={<Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>O'zgartirish</Button>}>
                <InfoRow label="Tarif">
                  {p.tariff_info.restricted ? p.tariff_info.name : <span className="text-muted-foreground">Cheklovsiz (tarifsiz)</span>}
                </InfoRow>
                <InfoRow label="Yetkazib berish"><Pill tone="success">Bor</Pill></InfoRow>
                <InfoRow label="Olib ketish"><Pill tone={p.tariff_info.allow_pickup ? 'success' : 'muted'}>{p.tariff_info.allow_pickup ? 'Bor' : "Yo'q"}</Pill></InfoRow>
                <InfoRow label="Zal va stollar"><Pill tone={p.tariff_info.allow_dine_in ? 'success' : 'muted'}>{p.tariff_info.allow_dine_in ? 'Bor' : "Yo'q"}</Pill></InfoRow>
                <InfoRow label="Filiallar">{p.tariff_info.usage.filials} / {p.tariff_info.max_filials ?? '∞'}</InfoRow>
                {p.tariff_info.allow_dine_in && <InfoRow label="Stollar">{p.tariff_info.usage.tables} / {p.tariff_info.max_tables ?? '∞'}</InfoRow>}
              </Section>
              <CommissionCard partnerUuid={p.uuid} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="filials"><FilialsTab partnerUuid={p.uuid} /></TabsContent>
        <TabsContent value="staff"><StaffTab partnerUuid={p.uuid} /></TabsContent>
      </Tabs>

      {editOpen && <PartnerFormDialog open partner={p} onOpenChange={setEditOpen} />}
      {pwOpen && <PasswordDialog open url={`${ENDPOINTS.ADMIN.PARTNERS}${p.uuid}/set-password/`} title="Hamkor parolini yangilash" subject={p.name} onOpenChange={setPwOpen} />}
      <ConfirmDialog open={blockOpen} onOpenChange={setBlockOpen} destructive confirmLabel="Bloklash" title="Hamkorni bloklash"
        description={`«${p.name}» yopiladi va mijozlarga ko'rinmaydi.`}
        onConfirm={() => act.mutateAsync({ id: p.uuid, name: 'block', message: 'Hamkor bloklandi' })} />
    </>
  );
}
