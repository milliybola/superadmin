import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BatteryMedium, KeyRound, Loader2, Plus, Send, Smartphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/core/config/constants';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { Field, SwitchField } from '@/shared/components/Field';
import { FilterBar, FilterSelect } from '@/shared/components/Filters';
import { FormDialog } from '@/shared/components/FormDialog';
import { InfoRow } from '@/shared/components/InfoRow';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pill, type Tone } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDateTime, formatMoney, formatNumber, formatPhone, timeAgo } from '@/shared/lib/format';
import {
  getSmsStatus, sendTestSms, smsConfigApi, smsDeviceHooks, smsOutboxHooks,
  type SmsConfig, type SmsDevice, type SmsMessage, type SmsProvider, type SmsStatusValue,
} from '../api';

const STATUS: Record<SmsStatusValue, { label: string; tone: Tone }> = {
  PENDING: { label: 'Navbatda', tone: 'info' },
  SENDING: { label: 'Telefonda', tone: 'warning' },
  SENT: { label: 'Yuborildi', tone: 'success' },
  FAILED: { label: 'Xato', tone: 'danger' },
  EXPIRED: { label: "Muddati o'tdi", tone: 'muted' },
};

export default function SmsPage() {
  return (
    <>
      <PageHeader title="SMS" description="Tasdiqlash kodlari qaysi yo'l bilan yuborilishi: o'z SIM-kartangizli Android telefon yoki Eskiz.uz" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <ProviderCard />
          <TestSmsCard />
        </div>
        <div className="space-y-4">
          <DevicesCard />
          <EskizCard />
        </div>
      </div>
      <OutboxSection />
    </>
  );
}

// ── Provayder ────────────────────────────────────────────────────────────────

const PROVIDERS: { value: SmsProvider; title: string; text: string }[] = [
  { value: 'ANDROID', title: 'Android telefon', text: "O'z SIM-kartangizdan, MilliyGo SMS Gateway ilovasi orqali" },
  { value: 'ESKIZ', title: 'Eskiz.uz', text: "Pullik SMS xizmati, «MilliyGo» nomi bilan" },
];

function ProviderCard() {
  const { data } = useQuery({ queryKey: ['sms-config'], queryFn: smsConfigApi.get });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Yuborish usuli</CardTitle>
        <CardDescription>Foydalanuvchida Telegram bo'lsa kod avval botga yuboriladi. SMS faqat qolgan hollarda ishlatiladi.</CardDescription>
      </CardHeader>
      <CardContent>{data ? <ProviderForm data={data} /> : <Skeleton className="h-48" />}</CardContent>
    </Card>
  );
}

function ProviderForm({ data }: { data: SmsConfig }) {
  const qc = useQueryClient();
  const [provider, setProvider] = useState<SmsProvider>(data.provider);
  const [fallback, setFallback] = useState(data.fallback_to_eskiz);
  const [template, setTemplate] = useState(data.otp_template);

  const save = useMutation({
    mutationFn: () => smsConfigApi.save({ provider, fallback_to_eskiz: fallback, otp_template: template.trim() }),
    onSuccess: (d) => {
      qc.setQueryData(['sms-config'], d);
      void qc.invalidateQueries({ queryKey: ['sms-status'] });
      toast.success('Sozlamalar saqlandi');
    },
  });
  const dirty = provider !== data.provider || fallback !== data.fallback_to_eskiz || template.trim() !== data.otp_template;
  const templateError = template.trim() && !template.includes('{code}') ? "Matnda {code} bo'lishi shart" : undefined;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {PROVIDERS.map((p) => (
          <button key={p.value} type="button" onClick={() => setProvider(p.value)}
            className={cn('rounded-lg border p-3 text-left transition-colors',
              provider === p.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50')}>
            <div className="text-sm font-medium">{p.title}</div>
            <div className="text-xs text-muted-foreground">{p.text}</div>
          </button>
        ))}
      </div>
      {provider === 'ANDROID' && (
        <>
          <SwitchField label="Telefon oflayn bo'lsa Eskiz orqali" checked={fallback} onChange={setFallback}
            description="Eskiz sozlangan bo'lsagina ishlaydi; aks holda SMS yuborilmaydi" />
          <Field label="Kod matni" error={templateError} hint={`{code} o'rniga kod qo'yiladi. Bo'sh qolsa: ${data.default_template}`}>
            <Input value={template} onChange={(e) => setTemplate(e.target.value)} placeholder={data.default_template} maxLength={300} />
          </Field>
        </>
      )}
      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={!dirty || !!templateError || save.isPending}>
          {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Saqlash
        </Button>
      </div>
    </div>
  );
}

// ── Android telefonlar ───────────────────────────────────────────────────────

function DevicesCard() {
  const { data, isLoading } = smsDeviceHooks.useList({ page_size: 50 }, { refetchMs: 5000 });
  const { create, update, remove, act } = smsDeviceHooks.useMutations();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [pairing, setPairing] = useState<SmsDevice | null>(null);
  const [deleting, setDeleting] = useState<SmsDevice | null>(null);
  const devices = data?.results ?? [];

  const add = () => create.mutate({ name: name.trim() }, {
    onSuccess: (d) => { setAdding(false); setName(''); setPairing(d as SmsDevice); },
  });
  const newCode = (d: SmsDevice) => act.mutate({ id: d.uuid, name: 'pair' }, { onSuccess: (r) => setPairing(r as SmsDevice) });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Android telefonlar</span>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="mr-1 size-4" />Telefon qo'shish</Button>
        </CardTitle>
        <CardDescription>Ilova har 3 soniyada navbatni tekshiradi. Bir nechta telefon ulansa, yuk ular orasida taqsimlanadi.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-24" /> : devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali telefon ulanmagan. «Telefon qo'shish» bosing va APK'da chiqqan kodni kiriting.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {devices.map((d) => (
              <div key={d.uuid} className="flex flex-wrap items-center gap-3 py-3">
                <Smartphone className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{d.name}</span>
                    {!d.is_paired ? <Pill tone="warning">Ulanmagan</Pill>
                      : !d.is_active ? <Pill tone="muted">O'chirilgan</Pill>
                        : <Pill tone={d.is_online ? 'success' : 'danger'} dot>{d.is_online ? 'Onlayn' : 'Oflayn'}</Pill>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {d.sim_info && <span>{d.sim_info}</span>}
                    {d.battery !== null && <span className="inline-flex items-center gap-1"><BatteryMedium className="size-3.5" />{d.battery}%</span>}
                    <span>Bugun: {d.sent_today} ta{d.failed_today > 0 && <span className="text-destructive"> · {d.failed_today} xato</span>}</span>
                    {d.last_seen_at && <span>{timeAgo(d.last_seen_at)}</span>}
                    {d.app_version && <span>v{d.app_version}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={d.is_active} title="Faol" onCheckedChange={(v) => update.mutate({ id: d.uuid, body: { is_active: v } })} />
                  <Button size="icon" variant="ghost" title="Ulash kodi" onClick={() => newCode(d)}><KeyRound className="size-4" /></Button>
                  <Button size="icon" variant="ghost" title="O'chirish" onClick={() => setDeleting(d)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <FormDialog open={adding} onOpenChange={setAdding} title="Telefon qo'shish" submitLabel="Kod olish" submitting={create.isPending}
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) add(); }}>
        <Field label="Nomi" required hint="O'zingiz taniydigan nom, masalan «Samsung A15 — Beeline»">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus />
        </Field>
      </FormDialog>

      <PairingDialog device={pairing} onClose={() => setPairing(null)} />

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} destructive confirmLabel="O'chirish"
        title={`«${deleting?.name}» o'chirilsinmi?`} description="Telefon boshqa SMS ololmaydi. Qayta ulash uchun yangidan qo'shish kerak."
        onConfirm={() => deleting && remove.mutateAsync(deleting.uuid)} />
    </Card>
  );
}

function PairingDialog({ device, onClose }: { device: SmsDevice | null; onClose: () => void }) {
  return (
    <Dialog open={!!device} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>«{device?.name}» ni ulash</DialogTitle>
          <DialogDescription>Kod 10 daqiqa amal qiladi va bir marta ishlatiladi.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-muted py-5 text-center font-mono text-4xl font-semibold tracking-[0.3em]">
          {device?.pairing_code ?? '——————'}
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Telefonga <b>MilliyGo SMS Gateway</b> APK'ni o'rnating va oching.</li>
          <li>Server manzili: <code className="rounded bg-muted px-1">{API_BASE_URL}</code></li>
          <li>Yuqoridagi kodni kiriting va ruxsatlarni bering (SMS, bildirishnoma).</li>
          <li>«Ishga tushirish» bosing. Bu yerda holat «Onlayn» bo'ladi.</li>
        </ol>
        <p className="text-xs text-muted-foreground">Telefon avval ulangan bo'lsa, yangi kod bilan qayta ulanganda eski ulanish bekor bo'ladi.</p>
      </DialogContent>
    </Dialog>
  );
}

// ── Eskiz ────────────────────────────────────────────────────────────────────

function EskizCard() {
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ['sms-status'], queryFn: getSmsStatus, staleTime: 60_000 });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Eskiz.uz</span>
          {data && <Pill tone={data.enabled ? 'success' : 'muted'} dot>{data.enabled ? 'Sozlangan' : 'Sozlanmagan'}</Pill>}
        </CardTitle>
        <CardDescription>Hisob ma'lumotlari serverdagi `.env` faylida saqlanadi.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? <Skeleton className="h-24" /> : (
          <div className="divide-y divide-border/60">
            {data.enabled && (
              <InfoRow label="Hisobdagi qoldiq">{data.balance !== null ? formatMoney(data.balance) : <span className="text-destructive">{data.error || "Noma'lum"}</span>}</InfoRow>
            )}
            {data.enabled && <InfoRow label="Jo'natuvchi">{data.sender}</InfoRow>}
            <InfoRow label="Limit">{data.per_phone_daily} ta / raqam, {formatNumber(data.global_daily)} ta / kun (butun tizim)</InfoRow>
            {data.enabled ? <InfoRow label="Matn shabloni"><span className="font-mono text-xs">{data.template}</span></InfoRow> : (
              <p className="py-2 text-sm text-muted-foreground">
                Yoqish uchun serverda <code>ESKIZ_EMAIL</code> va <code>ESKIZ_PASSWORD</code> ni kiriting va backendni qayta ishga tushiring.
              </p>
            )}
          </div>
        )}
        {data?.enabled && (
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>Yangilash</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sinov ────────────────────────────────────────────────────────────────────

function TestSmsCard() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState('+998');
  const [text, setText] = useState('MilliyGo: sinov SMS.');
  const send = useMutation({
    mutationFn: () => sendTestSms({ phone, text }),
    onSuccess: (r) => { toast.success(r.detail); void qc.invalidateQueries({ queryKey: ['sms-outbox'] }); },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sinov SMS</CardTitle>
        <CardDescription>Tanlangan usul orqali yuboriladi. Sozlamani tekshirish uchun o'z raqamingizga yuboring.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
          <Field label="Telefon raqami"><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></Field>
          <Field label="Matn"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={480} /></Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={send.isPending || phone.replace(/\D/g, '').length < 9}>
              {send.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}Yuborish
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Navbat / tarix ───────────────────────────────────────────────────────────

function OutboxSection() {
  const { params, query, setFilter, setPage, setPageSize, reset, hasFilters } = useListParams();
  const { data, isLoading, error, refetch } = smsOutboxHooks.useList(query, { refetchMs: 5000 });
  const f = params.filters;

  const columns: Column<SmsMessage>[] = [
    { key: 'date', header: 'Vaqt', cell: (m) => <span className="whitespace-nowrap text-sm">{formatDateTime(m.created_at)}</span> },
    { key: 'phone', header: 'Raqam', cell: (m) => <span className="whitespace-nowrap">{formatPhone(m.phone)}</span> },
    { key: 'text', header: 'Matn', hideBelow: 'md', cell: (m) => <span className="line-clamp-2 text-sm text-muted-foreground">{m.text}</span> },
    { key: 'status', header: 'Holat', cell: (m) => (
      <div>
        <Pill tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Pill>
        {m.error && <div className="mt-0.5 text-xs text-destructive">{m.error}</div>}
      </div>
    ) },
    { key: 'device', header: 'Telefon', hideBelow: 'lg', cell: (m) => <span className="text-sm">{m.device_name ?? '—'}</span> },
  ];

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-base font-semibold">Telefon orqali yuborilgan SMS'lar</h2>
      <FilterBar active={hasFilters} onReset={reset}>
        <FilterSelect label="Holat" value={f.status ?? ''} onChange={(v) => setFilter('status', v)}
          options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))} />
        <FilterSelect label="Turi" value={f.kind ?? ''} onChange={(v) => setFilter('kind', v)}
          options={[{ value: 'OTP', label: 'Tasdiqlash kodi' }, { value: 'OTHER', label: 'Boshqa' }]} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(m) => String(m.id)} loading={isLoading} error={error} onRetry={refetch}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Hali SMS yo'q" emptyDescription="Android usuli tanlanganda yuborilgan xabarlar shu yerda ko'rinadi" />
    </div>
  );
}
