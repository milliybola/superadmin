import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CreditCard, RotateCcw, Wallet } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ChipTabs, DateField, FilterBar, FilterSelect, SearchInput } from '@/shared/components/Filters';
import { StatCard } from '@/shared/components/StatCard';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDateTime, formatMoney, formatNumber, toInputDate } from '@/shared/lib/format';
import { financeApi, PAYMENT_STATES, type PaymentRow } from '../api';

const daysAgo = (n: number) => toInputDate(new Date(Date.now() - n * 86_400_000));

export default function PaymentsPage() {
  const { params, query, setFilter, setPage, setPageSize, reset, hasFilters } = useListParams();
  const f = params.filters;
  const range = useMemo(() => ({ date_from: f.date_from || daysAgo(29), date_to: f.date_to || toInputDate(new Date()) }), [f.date_from, f.date_to]);
  const full = { ...query, ...range };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['payments', 'list', full], queryFn: () => financeApi.payments(full), refetchInterval: 30_000,
  });
  const { data: s } = useQuery({ queryKey: ['payments', 'summary', range], queryFn: () => financeApi.summary(range) });

  const columns: Column<PaymentRow>[] = [
    { key: 'date', header: 'Sana', cell: (r) => <span className="whitespace-nowrap text-sm">{formatDateTime(r.created_at)}</span> },
    { key: 'provider', header: 'Tizim', cell: (r) => <Pill tone={r.provider === 'payme' ? 'info' : 'primary'}>{r.provider === 'payme' ? 'Payme' : 'Click'}</Pill> },
    { key: 'order', header: 'Buyurtma', cell: (r) => <Link className="text-primary hover:underline" to={`/orders/${r.order.uuid}`}>{r.order.number ?? 'Buyurtma'}</Link> },
    { key: 'partner', header: 'Hamkor', hideBelow: 'md', cell: (r) => <Link className="hover:underline" to={`/partners/${r.partner.uuid}`}>{r.partner.name}</Link> },
    { key: 'state', header: 'Holat', cell: (r) => {
      const st = PAYMENT_STATES[r.state];
      return (
        <div className="flex flex-wrap gap-1">
          <Pill tone={st.tone}>{st.label}</Pill>
          {r.reversal_status === 'REQUIRED' && <Pill tone="danger">Qaytarish kerak</Pill>}
          {r.reversal_status === 'FAILED' && <Pill tone="danger">Qaytarilmadi</Pill>}
          {r.fiscal_status === 'FAILED' && <Pill tone="danger">Fiskal xato</Pill>}
        </div>);
    } },
    { key: 'ext', header: 'Tranzaksiya ID', hideBelow: 'xl', cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.external_id}</span> },
    { key: 'amount', header: 'Summa', align: 'right', cell: (r) => <span className="font-medium tabular-nums">{formatMoney(r.amount)}</span> },
  ];

  const problems = (s?.click.reversal_problems ?? 0) + (s?.click.fiscal_failed ?? 0);

  return (
    <>
      <PageHeader title="To'lovlar" description={`Payme va Click tranzaksiyalari · ${range.date_from} — ${range.date_to}`} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} tone="info" label="Payme (to'langan)" value={formatMoney(s?.payme.paid_total)} loading={!s} hint={`${formatNumber(s?.payme.paid_count)} ta`} />
        <StatCard icon={CreditCard} label="Click (to'langan)" value={formatMoney(s?.click.paid_total)} loading={!s} hint={`${formatNumber(s?.click.paid_count)} ta`} />
        <StatCard icon={RotateCcw} tone="warning" label="Qaytarilgan" value={formatNumber((s?.payme.refunded_count ?? 0) + (s?.click.refunded_count ?? 0))} loading={!s} />
        <StatCard icon={AlertTriangle} tone={problems ? 'danger' : 'success'} label="Muammoli" value={formatNumber(problems)} loading={!s}
          hint={problems ? "Qaytarish yoki fiskal xato — qo'lda ko'ring" : 'Hammasi joyida'} />
      </div>

      <div className="mb-4">
        <ChipTabs value={f.provider ?? ''} onChange={(v) => setFilter('provider', v)}
          items={[{ value: '', label: 'Hammasi' }, { value: 'payme', label: 'Payme' }, { value: 'click', label: 'Click' }]} />
      </div>
      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Buyurtma raqami..." className="w-[220px]" />
        <FilterSelect label="Holat" value={f.state ?? ''} onChange={(v) => setFilter('state', v)}
          options={Object.entries(PAYMENT_STATES).map(([value, x]) => ({ value, label: x.label }))} />
        <DateField label="Dan" value={f.date_from ?? range.date_from} onChange={(v) => setFilter('date_from', v)} />
        <DateField label="Gacha" value={f.date_to ?? range.date_to} onChange={(v) => setFilter('date_to', v)} />
      </FilterBar>

      <DataTable columns={columns} rows={data?.results} rowKey={(r) => `${r.provider}-${r.id}`} loading={isLoading || isFetching} error={error} onRetry={refetch}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="To'lovlar topilmadi" emptyDescription="Sana oralig'ini kengaytirib ko'ring." />
    </>
  );
}
