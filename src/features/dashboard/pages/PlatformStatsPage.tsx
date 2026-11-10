import { useSearchParams, Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, Clock, CreditCard, Gift, ShoppingBag, Smartphone, Store, Truck, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { ErrorState } from '@/shared/components/State';
import { Pill } from '@/shared/components/Pill';
import { formatMoney, formatNumber, formatTime } from '@/shared/lib/format';
import { cn } from '@/lib/utils';
import { filialHooks, partnerHooks } from '@/features/partners/api';
import { platformStatsApi, type StatsPeriod } from '../api';

const PERIODS: { value: StatsPeriod; label: string; prev: string }[] = [
  { value: 'today', label: 'Bugun', prev: 'kechaning shu vaqtiga nisbatan' },
  { value: 'week', label: 'Hafta', prev: "o'tgan haftaning shu qismiga nisbatan" },
  { value: 'month', label: 'Oy', prev: "o'tgan oyning shu qismiga nisbatan" },
];
const ALL = '__all';

function Section({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Row({ label, value, muted }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium tabular-nums', muted && 'text-muted-foreground')}>{value}</span>
    </div>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn('tabular-nums', value > 0 ? 'text-emerald-500' : value < 0 ? 'text-red-500' : 'text-muted-foreground')}>
      {value > 0 ? '+' : ''}{value}%
    </span>
  );
}

const minutes = (v: number | null) => (v === null ? '—' : `${v} daq`);

export default function PlatformStatsPage() {
  const [params, setParams] = useSearchParams();
  const period = (PERIODS.find((p) => p.value === params.get('period'))?.value ?? 'today') as StatsPeriod;
  const partner = params.get('partner') ?? '';
  const filial = params.get('filial') ?? '';

  const set = (next: Record<string, string>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  const { data: partners } = partnerHooks.useList({ page_size: 100, ordering: 'name' });
  const { data: filials } = filialHooks.useList({ partner, page_size: 100 }, { enabled: !!partner });

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['platform-stats', period, partner, filial],
    queryFn: () => platformStatsApi.get({ period, partner: partner || undefined, filial: filial || undefined }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  if (error && !data) return <ErrorState onRetry={refetch} />;

  const prevHint = PERIODS.find((p) => p.value === period)!.prev;
  const s = data?.sources;
  const unpaid = s?.total.unpaid_completed ?? 0;
  const byFilial = data?.breakdown.by === 'filial';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platforma raqamlari"
        description={dataUpdatedAt ? `Ilova va kassa savdosi alohida · yangilangan: ${formatTime(new Date(dataUpdatedAt))}` : 'Yuklanmoqda...'}
        actions={
          <>
            <Tabs value={period} onValueChange={(v) => set({ period: v })}>
              <TabsList>{PERIODS.map((p) => <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>)}</TabsList>
            </Tabs>
            <Select value={partner || ALL} onValueChange={(v) => set({ partner: v === ALL ? '' : v, filial: '' })}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha kafelar</SelectItem>
                {(partners?.results ?? []).map((p) => <SelectItem key={p.uuid} value={p.uuid}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {partner && (
              <Select value={filial || ALL} onValueChange={(v) => set({ filial: v === ALL ? '' : v })}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Barcha filiallar</SelectItem>
                  {(filials?.results ?? []).map((f) => <SelectItem key={f.uuid} value={f.uuid}>{f.filial_name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </>
        }
      />

      {unpaid > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <span>
            <b>{unpaid} ta</b> buyurtma yakunlangan, lekin to'langan deb belgilanmagan — savdoga qo'shilmadi.
            {' '}<Link to="/orders?status=DELIVERED" className="underline">Buyurtmalarni ko'rish</Link>
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Smartphone} label="Ilova savdosi" loading={isLoading} value={formatMoney(s?.app.sales)}
          delta={s?.app.delta.sales} hint={`${formatNumber(s?.app.sold)} ta sotildi`} />
        <StatCard icon={Store} tone="info" label="Kassa savdosi" loading={isLoading} value={formatMoney(s?.pos.sales)}
          delta={s?.pos.delta.sales} hint={`${formatNumber(s?.pos.sold)} ta sotildi`} />
        <StatCard icon={Banknote} tone="success" label="Jami savdo" loading={isLoading} value={formatMoney(s?.total.sales)}
          delta={s?.total.delta.sales} hint={prevHint} />
        <StatCard icon={Truck} tone="warning" label="Yetkazish haqi" loading={isLoading} value={formatMoney(s?.total.delivery_fees)}
          hint="savdoga qo'shilmagan" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Buyurtmalar (ilova)" loading={isLoading} value={formatNumber(s?.app.orders)}
          delta={s?.app.delta.orders} hint={`bekor: ${s?.app.cancel_rate ?? 0}%`} />
        <StatCard icon={ShoppingBag} tone="info" label="Buyurtmalar (kassa)" loading={isLoading} value={formatNumber(s?.pos.orders)}
          delta={s?.pos.delta.orders} hint={`bekor: ${s?.pos.cancel_rate ?? 0}%`} />
        <StatCard icon={Banknote} tone="success" label="O'rtacha chek" loading={isLoading} value={formatMoney(s?.total.avg_check)}
          delta={s?.total.delta.avg_check} hint={`ilova ${formatMoney(s?.app.avg_check)} · kassa ${formatMoney(s?.pos.avg_check)}`} />
        <StatCard icon={Users} tone="primary" label="Ilova mijozlari" loading={isLoading} value={formatNumber(data?.customers.active)}
          hint={`yangi ${data?.customers.new ?? 0} · qaytgan ${data?.customers.returning ?? 0} (${data?.customers.returning_rate ?? 0}%)`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Kafelar" description={data?.scope.partner ? data.scope.partner.name : 'Faol va bloklanmagan hamkorlar'}>
          <Row label="Jami" value={formatNumber(data?.partners.total)} />
          <Row label="Shu davrda savdo qilgan" value={formatNumber(data?.partners.active)} />
          <Row label="Ilovadan savdo qilgan" value={formatNumber(data?.partners.active_app)} />
          <Row label="Yangi qo'shilgan" value={formatNumber(data?.partners.new)} />
          <div className="mt-2 flex flex-wrap gap-2 border-t pt-3">
            {(data?.partners.by_tariff ?? []).map((t) => <Pill key={t.code} tone={t.code === 'plus' ? 'primary' : 'muted'}>{t.name}: {t.partners}</Pill>)}
          </div>
          {(data?.partners.no_app_orders_count ?? 0) > 0 && (
            <div className="mt-3 border-t pt-3 text-sm">
              <div className="mb-1 font-medium text-amber-600 dark:text-amber-400">
                {data?.partners.no_app_orders_days} kunda ilovadan buyurtma yo'q: {data?.partners.no_app_orders_count} ta
              </div>
              <div className="text-muted-foreground">
                {data?.partners.no_app_orders.slice(0, 8).map((p, i) => (
                  <span key={p.uuid}>{i > 0 && ', '}<Link to={`/partners/${p.uuid}`} className="hover:underline">{p.name}</Link></span>
                ))}
                {(data?.partners.no_app_orders_count ?? 0) > 8 && ' ...'}
              </div>
            </div>
          )}
        </Section>

        <Section title="Bepul kvota (shu oy)" description="Ilova buyurtmalari soni. To'lov hisoblanmaydi.">
          <Row label="Kvotadan oshgan kafelar" value={formatNumber(data?.quota.partners_over)} />
          <Row label="Kvotadan ortiq buyurtmalar" value={formatNumber(data?.quota.orders_over)} />
          {(data?.quota.near_or_over.length ?? 0) === 0 ? (
            <p className="mt-2 border-t pt-3 text-sm text-muted-foreground">Kvotaga yaqin kafe yo'q.</p>
          ) : (
            <ul className="mt-2 space-y-1 border-t pt-3 text-sm">
              {data?.quota.near_or_over.slice(0, 8).map((q) => (
                <li key={q.uuid} className="flex items-center justify-between gap-2">
                  <Link to={`/partners/${q.uuid}`} className="truncate hover:underline">{q.name}</Link>
                  <span className={cn('tabular-nums', q.over > 0 ? 'font-medium text-red-500' : 'text-muted-foreground')}>{q.used} / {q.free}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Onlayn to'lovlar" description="Payme va Click">
          <Row label={<span className="inline-flex items-center gap-1.5"><CreditCard className="size-3.5" /> To'langan</span>}
            value={`${formatNumber(data?.online.paid_count)} ta · ${formatMoney(data?.online.paid_total)}`} />
          <Row label="Payme" value={formatMoney(data?.online.payme.paid_total)} muted />
          <Row label="Click" value={formatMoney(data?.online.click.paid_total)} muted />
          <Row label="Qaytarilgan" value={`${formatNumber(data?.online.refunded_count)} ta · ${formatMoney(data?.online.refunded_total)}`} />
          <Row label="Muammoli (qaytarish / fiskal)"
            value={(data?.online.problems ?? 0) > 0
              ? <Link to="/payments" className="text-red-500 underline">{data?.online.problems} ta</Link>
              : '0'} />
        </Section>
      </div>

      <Section title="MilliyGo kutilayotgan daromadi (shu oy)"
        description={`${data?.expected_revenue.month ?? ''} · tarif oylik to'lovi + kvotadan ortgan buyurtma haqi. Komissiya olinmaydi (tarif modeli); to'lov holati yozilmaydi.`}>
        <div className="grid gap-x-8 lg:grid-cols-2">
          <div>
            <Row label="Tarif to'lovlari" value={formatMoney(data?.expected_revenue.totals.subscriptions)} />
            <Row label={`Kvotadan ortgan (${formatNumber(data?.expected_revenue.totals.orders_over)} ta buyurtma)`}
              value={formatMoney(data?.expected_revenue.totals.overage_fees)} />
            <Row label={<span className="font-medium">Jami kutilayotgan</span>}
              value={<span className="font-semibold">{formatMoney(data?.expected_revenue.totals.total)}</span>} />
            <Row label="To'lovchi hamkorlar" value={`${formatNumber(data?.expected_revenue.totals.paying_partners)} / ${formatNumber(data?.expected_revenue.totals.partners)}`} muted />
          </div>
          <div>
            {(data?.expected_revenue.top.length ?? 0) === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Bu oy to'lov kutilayotgan hamkor yo'q.</p>
            ) : (
              <ul className="space-y-1 py-2 text-sm">
                {data?.expected_revenue.top.slice(0, 5).map((r) => (
                  <li key={r.uuid} className="flex items-center justify-between gap-2">
                    <Link to={`/partners/${r.uuid}`} className="truncate hover:underline">{r.name}</Link>
                    <span className="tabular-nums">{formatMoney(r.total)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/reports?group=expected" className="text-sm text-primary hover:underline">Hamkorlar bo'yicha to'liq ro'yxat</Link>
          </div>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Aksiya sovg'alari" description="Sotilgan buyurtmalardagi bepul berilganlar">
          <Row label={<span className="inline-flex items-center gap-1.5"><Gift className="size-3.5" /> Jami summa</span>} value={formatMoney(data?.promo.total.amount)} />
          <Row label="Bepul donalar" value={formatNumber(data?.promo.total.free_qty)} />
          <Row label="Aksiyali buyurtmalar" value={formatNumber(data?.promo.total.orders)} />
          <Row label="Ilova / kassa" value={`${formatMoney(data?.promo.app.amount)} / ${formatMoney(data?.promo.pos.amount)}`} muted />
        </Section>

        <Section title="Vaqt" description="Hamkorga tushgan paytdan boshlab, o'rtacha">
          <Row label={<span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" /> Tayyorlash</span>}
            value={`${minutes(data?.timing.avg_prep_minutes ?? null)} · ${data?.timing.prep_orders ?? 0} ta`} />
          <Row label="Yetkazish (to'liq)" value={`${minutes(data?.timing.avg_delivery_minutes ?? null)} · ${data?.timing.delivery_orders ?? 0} ta`} />
        </Section>

        <Section title="Qo'shimcha" description="Ma'lumot uchun">
          <Row label="Xizmat haqi (savdo ichida)" value={formatMoney(s?.total.service_charge)} />
          <Row label="Bekor / rad etilgan" value={`${formatNumber(s?.total.cancelled)} ta · ${s?.total.cancel_rate ?? 0}%`} />
          <Row label="Yakunlangan, to'lanmagan" value={formatNumber(unpaid)} />
        </Section>
      </div>

      <Section title={byFilial ? 'Filiallar kesimi' : 'Kafelar kesimi'}
        description={byFilial ? 'Tanlangan kafe filiallari bo\'yicha' : 'Kafe nomini bossangiz — uning filiallari ochiladi'}>
        {(data?.breakdown.rows.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Bu davrda buyurtma yo'q.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{byFilial ? 'Filial' : 'Kafe'}</TableHead>
                  <TableHead className="text-right">Ilova</TableHead>
                  <TableHead className="text-right">Kassa</TableHead>
                  <TableHead className="text-right">Jami savdo</TableHead>
                  <TableHead className="text-right">O'zgarish</TableHead>
                  <TableHead className="text-right">Yetkazish haqi</TableHead>
                  <TableHead className="text-right">Bekor</TableHead>
                  <TableHead className="text-right">To'lanmagan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.breakdown.rows.map((r) => (
                  <TableRow key={r.uuid ?? r.name}>
                    <TableCell className="font-medium">
                      {!byFilial && r.uuid
                        ? <button type="button" className="text-left hover:underline" onClick={() => set({ partner: r.uuid!, filial: '' })}>{r.name}</button>
                        : byFilial && r.uuid
                          ? <button type="button" className="text-left hover:underline" onClick={() => set({ filial: r.uuid! })}>{r.name}</button>
                          : r.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.app_sales)}<div className="text-xs text-muted-foreground">{r.app_sold} ta</div></TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.pos_sales)}<div className="text-xs text-muted-foreground">{r.pos_sold} ta</div></TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatMoney(r.sales)}</TableCell>
                    <TableCell className="text-right"><Delta value={r.delta} /></TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.delivery_fees)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.cancelled}</TableCell>
                    <TableCell className={cn('text-right tabular-nums', r.unpaid_completed > 0 && 'font-medium text-amber-600 dark:text-amber-400')}>{r.unpaid_completed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(data?.breakdown.total_rows ?? 0) > (data?.breakdown.rows.length ?? 0) && (
              <p className="mt-2 text-xs text-muted-foreground">Eng katta {data?.breakdown.rows.length} tasi ko'rsatildi (jami {data?.breakdown.total_rows}).</p>
            )}
          </div>
        )}
      </Section>

      <p className="text-xs text-muted-foreground">
        Savdo — yetkazilgan va to'langan buyurtmalar (yetkazish haqisiz). Bekor, rad etilgan, to'lanmagan va to'lov kutayotgan
        buyurtmalar kirmaydi. Ilova — MilliyGo mijoz ilovasi; kassa — kassir, ofitsiant va stol QR.
        Komissiya olinmaydi (tarif modeli). MilliyGo daromadi — taxminiy «kutilayotgan» raqam, to'lov holati yozilmaydi.
      </p>
    </div>
  );
}
