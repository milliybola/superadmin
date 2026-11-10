import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, CreditCard, RefreshCw, RotateCcw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
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
  const qc = useQueryClient();
  const [resolveRow, setResolveRow] = useState<PaymentRow | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['payments'] });
  const retry = useMutation({
    mutationFn: (uuid: string) => financeApi.retryClick(uuid),
    onSuccess: () => { toast.success("Qayta urinish boshlandi. Natija bir necha daqiqada ko'rinadi."); refresh(); },
  });
  const resolve = useMutation({
    mutationFn: ({ uuid, note }: { uuid: string; note: string }) => financeApi.resolveClick(uuid, note),
    onSuccess: () => { toast.success('Hal qilindi deb belgilandi'); refresh(); },
  });

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
          {r.reversal_status === 'REQUIRED' && <Pill tone="warning">Qaytarilmoqda</Pill>}
          {r.reversal_status === 'FAILED' && <Pill tone="danger">Qaytarilmadi</Pill>}
          {r.fiscal_status === 'FAILED' && <Pill tone="danger">Fiskal xato</Pill>}
          {r.problem?.resolved && <Pill tone="success">Hal qilindi</Pill>}
        </div>);
    } },
    { key: 'problem', header: 'Muammo', hideBelow: 'lg', cell: (r) => {
      const p = r.problem;
      if (!p) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="max-w-[260px] text-xs">
          {p.fiscal_error && <div className="text-destructive">{p.fiscal_error}</div>}
          {p.reversal === 'FAILED' && <div className="text-destructive">Pul avtomatik qaytarilmadi — Click kabinetidan qo'lda qaytaring yoki qayta urining.</div>}
          {p.resolved && (
            <div className="mt-1 text-muted-foreground">{p.resolved.by} · {formatDateTime(p.resolved.at)}{p.resolved.note && `: ${p.resolved.note}`}</div>
          )}
        </div>);
    } },
    { key: 'actions', header: '', align: 'right', cell: (r) => {
      const p = r.problem;
      if (!p || p.resolved) return null;
      return (
        <div className="flex justify-end gap-1.5">
          {p.can_retry && <Button size="sm" variant="outline" disabled={retry.isPending} onClick={() => retry.mutate(r.id)}>
            <RefreshCw className="mr-1 size-3.5" />Qayta urinish</Button>}
          <Button size="sm" variant="outline" onClick={() => setResolveRow(r)}><CheckCircle2 className="mr-1 size-3.5" />Hal qilindi</Button>
        </div>);
    } },
    { key: 'ext', header: 'Tranzaksiya ID', hideBelow: 'xl', cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.external_id}</span> },
    { key: 'amount', header: 'Summa', align: 'right', cell: (r) => <span className="font-medium tabular-nums">{formatMoney(r.amount)}</span> },
  ];

  // Ochiq (hal qilinmagan) muammolar — sana oralig'idan qat'i nazar
  const problems = s?.click.open_problems ?? 0;

  return (
    <>
      <PageHeader title="To'lovlar" description={`Payme va Click tranzaksiyalari · ${range.date_from} — ${range.date_to}`} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} tone="info" label="Payme (to'langan)" value={formatMoney(s?.payme.paid_total)} loading={!s} hint={`${formatNumber(s?.payme.paid_count)} ta`} />
        <StatCard icon={CreditCard} label="Click (to'langan)" value={formatMoney(s?.click.paid_total)} loading={!s} hint={`${formatNumber(s?.click.paid_count)} ta`} />
        <StatCard icon={RotateCcw} tone="warning" label="Qaytarilgan" value={formatNumber((s?.payme.refunded_count ?? 0) + (s?.click.refunded_count ?? 0))} loading={!s} />
        <StatCard icon={AlertTriangle} tone={problems ? 'danger' : 'success'} label="Muammoli" value={formatNumber(problems)} loading={!s}
          hint={problems ? "Qaytarish yoki fiskal xato — «Muammolar» bo'limida" : 'Hammasi joyida'} />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <ChipTabs value={f.provider ?? ''} onChange={(v) => setFilter('provider', v)}
          items={[{ value: '', label: 'Hammasi' }, { value: 'payme', label: 'Payme' }, { value: 'click', label: 'Click' }]} />
        <ChipTabs value={f.problem ?? ''} onChange={(v) => setFilter('problem', v)}
          items={[{ value: '', label: 'Barcha to\'lovlar' }, { value: 'open', label: 'Muammolar', count: problems },
            { value: 'resolved', label: 'Hal qilinganlar' }]} />
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
      <ConfirmDialog open={!!resolveRow} onOpenChange={() => setResolveRow(null)} confirmLabel="Hal qilindi" title="Muammo hal qilindi"
        description={`${resolveRow?.order.number ?? 'Buyurtma'} · ${formatMoney(resolveRow?.amount)}. Kim va qachon belgilagani audit jurnalida saqlanadi.`}
        reason={{ label: 'Nima qilindi', required: true, placeholder: "Masalan: pul Click kabinetidan qo'lda qaytarildi" }}
        onConfirm={(note) => resolve.mutateAsync({ uuid: resolveRow!.id, note })} />
    </>
  );
}
