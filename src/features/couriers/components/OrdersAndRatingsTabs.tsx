import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ChipTabs } from '@/shared/components/Filters';
import { EmptyState } from '@/shared/components/State';
import { formatDateTime, formatMoney, timeAgo } from '@/shared/lib/format';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { ACTIVE_STATUSES } from '@/features/orders/constants';
import { useOrders } from '@/features/orders/hooks';
import type { OrderListItem } from '@/features/orders/api';
import { couriersApi, type CourierDetail } from '../api';

const GROUPS = [
  { value: '', label: 'Hammasi' },
  { value: ACTIVE_STATUSES.join(','), label: 'Faol' },
  { value: 'DELIVERED', label: 'Yetkazilgan' },
  { value: 'CANCELLED,REJECTED', label: 'Bekor qilingan' },
];

/** Kuryerning buyurtmalari (buyurtmalar ro'yxatining `courier` filtri orqali) */
export function CourierOrdersTab({ courier }: { courier: CourierDetail }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useOrders({ courier: courier.uuid, page, page_size: 20, ordering: '-created_at', ...(status ? { status } : {}) }, 30_000);

  const columns: Column<OrderListItem>[] = [
    { key: 'n', header: 'Buyurtma', cell: (o) => <div><div className="font-medium">{o.order_number}</div><div className="text-xs text-muted-foreground" title={formatDateTime(o.created_at)}>{timeAgo(o.created_at)}</div></div> },
    { key: 'partner', header: 'Hamkor', hideBelow: 'md', cell: (o) => o.partner?.name ?? '—' },
    { key: 'customer', header: 'Mijoz', hideBelow: 'lg', cell: (o) => o.customer.name || '—' },
    { key: 'status', header: 'Holat', cell: (o) => <OrderStatusBadge status={o.status} /> },
    { key: 'total', header: 'Summa', align: 'right', cell: (o) => <span className="tabular-nums">{formatMoney(o.total_price)}</span> },
  ];

  return (
    <div className="space-y-4">
      <ChipTabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} items={GROUPS} />
      <DataTable columns={columns} rows={data?.results} rowKey={(o) => o.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        onRowClick={(o) => navigate(`/orders/${o.uuid}`)} page={page} pageSize={20} total={data?.count ?? 0} onPageChange={setPage}
        emptyTitle="Buyurtmalar yo'q" />
    </div>
  );
}

export function CourierRatingsTab({ courier }: { courier: CourierDetail }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['couriers', 'ratings', courier.uuid, page], queryFn: () => couriersApi.ratings(courier.uuid, { page, page_size: 10 }) });
  const total = data?.count ?? 0;
  const dist = data?.distribution ?? {};
  const max = Math.max(1, ...Object.values(dist));

  if (!isLoading && total === 0) return <Card><EmptyState title="Baholar yo'q" description="Mijozlar yetkazilgan buyurtmani baholagach shu yerda ko'rinadi." /></Card>;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5">
        <div className="flex items-center gap-2"><Star className="size-6 fill-amber-400 text-amber-400" /><span className="text-3xl font-semibold">{courier.stats.rating_avg.toFixed(2)}</span></div>
        <div className="mb-4 text-sm text-muted-foreground">{courier.stats.ratings_count} ta baho</div>
        {[5, 4, 3, 2, 1].map((s) => (
          <div key={s} className="mb-1.5 flex items-center gap-2 text-sm">
            <span className="w-3 tabular-nums">{s}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: `${((dist[String(s)] ?? 0) / max) * 100}%` }} /></div>
            <span className="w-6 text-right tabular-nums text-muted-foreground">{dist[String(s)] ?? 0}</span>
          </div>
        ))}
      </Card>
      <Card className="divide-y lg:col-span-2">
        {data?.results.map((r, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.score ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
            </div>
            {r.comment && <p className="mt-1.5 text-sm">{r.comment}</p>}
            <div className="mt-1 text-xs text-muted-foreground">{r.by ?? 'Mijoz'}{r.order?.number && ` · ${r.order.number}`}</div>
          </div>
        ))}
        {total > 10 && (
          <div className="flex items-center justify-between p-3 text-sm">
            <button className="text-primary disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Oldingi</button>
            <span className="text-muted-foreground">{page} / {Math.ceil(total / 10)}</span>
            <button className="text-primary disabled:opacity-40" disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((p) => p + 1)}>Keyingi →</button>
          </div>
        )}
      </Card>
    </div>
  );
}
