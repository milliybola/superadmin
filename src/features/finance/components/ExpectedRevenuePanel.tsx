import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BadgeDollarSign, Download, Receipt, Store, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ENDPOINTS } from '@/core/config/constants';
import { downloadFile } from '@/shared/api/resource';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { StatCard } from '@/shared/components/StatCard';
import { getErrorMessage } from '@/shared/lib/errors';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { financeApi, type ExpectedRevenueRow } from '../api';

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Q31: MilliyGo kutilayotgan daromadi hamkor kesimida — tarif oylik to'lovi + kvotadan ortgan buyurtma haqi */
export function ExpectedRevenuePanel() {
  const [month, setMonth] = useState(thisMonth());
  const [exporting, setExporting] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'expected-revenue', month], queryFn: () => financeApi.expectedRevenue({ month }) });
  const t = data?.totals;

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadFile(`${ENDPOINTS.ADMIN.REPORTS}expected-revenue/`, { month, export: 'csv' }, `kutilayotgan_daromad_${month}.csv`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<ExpectedRevenueRow>[] = [
    { key: 'name', header: 'Hamkor', cell: (r) => (
      <div><Link className="font-medium hover:underline" to={`/partners/${r.uuid}`}>{r.name}</Link>
        <div className="text-xs text-muted-foreground">{r.tariff.name}</div></div>) },
    { key: 'subscription', header: "Oylik to'lov", align: 'right', cell: (r) => <span className="tabular-nums">{formatMoney(r.subscription)}</span> },
    { key: 'orders', header: 'Ilova buyurtmalari', align: 'right', hideBelow: 'md', cell: (r) => (
      <span className="tabular-nums">{formatNumber(r.orders)}{r.free_orders != null && <span className="text-muted-foreground"> / {formatNumber(r.free_orders)} bepul</span>}</span>) },
    { key: 'over', header: 'Kvotadan ortgan', align: 'right', hideBelow: 'md', cell: (r) => (
      <span className="tabular-nums">{r.orders_over ? `${formatNumber(r.orders_over)} × ${formatMoney(r.extra_order_fee)}` : '—'}</span>) },
    { key: 'overage', header: "Ortiqcha to'lov", align: 'right', hideBelow: 'lg', cell: (r) => <span className="tabular-nums">{formatMoney(r.overage_fee)}</span> },
    { key: 'total', header: 'Jami', align: 'right', cell: (r) => <span className="font-semibold tabular-nums">{formatMoney(r.total)}</span> },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Oy</span>
          <Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="w-[180px]" />
        </label>
        <Button disabled={exporting || !data?.rows.length} onClick={exportCsv}><Download className="mr-2 size-4" />Daromad (CSV)</Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{data?.note ?? "Komissiya olinmaydi (tarif modeli)."} Hisob: tarif oylik to'lovi + kvotadan ortgan har ilova buyurtmasi uchun tarifdagi narx.</p>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} tone="success" label="Kutilayotgan daromad" value={formatMoney(t?.total)} loading={isLoading} />
        <StatCard icon={BadgeDollarSign} label="Tarif to'lovlari" value={formatMoney(t?.subscriptions)} loading={isLoading} />
        <StatCard icon={Receipt} tone="warning" label="Kvotadan ortgan" value={formatMoney(t?.overage_fees)} loading={isLoading}
          hint={`${formatNumber(t?.orders_over)} ta buyurtma`} />
        <StatCard icon={Store} tone="info" label="To'lovchi hamkorlar" value={`${formatNumber(t?.paying_partners)} / ${formatNumber(t?.partners)}`} loading={isLoading} />
      </div>
      <DataTable columns={columns} rows={data?.rows} rowKey={(r) => r.uuid} loading={isLoading} page={1} pageSize={1000} total={data?.rows.length ?? 0}
        onPageChange={() => undefined} emptyTitle="Faol hamkor yo'q" />
    </>
  );
}
