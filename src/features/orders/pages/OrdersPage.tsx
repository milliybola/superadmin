import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ChipTabs, DateField, FilterBar, FilterSelect, SearchInput } from '@/shared/components/Filters';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDateTime, formatMoney, formatPhone, timeAgo } from '@/shared/lib/format';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { useOrders, useOrdersMeta } from '../hooks';
import { DELIVERY_TYPES, ORDER_SOURCES, PAYMENT_METHODS, STATUS_GROUPS } from '../constants';
import type { OrderListItem } from '../api';

const toOptions = (map: Record<string, string>) => Object.entries(map).map(([value, label]) => ({ value, label }));

export default function OrdersPage() {
  const navigate = useNavigate();
  const { params, query, setFilter, setPage, setPageSize, setOrdering, reset, hasFilters } = useListParams({ ordering: '-created_at' });
  const { data, isLoading, error, refetch, isFetching } = useOrders(query);
  const { data: meta } = useOrdersMeta();
  const f = params.filters;

  const columns: Column<OrderListItem>[] = [
    {
      key: 'number', header: 'Buyurtma',
      cell: (o) => (
        <div>
          <div className="font-medium">{o.order_number}</div>
          <div className="text-xs text-muted-foreground" title={formatDateTime(o.created_at)}>{timeAgo(o.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'customer', header: 'Mijoz',
      cell: (o) => (
        <div>
          <div className="max-w-[180px] truncate">{o.customer.name || '—'}</div>
          <div className="text-xs text-muted-foreground">{formatPhone(o.customer.phone)}</div>
        </div>
      ),
    },
    { key: 'partner', header: 'Hamkor', hideBelow: 'md', cell: (o) => <span className="block max-w-[180px] truncate">{o.partner?.name ?? '—'}</span> },
    { key: 'status', header: 'Holat', cell: (o) => <OrderStatusBadge status={o.status} /> },
    {
      key: 'delivery', header: 'Turi', hideBelow: 'lg',
      cell: (o) => (
        <div className="text-sm">
          <div>{DELIVERY_TYPES[o.delivery_type] ?? o.delivery_type}</div>
          <div className="text-xs text-muted-foreground">{o.courier?.name ?? 'Kuryersiz'}</div>
        </div>
      ),
    },
    {
      key: 'payment', header: "To'lov", hideBelow: 'xl',
      cell: (o) => (
        <div className="flex items-center gap-2">
          <span>{PAYMENT_METHODS[o.payment_method] ?? o.payment_method}</span>
          <Pill tone={o.is_paid ? 'success' : 'muted'}>{o.is_paid ? "To'langan" : "To'lanmagan"}</Pill>
        </div>
      ),
    },
    { key: 'total', header: 'Summa', sortKey: 'total_price', align: 'right', cell: (o) => <span className="font-medium tabular-nums">{formatMoney(o.total_price)}</span> },
  ];

  return (
    <>
      <PageHeader title="Buyurtmalar" description={isFetching ? 'Yangilanmoqda...' : "Ro'yxat har 20 soniyada avtomatik yangilanadi"} />

      <div className="mb-4">
        <ChipTabs value={f.status ?? ''} onChange={(v) => setFilter('status', v)} items={STATUS_GROUPS} />
      </div>

      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Raqam, telefon, mijoz..." className="w-[260px]" />
        <FilterSelect label="Yetkazish" value={f.delivery_type ?? ''} onChange={(v) => setFilter('delivery_type', v)}
          options={meta?.delivery_types ?? toOptions(DELIVERY_TYPES)} />
        <FilterSelect label="To'lov" value={f.payment_method ?? ''} onChange={(v) => setFilter('payment_method', v)}
          options={meta?.payment_methods ?? toOptions(PAYMENT_METHODS)} />
        <FilterSelect label="Manba" value={f.order_source ?? ''} onChange={(v) => setFilter('order_source', v)}
          options={meta?.sources ?? toOptions(ORDER_SOURCES)} />
        <FilterSelect label="To'langan" value={f.is_paid ?? ''} onChange={(v) => setFilter('is_paid', v)}
          options={[{ value: 'true', label: 'Ha' }, { value: 'false', label: "Yo'q" }]} />
        <DateField label="Dan" value={f.date_from ?? ''} onChange={(v) => setFilter('date_from', v)} />
        <DateField label="Gacha" value={f.date_to ?? ''} onChange={(v) => setFilter('date_to', v)} />
      </FilterBar>

      <DataTable
        columns={columns} rows={data?.results} rowKey={(o) => o.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        onRowClick={(o) => navigate(`/orders/${o.uuid}`)}
        ordering={params.ordering} onOrderingChange={setOrdering}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0}
        onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Buyurtmalar topilmadi" emptyDescription="Filtrlarni o'zgartirib ko'ring."
      />
    </>
  );
}
