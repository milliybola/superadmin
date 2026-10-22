import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ChipTabs, FilterBar, FilterSelect, SearchInput } from '@/shared/components/Filters';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDate, formatMoney, formatNumber } from '@/shared/lib/format';
import { cuisineHooks, partnerHooks, type PartnerListItem } from '../api';
import { PARTNER_TYPE_LABELS } from '../constants';
import { PartnerFormDialog } from '../components/PartnerFormDialog';

export function PartnerStatePills({ p }: { p: Pick<PartnerListItem, 'is_active' | 'is_open' | 'is_blocked'> }) {
  if (p.is_blocked) return <Pill tone="danger">Bloklangan</Pill>;
  if (!p.is_active) return <Pill tone="muted">Nofaol</Pill>;
  return <Pill tone={p.is_open ? 'success' : 'warning'} dot>{p.is_open ? 'Ochiq' : 'Yopiq'}</Pill>;
}

const TYPE_TABS = [{ value: '', label: 'Hammasi' }, { value: 'RESTAURANT', label: 'Restoranlar' }, { value: 'SHOP', label: "Do'konlar" }];

export default function PartnersPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const { params, query, setFilter, setPage, setPageSize, setOrdering, reset, hasFilters } = useListParams({ ordering: '-created_at' });
  const { data, isLoading, isFetching, error, refetch } = partnerHooks.useList(query);
  const { data: cuisines } = cuisineHooks.useList({ page_size: 100 });
  const f = params.filters;

  const columns: Column<PartnerListItem>[] = [
    {
      key: 'name', header: 'Hamkor', sortKey: 'name',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9 rounded-lg border">
            <AvatarImage src={p.logo ?? undefined} alt="" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-xs text-primary">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="max-w-[220px] truncate font-medium">{p.name}</div>
            <div className="max-w-[220px] truncate text-xs text-muted-foreground">{p.address}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type', header: 'Turi', hideBelow: 'md',
      cell: (p) => (
        <div>
          <div>{PARTNER_TYPE_LABELS[p.partner_type] ?? p.partner_type}</div>
          {p.cuisines.length > 0 && <div className="max-w-[180px] truncate text-xs text-muted-foreground">{p.cuisines.map((c) => c.name).join(', ')}</div>}
        </div>
      ),
    },
    { key: 'state', header: 'Holat', cell: (p) => <PartnerStatePills p={p} /> },
    { key: 'filials', header: 'Filial', align: 'right', hideBelow: 'lg', cell: (p) => <span className="tabular-nums">{p.filials_count}</span> },
    { key: 'orders', header: 'Buyurtmalar', sortKey: 'orders_count', align: 'right', hideBelow: 'lg', cell: (p) => <span className="tabular-nums">{formatNumber(p.orders_count)}</span> },
    { key: 'revenue', header: 'Tushum', sortKey: 'revenue', align: 'right', hideBelow: 'xl', cell: (p) => <span className="tabular-nums">{formatMoney(p.revenue)}</span> },
    { key: 'rating', header: 'Reyting', sortKey: 'rating', align: 'right', hideBelow: 'md', cell: (p) => <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" />{p.rating.toFixed(1)}</span> },
    { key: 'created', header: "Qo'shilgan", sortKey: 'created_at', hideBelow: 'xl', cell: (p) => formatDate(p.created_at) },
  ];

  return (
    <>
      <PageHeader title="Hamkorlar" description="Restoran va do'konlarni boshqarish"
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Yangi hamkor</Button>} />

      <div className="mb-4"><ChipTabs value={f.partner_type ?? ''} onChange={(v) => setFilter('partner_type', v)} items={TYPE_TABS} /></div>

      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Nom, telefon yoki manzil..." className="w-[280px]" />
        <FilterSelect label="Oshxona" value={f.cuisine ?? ''} onChange={(v) => setFilter('cuisine', v)}
          options={(cuisines?.results ?? []).map((c) => ({ value: c.uuid, label: c.name }))} />
        <FilterSelect label="Blok" value={f.is_blocked ?? ''} onChange={(v) => setFilter('is_blocked', v)}
          options={[{ value: 'true', label: 'Bloklangan' }, { value: 'false', label: 'Bloklanmagan' }]} />
        <FilterSelect label="Hozir" value={f.is_open ?? ''} onChange={(v) => setFilter('is_open', v)}
          options={[{ value: 'true', label: 'Ochiq' }, { value: 'false', label: 'Yopiq' }]} />
        <FilterSelect label="Faollik" value={f.is_active ?? ''} onChange={(v) => setFilter('is_active', v)}
          options={[{ value: 'true', label: 'Faol' }, { value: 'false', label: 'Nofaol' }]} />
      </FilterBar>

      <DataTable
        columns={columns} rows={data?.results} rowKey={(p) => p.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        onRowClick={(p) => navigate(`/partners/${p.uuid}`)}
        ordering={params.ordering} onOrderingChange={setOrdering}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Hamkorlar topilmadi"
        emptyAction={<Button size="sm" onClick={() => setCreateOpen(true)}>Birinchi hamkorni qo'shish</Button>}
      />

      {createOpen && (
        <PartnerFormDialog open onOpenChange={setCreateOpen} onSaved={(p) => navigate(`/partners/${p.uuid}`)} />
      )}
    </>
  );
}
