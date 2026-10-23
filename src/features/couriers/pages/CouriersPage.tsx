import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Banknote, Bike, Download, FileWarning, Map as MapIcon, Radio, Star, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ChipTabs, FilterBar, FilterSelect, SearchInput } from '@/shared/components/Filters';
import { StatCard } from '@/shared/components/StatCard';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { getErrorMessage } from '@/shared/lib/errors';
import { formatMoney, formatNumber, formatPhone, timeAgo } from '@/shared/lib/format';
import { useStage } from '@/app/stage';
import { couriersApi, type Courier } from '../api';
import { COURIER_STATUSES, COURIER_TYPES, REVIEW_STATUSES, TRANSPORT_TYPES } from '../constants';
import { useCouriers, useCouriersSummary } from '../hooks';

export function CourierFlags({ c }: { c: Pick<Courier, 'is_blocked' | 'review_status' | 'is_active'> }) {
  if (c.is_blocked) return <Pill tone="danger">Bloklangan</Pill>;
  const r = REVIEW_STATUSES[c.review_status];
  if (c.review_status !== 'approved') return <Pill tone={r.tone}>{r.label}</Pill>;
  if (!c.is_active) return <Pill tone="muted">Nofaol</Pill>;
  return <Pill tone="success">Faol</Pill>;
}

/** Tab → backend filtri */
const TAB_FILTERS: Record<string, Record<string, string>> = {
  pending: { review_status: 'pending' },
  approved: { review_status: 'approved', is_blocked: 'false' },
  rejected: { review_status: 'rejected' },
  blocked: { is_blocked: 'true' },
};

export default function CouriersPage() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const { params, query, setFilter, setPage, setPageSize, setOrdering, reset, hasFilters } = useListParams({ ordering: '-created_at' });
  const { stage } = useStage();
  const partnerOnly = stage === 1;
  const f = params.filters;
  const tab = f.tab ?? '';

  // `tab` — UI uchun; backendga unga mos filtrlar yuboriladi
  const apiQuery = {
    ...query, tab: undefined,
    ...(partnerOnly ? { docs_issue: undefined, has_balance: undefined } : {}),
    ...(partnerOnly ? {} : (TAB_FILTERS[tab] ?? {})),
    ...(partnerOnly ? { courier_type: 'PARTNER' } : {}),
  };
  const { data, isLoading, error, refetch, isFetching } = useCouriers(apiQuery);
  const { data: s } = useCouriersSummary(partnerOnly ? { courier_type: 'PARTNER' } : undefined);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await couriersApi.exportCsv(apiQuery);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const allColumns: Column<Courier>[] = [
    {
      key: 'name', header: 'Kuryer', sortKey: 'first_name',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <span className={`size-2 shrink-0 rounded-full ${c.is_online ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} title={c.is_online ? 'Onlayn' : 'Oflayn'} />
          <div>
            <div className="font-medium">{c.full_name || '—'}</div>
            <div className="text-xs text-muted-foreground">{formatPhone(c.phone)}{c.city && ` · ${c.city}`}</div>
          </div>
        </div>
      ),
    },
    { key: 'review', header: 'Ariza / akkaunt', cell: (c) => <CourierFlags c={c} /> },
    {
      key: 'status', header: 'Holat',
      cell: (c) => {
        const st = COURIER_STATUSES[c.status];
        return (
          <div>
            <Pill tone={st?.tone ?? 'muted'} dot>{st?.label ?? c.status}</Pill>
            {c.active_orders > 0 && <div className="mt-0.5 text-xs text-muted-foreground">{c.active_orders} ta faol buyurtma</div>}
          </div>
        );
      },
    },
    {
      key: 'vehicle', header: 'Transport', hideBelow: 'md',
      cell: (c) => (
        <div className="text-sm">
          <div>{c.vehicle ? (TRANSPORT_TYPES[c.vehicle.type] ?? c.vehicle.type) : '—'}</div>
          <div className="text-xs text-muted-foreground">{c.vehicle?.plate || COURIER_TYPES[c.courier_type]}</div>
        </div>
      ),
    },
    {
      key: 'docs', header: 'Hujjat', hideBelow: 'lg',
      cell: (c) => <span className={`text-sm tabular-nums ${c.docs_total && c.docs_approved < c.docs_total ? 'text-amber-600' : ''}`}>{c.docs_approved}/{c.docs_total}</span>,
    },
    { key: 'delivered', header: 'Yetkazgan', sortKey: 'delivered_total', align: 'right', hideBelow: 'lg', cell: (c) => <span className="tabular-nums">{formatNumber(c.delivered_total)}</span> },
    { key: 'rating', header: 'Reyting', sortKey: 'rating', align: 'right', hideBelow: 'md', cell: (c) => <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span> },
    { key: 'balance', header: 'Balans', sortKey: 'balance', align: 'right', hideBelow: 'xl', cell: (c) => <span className={`tabular-nums ${c.balance > 0 ? 'font-medium' : 'text-muted-foreground'}`}>{formatMoney(c.balance)}</span> },
    { key: 'seen', header: 'Oxirgi faollik', sortKey: 'last_seen', hideBelow: 'xl', cell: (c) => (c.last_seen ? timeAgo(c.last_seen) : '—') },
  ];

  const columns = partnerOnly ? allColumns.filter((c) => !['review', 'docs', 'balance'].includes(c.key)) : allColumns;

  const tabs = [
    { value: '', label: 'Hammasi', count: s?.total },
    { value: 'pending', label: 'Arizalar', count: s?.pending },
    { value: 'approved', label: 'Faol', count: s ? s.approved - 0 : undefined },
    { value: 'rejected', label: 'Rad etilgan', count: s?.rejected },
    { value: 'blocked', label: 'Bloklangan', count: s?.blocked },
  ];

  return (
    <>
      <PageHeader
        title={partnerOnly ? 'Hamkor kuryerlari' : 'Kuryerlar'}
        description={isFetching ? 'Yangilanmoqda...' : partnerOnly ? "Hamkorlarning o'z kuryerlari va jonli holati" : 'Arizalar, hujjatlar, hisob-kitob va jonli holat'}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={exporting}><Download className="mr-2 size-4" />CSV</Button>
            <Button asChild><Link to="/couriers/map"><MapIcon className="mr-2 size-4" />Jonli xarita</Link></Button>
          </>
        }
      />

      {!partnerOnly && (
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button type="button" className="text-left" onClick={() => setFilter('tab', 'pending')}>
          <StatCard icon={UserCheck} tone={s?.pending ? 'warning' : 'success'} label="Ko'rib chiqish kutmoqda" value={formatNumber(s?.pending)} loading={!s} hint={`${s?.new_week ?? 0} ta yangi (7 kun)`} />
        </button>
        <StatCard icon={Radio} tone="success" label="Onlayn" value={formatNumber(s?.online)} loading={!s} hint={`${s?.available ?? 0} bo'sh · ${s?.busy ?? 0} band`} />
        <StatCard icon={Bike} tone="info" label="Bugun yetkazilgan" value={formatNumber(s?.deliveries_today)} loading={!s} />
        <button type="button" className="text-left" onClick={() => setFilter('has_balance', 'true')}>
          <StatCard icon={Banknote} tone="warning" label="Kuryerlarga qarz" value={formatMoney(s?.balance_owed)} loading={!s} hint="to'lanmagan balans" />
        </button>
        <button type="button" className="text-left" onClick={() => setFilter('docs_issue', 'true')}>
          <StatCard icon={FileWarning} tone={s?.docs_expiring ? 'danger' : 'success'} label="Hujjat muddati" value={formatNumber(s?.docs_expiring)} loading={!s} hint="tugagan yoki 30 kunda tugaydi" />
        </button>
      </div>
      )}

      {!partnerOnly && !!s?.unassigned_orders && (
        <Link to="/couriers/map" className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-4" />
          <b>{s.unassigned_orders}</b> ta buyurtma kuryer kutmoqda — xaritada ko'rish
        </Link>
      )}

      {!partnerOnly && <div className="mb-4"><ChipTabs value={tab} onChange={(v) => setFilter('tab', v)} items={tabs} /></div>}

      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Ism, telefon, davlat raqami, shahar..." className="w-[300px]" />
        <FilterSelect label="Holat" value={f.status ?? ''} onChange={(v) => setFilter('status', v)} options={Object.entries(COURIER_STATUSES).map(([value, x]) => ({ value, label: x.label }))} />
        <FilterSelect label="Transport" value={f.transport ?? ''} onChange={(v) => setFilter('transport', v)} options={Object.entries(TRANSPORT_TYPES).map(([value, label]) => ({ value, label }))} />
        {!partnerOnly && <FilterSelect label="Turi" value={f.courier_type ?? ''} onChange={(v) => setFilter('courier_type', v)} options={Object.entries(COURIER_TYPES).map(([value, label]) => ({ value, label }))} />}
        <FilterSelect label="Onlayn" value={f.online ?? ''} onChange={(v) => setFilter('online', v)} options={[{ value: 'true', label: 'Onlayn' }, { value: 'false', label: 'Oflayn' }]} />
        {!partnerOnly && <FilterSelect label="Balans" value={f.has_balance ?? ''} onChange={(v) => setFilter('has_balance', v)} options={[{ value: 'true', label: 'Qarzi bor' }, { value: 'false', label: "Qarzi yo'q" }]} />}
      </FilterBar>

      <DataTable
        columns={columns} rows={data?.results} rowKey={(c) => c.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        onRowClick={(c) => navigate(`/couriers/${c.uuid}`)}
        ordering={params.ordering} onOrderingChange={setOrdering}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0}
        onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Kuryerlar topilmadi" emptyDescription={hasFilters || tab ? "Filtrlarni o'zgartirib ko'ring." : "Kuryerlar ilovadan ro'yxatdan o'tgach shu yerda paydo bo'ladi."}
      />
    </>
  );
}
