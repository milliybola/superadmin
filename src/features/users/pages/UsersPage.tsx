import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { DateField, FilterBar, FilterSelect, SearchInput } from '@/shared/components/Filters';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDate, formatMoney, formatNumber, formatPhone, timeAgo } from '@/shared/lib/format';
import { useUsers } from '../hooks';
import { ROLE_LABELS } from '../constants';
import { UserFlags } from '../components/UserFlags';
import type { AdminUser } from '../api';

export default function UsersPage() {
  const navigate = useNavigate();
  const { params, query, setFilter, setPage, setPageSize, setOrdering, reset, hasFilters } = useListParams({ ordering: '-date_joined' });
  const { data, isLoading, error, refetch, isFetching } = useUsers(query);
  const f = params.filters;

  const columns: Column<AdminUser>[] = [
    {
      key: 'name', header: 'Foydalanuvchi', sortKey: 'full_name',
      cell: (u) => (
        <div>
          <div className="max-w-[220px] truncate font-medium">{u.full_name || '—'}</div>
          <div className="text-xs text-muted-foreground">{formatPhone(u.phone_number)}</div>
        </div>
      ),
    },
    { key: 'role', header: 'Rol', hideBelow: 'md', cell: (u) => ROLE_LABELS[u.role] ?? u.role },
    { key: 'state', header: 'Holat', cell: (u) => <UserFlags u={u} /> },
    { key: 'orders', header: 'Buyurtmalar', sortKey: 'orders_count', align: 'right', cell: (u) => <span className="tabular-nums">{formatNumber(u.orders_count)}</span> },
    { key: 'spent', header: 'Xarid summasi', sortKey: 'total_spent', align: 'right', hideBelow: 'lg', cell: (u) => <span className="tabular-nums">{formatMoney(u.total_spent)}</span> },
    { key: 'last', header: 'Oxirgi buyurtma', sortKey: 'last_order_at', hideBelow: 'xl', cell: (u) => (u.last_order_at ? timeAgo(u.last_order_at) : '—') },
    { key: 'joined', header: "Qo'shilgan", sortKey: 'date_joined', hideBelow: 'lg', cell: (u) => formatDate(u.date_joined) },
  ];

  return (
    <>
      <PageHeader title="Foydalanuvchilar" description={isFetching ? 'Yangilanmoqda...' : 'Mijozlar va boshqa akkauntlar'} />

      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Ism, telefon yoki email..." className="w-[280px]" />
        <FilterSelect label="Rol" value={f.role ?? ''} onChange={(v) => setFilter('role', v)}
          options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} />
        <FilterSelect label="Blok" value={f.is_blocked ?? ''} onChange={(v) => setFilter('is_blocked', v)}
          options={[{ value: 'true', label: 'Bloklangan' }, { value: 'false', label: 'Bloklanmagan' }]} />
        <FilterSelect label="Buyurtmasi" value={f.has_orders ?? ''} onChange={(v) => setFilter('has_orders', v)}
          options={[{ value: 'true', label: 'Bor' }, { value: 'false', label: "Yo'q" }]} />
        <DateField label="Dan" value={f.date_from ?? ''} onChange={(v) => setFilter('date_from', v)} />
        <DateField label="Gacha" value={f.date_to ?? ''} onChange={(v) => setFilter('date_to', v)} />
      </FilterBar>

      <DataTable
        columns={columns} rows={data?.results} rowKey={(u) => u.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        onRowClick={(u) => navigate(`/users/${u.uuid}`)}
        ordering={params.ordering} onOrderingChange={setOrdering}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0}
        onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Foydalanuvchilar topilmadi"
      />
    </>
  );
}
