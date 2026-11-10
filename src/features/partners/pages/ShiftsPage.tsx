import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { DateField, FilterBar, FilterSelect } from '@/shared/components/Filters';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDateTime, formatMoney } from '@/shared/lib/format';
import { cn } from '@/lib/utils';
import { filialHooks, partnerHooks, shiftHooks, type Shift } from '../api';

const STATUS = [{ value: 'OPEN', label: 'Ochiq' }, { value: 'CLOSED', label: 'Yopilgan' }];

/** Farq: 0 — yashil, kamomad — qizil, ortiqcha — sariq; ochiq smenada hali yo'q */
function Difference({ s }: { s: Shift }) {
  if (s.difference === null) return <span className="text-muted-foreground">—</span>;
  const d = Number(s.difference);
  return (
    <span className={cn('whitespace-nowrap font-medium', d === 0 ? 'text-emerald-600' : d < 0 ? 'text-destructive' : 'text-amber-600')}>
      {d > 0 ? '+' : ''}{formatMoney(d)}
    </span>
  );
}

export default function ShiftsPage() {
  const { params, query, setFilter, setPage, setPageSize, update, reset, hasFilters } = useListParams();
  const { data, isLoading, isFetching, error, refetch } = shiftHooks.useList(query);
  const { data: partners } = partnerHooks.useList({ page_size: 100, ordering: 'name' });
  const f = params.filters;
  // Filial filtri — hamkor tanlangach, faqat uning filiallari (bitta filialli kafeda ko'rinmaydi)
  const { data: filials } = filialHooks.useList({ partner: f.partner, page_size: 100 }, { enabled: !!f.partner });
  const filialOptions = (filials?.results ?? []).map((x) => ({ value: x.uuid, label: x.filial_name }));

  const columns: Column<Shift>[] = [
    { key: 'partner', header: 'Hamkor', cell: (s) => <span className="font-medium">{s.partner_name}</span> },
    { key: 'filial', header: 'Filial', hideBelow: 'md', cell: (s) => <span className="text-sm">{s.filial_name || '—'}</span> },
    { key: 'cashier', header: 'Kassir', cell: (s) => (
      <span className="text-sm">{s.opened_by_name || '—'}{s.closed_by_name && s.closed_by_name !== s.opened_by_name ? ` → ${s.closed_by_name}` : ''}</span>
    ) },
    { key: 'opened', header: 'Ochilgan', cell: (s) => <span className="whitespace-nowrap text-sm">{formatDateTime(s.opened_at)}</span> },
    { key: 'closed', header: 'Yopilgan', cell: (s) => s.closed_at
      ? <span className="whitespace-nowrap text-sm">{formatDateTime(s.closed_at)}</span>
      : <Pill tone="success" dot>Ochiq</Pill> },
    { key: 'revenue', header: 'Savdo', hideBelow: 'lg', cell: (s) => <span className="whitespace-nowrap text-sm">{formatMoney(s.total_revenue)}</span> },
    { key: 'expected', header: 'Kutilgan naqd', cell: (s) => <span className="whitespace-nowrap text-sm">{formatMoney(s.expected_closing_balance)}</span> },
    { key: 'actual', header: 'Haqiqiy naqd', cell: (s) => <span className="whitespace-nowrap text-sm">{s.closing_balance === null ? '—' : formatMoney(s.closing_balance)}</span> },
    { key: 'diff', header: 'Farq', cell: (s) => <Difference s={s} /> },
  ];

  return (
    <>
      <PageHeader title="Smenalar" description="Hamkorlar kassasi: kutilgan va haqiqiy naqd, farq (manfiy — kamomad)" />
      <FilterBar active={hasFilters} onReset={reset}>
        <FilterSelect label="Hamkor" value={f.partner ?? ''} onChange={(v) => update({ partner: v, filial: null })} className="w-[220px]"
          options={(partners?.results ?? []).map((p) => ({ value: p.uuid, label: p.name }))} />
        {f.partner && (filialOptions.length > 1 || f.filial) && (
          <FilterSelect label="Filial" value={f.filial ?? ''} onChange={(v) => setFilter('filial', v)} className="w-[200px]"
            options={filialOptions} />
        )}
        <FilterSelect label="Holat" value={f.status ?? ''} onChange={(v) => setFilter('status', v)} options={STATUS} />
        <DateField label="Dan" value={f.date_from ?? ''} onChange={(v) => setFilter('date_from', v)} />
        <DateField label="Gacha" value={f.date_to ?? ''} onChange={(v) => setFilter('date_to', v)} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(s) => s.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Smenalar yo'q" />
    </>
  );
}
