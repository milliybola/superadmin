import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, Download, Percent, ShoppingBag, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ENDPOINTS } from '@/core/config/constants';
import { downloadFile } from '@/shared/api/resource';
import { PageHeader } from '@/shared/components/PageHeader';
import { ChipTabs, DateField, FilterBar } from '@/shared/components/Filters';
import { StatCard } from '@/shared/components/StatCard';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { useListParams } from '@/shared/hooks/useListParams';
import { getErrorMessage } from '@/shared/lib/errors';
import { formatCompact, formatMoney, formatNumber, toInputDate } from '@/shared/lib/format';
import { financeApi, type ReportRow } from '../api';

const daysAgo = (n: number) => toInputDate(new Date(Date.now() - n * 86_400_000));
const PRESETS = [{ label: 'Bugun', days: 0 }, { label: '7 kun', days: 6 }, { label: '30 kun', days: 29 }, { label: '90 kun', days: 89 }];

export default function ReportsPage() {
  const { params, setFilter, update } = useListParams();
  const f = params.filters;
  const group = f.group === 'partner' ? 'partner' : 'day';
  const range = useMemo(() => ({ date_from: f.date_from || daysAgo(29), date_to: f.date_to || toInputDate(new Date()) }), [f.date_from, f.date_to]);
  const [exporting, setExporting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['reports', 'revenue', group, range], queryFn: () => financeApi.revenue({ group, ...range }) });

  const exportCsv = async (kind: 'report' | 'orders') => {
    setExporting(kind);
    try {
      if (kind === 'report') await downloadFile(`${ENDPOINTS.ADMIN.REPORTS}revenue/`, { group, ...range, export: 'csv' }, 'tushum.csv');
      else await downloadFile(`${ENDPOINTS.ADMIN.REPORTS}orders-export/`, { ...range, status: 'DELIVERED' }, 'buyurtmalar.csv');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(null);
    }
  };

  const columns: Column<ReportRow>[] = [
    { key: 'label', header: group === 'partner' ? 'Hamkor' : 'Sana', cell: (r) => <span className="font-medium">{r.label}</span> },
    { key: 'orders', header: 'Buyurtmalar', align: 'right', cell: (r) => <span className="tabular-nums">{formatNumber(r.orders)}</span> },
    { key: 'items', header: 'Mahsulotlar', align: 'right', hideBelow: 'md', cell: (r) => <span className="tabular-nums">{formatMoney(r.items)}</span> },
    { key: 'delivery', header: 'Yetkazish', align: 'right', hideBelow: 'lg', cell: (r) => <span className="tabular-nums">{formatMoney(r.delivery_fees)}</span> },
    ...(group === 'partner' ? [{ key: 'commission', header: 'Komissiya', align: 'right' as const, cell: (r: ReportRow) => <span className="tabular-nums">{formatMoney(r.commission)}</span> }] : []),
    { key: 'total', header: 'Jami', align: 'right', cell: (r) => <span className="font-semibold tabular-nums">{formatMoney(r.total)}</span> },
  ];

  const t = data?.totals;
  return (
    <>
      <PageHeader title="Hisobotlar" description="Yetkazilgan buyurtmalar bo'yicha tushum. Komissiya — hamkorning hozirgi tarifi bo'yicha taxminiy hisob."
        actions={<>
          <Button variant="outline" disabled={!!exporting} onClick={() => exportCsv('orders')}><Download className="mr-2 size-4" />Buyurtmalar (CSV)</Button>
          <Button disabled={!!exporting || !data?.rows.length} onClick={() => exportCsv('report')}><Download className="mr-2 size-4" />Hisobot (CSV)</Button>
        </>} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ChipTabs value={group} onChange={(v) => setFilter('group', v)} items={[{ value: 'day', label: 'Kunlar bo\'yicha' }, { value: 'partner', label: 'Hamkorlar bo\'yicha' }]} />
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p.label} variant="outline" size="sm" onClick={() => update({ date_from: daysAgo(p.days), date_to: toInputDate(new Date()) })}>{p.label}</Button>
          ))}
        </div>
      </div>
      <FilterBar>
        <DateField label="Dan" value={range.date_from} onChange={(v) => setFilter('date_from', v)} />
        <DateField label="Gacha" value={range.date_to} onChange={(v) => setFilter('date_to', v)} />
      </FilterBar>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Buyurtmalar" value={formatNumber(t?.orders)} loading={isLoading} />
        <StatCard icon={Banknote} tone="success" label="Jami tushum" value={formatMoney(t?.total)} loading={isLoading} />
        <StatCard icon={Truck} tone="info" label="Yetkazish haqi" value={formatMoney(t?.delivery_fees)} loading={isLoading} />
        <StatCard icon={Percent} tone="warning" label={group === 'partner' ? 'Komissiya (taxminiy)' : 'Mahsulotlar'} loading={isLoading}
          value={formatMoney(group === 'partner' ? t?.commission : t?.items)} />
      </div>

      {group === 'day' && (
        <Card className="mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-base">Kunlik tushum</CardTitle><CardDescription>Yetkazib berilgan buyurtmalar</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-60" /> : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.rows ?? []} margin={{ left: 0, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={formatCompact} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: 'hsl(var(--accent))' }} formatter={(v) => [formatMoney(Number(v)), 'Tushum']} />
                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns} rows={data?.rows} rowKey={(r) => r.key} loading={isLoading} page={1} pageSize={1000} total={data?.rows.length ?? 0}
        onPageChange={() => undefined} emptyTitle="Bu davrda yetkazilgan buyurtma yo'q" />
    </>
  );
}
