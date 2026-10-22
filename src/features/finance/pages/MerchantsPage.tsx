import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FilterBar, FilterSelect } from '@/shared/components/Filters';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { merchantHooks, type Merchant } from '../api';

export default function MerchantsPage() {
  const { params, query, setFilter, setPage, setPageSize, reset, hasFilters } = useListParams();
  const { data, isLoading, isFetching, error, refetch } = merchantHooks.useList(query);
  const f = params.filters;

  const columns: Column<Merchant>[] = [
    { key: 'partner', header: 'Hamkor', cell: (m) => (
      <div><Link className="font-medium hover:underline" to={`/partners/${m.partner.uuid}`}>{m.partner.name}</Link>
        <div className="text-xs text-muted-foreground">{m.legal_name || 'Yuridik nomi kiritilmagan'}</div></div>) },
    { key: 'tin', header: 'STIR', hideBelow: 'md', cell: (m) => <span className="font-mono text-sm">{m.tin || '—'}</span> },
    { key: 'payme', header: 'Payme', cell: (m) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={m.is_payme_enabled ? 'success' : 'muted'}>{m.is_payme_enabled ? 'Yoqilgan' : 'O\'chiq'}</Pill>
        {m.is_payme_enabled && m.payme_test_mode && <Pill tone="warning">Test rejim</Pill>}
      </div>) },
    { key: 'click', header: 'Click', cell: (m) => (
      <div className="flex items-center gap-1.5">
        <Pill tone={m.is_click_enabled ? 'success' : 'muted'}>{m.is_click_enabled ? 'Yoqilgan' : 'O\'chiq'}</Pill>
        {m.is_click_enabled && m.click_service_id && <span className="text-xs text-muted-foreground">service {m.click_service_id}</span>}
      </div>) },
  ];

  return (
    <>
      <PageHeader title="To'lov ulanishlari" description="Hamkorlarning Payme va Click sozlamalari. Maxfiy kalitlar bu yerda ko'rsatilmaydi." />
      <FilterBar active={hasFilters} onReset={reset}>
        <FilterSelect label="Payme" value={f.is_payme_enabled ?? ''} onChange={(v) => setFilter('is_payme_enabled', v)}
          options={[{ value: 'true', label: 'Yoqilgan' }, { value: 'false', label: "O'chiq" }]} />
        <FilterSelect label="Click" value={f.is_click_enabled ?? ''} onChange={(v) => setFilter('is_click_enabled', v)}
          options={[{ value: 'true', label: 'Yoqilgan' }, { value: 'false', label: "O'chiq" }]} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(m) => m.partner.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Ulanishlar yo'q" emptyDescription="Hamkorlar to'lov sozlamalarini o'z panelida kiritadi." />
    </>
  );
}
