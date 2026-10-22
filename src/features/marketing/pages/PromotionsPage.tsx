import { useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ChipTabs, FilterBar } from '@/shared/components/Filters';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDate } from '@/shared/lib/format';
import { promotionHooks, type Promotion } from '../api';

export default function PromotionsPage() {
  const { params, query, setFilter, setPage, setPageSize, reset, hasFilters } = useListParams();
  const { data, isLoading, isFetching, error, refetch } = promotionHooks.useList(query);
  const { update, remove } = promotionHooks.useMutations();
  const [del, setDel] = useState<Promotion | null>(null);
  const f = params.filters;

  const columns: Column<Promotion>[] = [
    { key: 'label', header: 'Aksiya', cell: (p) => <Pill tone="primary" className="text-sm">{p.label}</Pill> },
    { key: 'partner', header: 'Hamkor', cell: (p) => <span className="font-medium">{p.partner.name}</span> },
    { key: 'products', header: 'Mahsulotlar', hideBelow: 'md', cell: (p) => (
      <span className="block max-w-[260px] truncate text-muted-foreground" title={p.products.join(', ')}>{p.products.join(', ') || '—'}</span>) },
    { key: 'period', header: 'Muddat', hideBelow: 'lg', cell: (p) => (
      <span className="text-sm">{p.start_date ? formatDate(p.start_date) : 'Boshidan'} — {p.end_date ? formatDate(p.end_date) : 'muddatsiz'}</span>) },
    { key: 'state', header: 'Holat', cell: (p) => <Pill tone={p.is_live ? 'success' : 'muted'} dot>{p.is_live ? 'Amalda' : p.is_active ? 'Muddati o\'tgan / kutilmoqda' : 'Nofaol'}</Pill> },
    { key: 'active', header: 'Faol', cell: (p) => <Switch checked={p.is_active} onCheckedChange={(v) => update.mutate({ id: p.uuid, body: { is_active: v } })} aria-label="Faol" /> },
    { key: 'del', header: '', align: 'right', cell: (p) => <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDel(p)}>O'chirish</Button> },
  ];

  return (
    <>
      <PageHeader title="Aksiyalar" description="Hamkorlar yaratgan 1+1 / 2+1 aksiyalarini nazorat qilish. Aksiyani hamkor o'z panelida yaratadi." />
      <div className="mb-4">
        <ChipTabs value={f.live ?? ''} onChange={(v) => setFilter('live', v)}
          items={[{ value: '', label: 'Hammasi' }, { value: 'true', label: 'Amalda' }, { value: 'false', label: 'Amalda emas' }]} />
      </div>
      <FilterBar active={hasFilters} onReset={reset}><span /></FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(p) => p.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Aksiyalar yo'q" />
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} destructive confirmLabel="O'chirish" title="Aksiyani o'chirish"
        description={`${del?.partner.name}: ${del?.label} aksiyasi o'chiriladi.`} onConfirm={() => remove.mutateAsync(del!.uuid)} />
    </>
  );
}
