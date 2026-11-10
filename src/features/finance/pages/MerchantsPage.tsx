import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FilterBar, FilterSelect } from '@/shared/components/Filters';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { merchantHooks, type Merchant } from '../api';
import { MerchantDialog } from '../components/MerchantDialog';

export default function MerchantsPage() {
  const { params, query, setFilter, setPage, setPageSize, reset, hasFilters } = useListParams();
  const { data, isLoading, isFetching, error, refetch } = merchantHooks.useList(query);
  // null — yopiq; '' — yangi ulanish (hamkorni tanlash); uuid — tahrirlash
  const [edit, setEdit] = useState<string | null>(null);
  const f = params.filters;

  const columns: Column<Merchant>[] = [
    { key: 'partner', header: 'Hamkor', cell: (m) => (
      <div><Link className="font-medium hover:underline" to={`/partners/${m.partner.uuid}`} onClick={(e) => e.stopPropagation()}>{m.partner.name}</Link>
        <div className="text-xs text-muted-foreground">{m.legal_name || 'Yuridik nomi kiritilmagan'}</div></div>) },
    { key: 'tin', header: 'STIR / JShShIR', hideBelow: 'md', cell: (m) => <span className="font-mono text-sm">{m.tin || m.pinfl || '—'}</span> },
    { key: 'payme', header: 'Payme', cell: (m) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={m.is_payme_ready ? 'success' : m.is_payme_enabled ? 'warning' : 'muted'}>
          {m.is_payme_ready ? 'Ishlaydi' : m.is_payme_enabled ? "To'liq emas" : "O'chiq"}</Pill>
        {m.is_payme_enabled && m.payme_test_mode && <Pill tone="warning">Test rejim</Pill>}
        {!m.payme_key_set && m.is_payme_enabled && <Pill tone="danger">Kalit yo'q</Pill>}
      </div>) },
    { key: 'click', header: 'Click', cell: (m) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={m.is_click_ready ? 'success' : m.is_click_enabled ? 'warning' : 'muted'}>
          {m.is_click_ready ? 'Ishlaydi' : m.is_click_enabled ? "To'liq emas" : "O'chiq"}</Pill>
        {m.is_click_enabled && m.click_service_id && <span className="text-xs text-muted-foreground">service {m.click_service_id}</span>}
      </div>) },
    { key: 'actions', header: '', align: 'right', cell: (m) => (
      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEdit(m.partner.uuid); }}><Pencil className="mr-1 size-3.5" />Tahrirlash</Button>) },
  ];

  return (
    <>
      <PageHeader title="To'lov ulanishlari" description="Hamkorlarning Payme va Click sozlamalari, STIR va QQS. Kalitlar faqat yoziladi — qayta ko'rsatilmaydi."
        actions={<Button onClick={() => setEdit('')}><Plus className="mr-2 size-4" />Ulanish qo'shish</Button>} />
      <FilterBar active={hasFilters} onReset={reset}>
        <FilterSelect label="Payme" value={f.is_payme_enabled ?? ''} onChange={(v) => setFilter('is_payme_enabled', v)}
          options={[{ value: 'true', label: 'Yoqilgan' }, { value: 'false', label: "O'chiq" }]} />
        <FilterSelect label="Click" value={f.is_click_enabled ?? ''} onChange={(v) => setFilter('is_click_enabled', v)}
          options={[{ value: 'true', label: 'Yoqilgan' }, { value: 'false', label: "O'chiq" }]} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(m) => m.partner.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        onRowClick={(m) => setEdit(m.partner.uuid)}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Ulanishlar yo'q" emptyDescription="«Ulanish qo'shish» orqali hamkorni Payme yoki Click'ga ulang." />
      {edit !== null && <MerchantDialog partnerUuid={edit || null} onClose={() => setEdit(null)} />}
    </>
  );
}
