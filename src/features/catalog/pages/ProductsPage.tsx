import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, EyeOff, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ChipTabs, FilterBar, FilterSelect, SearchInput } from '@/shared/components/Filters';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { InfoRow } from '@/shared/components/InfoRow';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { PARTNER_TYPE_LABELS } from '@/features/partners/constants';
import { getProductsMeta, PRODUCT_STATUS, productHooks, type ProductListItem } from '../api';

function ProductThumb({ src }: { src: string | null }) {
  return src ? <img src={src} alt="" className="size-10 shrink-0 rounded-lg object-cover" /> : <div className="size-10 shrink-0 rounded-lg bg-muted" />;
}

function StatusPill({ p }: { p: ProductListItem }) {
  const s = PRODUCT_STATUS[p.status];
  return (
    <div className="flex flex-wrap gap-1">
      <Pill tone={s?.tone ?? 'muted'}>{s?.label ?? p.status}</Pill>
      {p.status === 'ACTIVE' && !p.is_active && <Pill tone="muted">Yashirilgan</Pill>}
      {p.status === 'ACTIVE' && p.is_active && !p.is_available && <Pill tone="warning">Tugagan</Pill>}
    </div>
  );
}

function ProductSheet({ uuid, onClose }: { uuid: string; onClose: () => void }) {
  const { data: p, isLoading } = productHooks.useDetail(uuid);
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{p?.name ?? 'Mahsulot'}</SheetTitle>
          <SheetDescription>{p?.partner?.name}</SheetDescription>
        </SheetHeader>
        {isLoading || !p ? <Skeleton className="mt-6 h-64" /> : (
          <div className="mt-4 space-y-5 px-4 pb-6 text-sm">
            {p.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {p.images.map((i, idx) => <img key={idx} src={i.url} alt="" className="size-24 shrink-0 rounded-lg object-cover" />)}
              </div>
            )}
            {p.description && <p className="text-muted-foreground">{p.description}</p>}
            <div className="divide-y divide-border/60">
              <InfoRow label="Narx">{formatMoney(p.price)}{p.unit === 'KG' ? ' / kg' : ''}</InfoRow>
              {p.sale_price != null && <InfoRow label="Aksiya narxi">{formatMoney(p.sale_price)}</InfoRow>}
              {p.discount > 0 && <InfoRow label="Chegirma">{p.discount}%</InfoRow>}
              <InfoRow label="Kategoriya">{p.category ?? '—'}</InfoRow>
              <InfoRow label="Turi">{p.kind === 'SET' ? 'Set (kombo)' : 'Oddiy'}</InfoRow>
              {p.brand && <InfoRow label="Brend">{p.brand}</InfoRow>}
              {p.barcode && <InfoRow label="Shtrix-kod">{p.barcode}</InfoRow>}
              {p.unit === 'KG' && <InfoRow label="Qadam / minimum">{p.step} / {p.min_quantity} kg</InfoRow>}
            </div>
            {p.packagings.length > 0 && (
              <div><div className="mb-1 font-medium">Qadoqlar</div>
                {p.packagings.map((x, i) => <div key={i} className="flex justify-between py-1 text-muted-foreground"><span>{x.name} (×{x.multiplier})</span><span>{formatMoney(x.price)}</span></div>)}</div>
            )}
            {p.option_groups.length > 0 && (
              <div><div className="mb-1 font-medium">Variantlar</div>
                {p.option_groups.map((g, i) => (
                  <div key={i} className="py-1"><div className="text-muted-foreground">{g.name} ({g.min_select}–{g.max_select})</div>
                    <div className="flex flex-wrap gap-1 pt-1">{g.options.map((o, j) => <Pill key={j}>{o.name}{o.price_delta ? ` +${formatNumber(o.price_delta)}` : ''}</Pill>)}</div></div>
                ))}</div>
            )}
            {p.set_items.length > 0 && (
              <div><div className="mb-1 font-medium">Set tarkibi</div>
                {p.set_items.map((s, i) => <div key={i} className="text-muted-foreground">{s.quantity} × {s.product}</div>)}</div>
            )}
            {p.stock.length > 0 && (
              <div><div className="mb-1 font-medium">Filiallardagi qoldiq</div>
                {p.stock.map((s, i) => (
                  <div key={i} className="flex justify-between py-1 text-muted-foreground"><span>{s.filial}</span>
                    <span>{s.is_available ? `${s.quantity} · ${formatMoney(s.price)}` : 'Tugagan'}</span></div>
                ))}</div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function ProductsPage() {
  const { params, query, setFilter, setPage, setPageSize, setOrdering, reset, hasFilters } = useListParams({ ordering: '-created_at' });
  const { data, isLoading, isFetching, error, refetch } = productHooks.useList(query);
  const { data: meta } = useQuery({ queryKey: ['products', 'meta'], queryFn: getProductsMeta });
  const { act } = productHooks.useMutations();
  const [open, setOpen] = useState<string | null>(null);
  const [reject, setReject] = useState<ProductListItem | null>(null);
  const f = params.filters;
  const run = (p: ProductListItem, name: string, message: string) => act.mutate({ id: p.uuid, name, message });

  const columns: Column<ProductListItem>[] = [
    { key: 'name', header: 'Mahsulot', sortKey: 'name', cell: (p) => (
      <div className="flex items-center gap-3"><ProductThumb src={p.image} />
        <div className="min-w-0"><div className="max-w-[240px] truncate font-medium">{p.name}</div>
          <div className="max-w-[240px] truncate text-xs text-muted-foreground">{p.category ?? '—'}{p.brand && ` · ${p.brand}`}</div></div></div>) },
    { key: 'partner', header: 'Hamkor', hideBelow: 'md', cell: (p) => (
      <div><div className="max-w-[180px] truncate">{p.partner?.name ?? '—'}</div>
        <div className="text-xs text-muted-foreground">{p.partner ? PARTNER_TYPE_LABELS[p.partner.type] : ''}</div></div>) },
    { key: 'price', header: 'Narx', sortKey: 'price', align: 'right', cell: (p) => (
      <div className="tabular-nums"><div>{formatMoney(p.sale_price ?? p.price)}</div>
        {(p.sale_price != null || p.discount > 0) && <div className="text-xs text-muted-foreground line-through">{formatMoney(p.price)}</div>}</div>) },
    { key: 'status', header: 'Holat', cell: (p) => <StatusPill p={p} /> },
    { key: 'actions', header: '', align: 'right', cell: (p) => (
      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {p.status === 'PENDING' && <>
          <Button size="sm" disabled={act.isPending} onClick={() => run(p, 'approve', 'Mahsulot tasdiqlandi')}><Check className="mr-1 size-4" />Tasdiqlash</Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setReject(p)}><X className="mr-1 size-4" />Rad etish</Button></>}
        {p.status === 'ACTIVE' && (p.is_active
          ? <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => run(p, 'hide', 'Mahsulot yashirildi')}><EyeOff className="mr-1 size-4" />Yashirish</Button>
          : <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => run(p, 'show', 'Mahsulot ko\'rsatildi')}><Eye className="mr-1 size-4" />Ko'rsatish</Button>)}
        {p.status === 'DELETED' && <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => run(p, 'approve', 'Mahsulot qayta tiklandi')}>Tiklash</Button>}
      </div>) },
  ];

  const tabs = [
    { value: '', label: 'Hammasi' },
    { value: 'PENDING', label: 'Tekshiruvda', count: meta?.status_counts.PENDING ?? 0 },
    { value: 'ACTIVE', label: 'Tasdiqlangan', count: meta?.status_counts.ACTIVE },
    { value: 'DELETED', label: 'Rad etilgan', count: meta?.status_counts.DELETED },
  ];

  return (
    <>
      <PageHeader title="Mahsulotlar" description="Hamkorlar qo'shgan mahsulotlarni tekshirish va moderatsiya qilish" />
      <div className="mb-4"><ChipTabs value={f.status ?? ''} onChange={(v) => setFilter('status', v)} items={tabs} /></div>
      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Nom, brend, shtrix-kod, hamkor..." className="w-[300px]" />
        <FilterSelect label="Hamkor turi" value={f.partner_type ?? ''} onChange={(v) => setFilter('partner_type', v)}
          options={[{ value: 'RESTAURANT', label: 'Restoran' }, { value: 'SHOP', label: "Do'kon" }]} />
        <FilterSelect label="Ko'rinish" value={f.is_active ?? ''} onChange={(v) => setFilter('is_active', v)}
          options={[{ value: 'true', label: "Ko'rinadi" }, { value: 'false', label: 'Yashirin' }]} />
        <FilterSelect label="Qoldiq" value={f.is_available ?? ''} onChange={(v) => setFilter('is_available', v)}
          options={[{ value: 'true', label: 'Mavjud' }, { value: 'false', label: 'Tugagan' }]} />
        <FilterSelect label="Turi" value={f.kind ?? ''} onChange={(v) => setFilter('kind', v)}
          options={[{ value: 'SINGLE', label: 'Oddiy' }, { value: 'SET', label: 'Set' }]} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(p) => p.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        onRowClick={(p) => setOpen(p.uuid)} ordering={params.ordering} onOrderingChange={setOrdering}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Mahsulotlar topilmadi" />
      {open && <ProductSheet uuid={open} onClose={() => setOpen(null)} />}
      <ConfirmDialog open={!!reject} onOpenChange={() => setReject(null)} destructive confirmLabel="Rad etish" title="Mahsulotni rad etish"
        description={`«${reject?.name}» mijozlarga ko'rinmaydi. Keyin «Tiklash» orqali qaytarish mumkin.`}
        onConfirm={() => act.mutateAsync({ id: reject!.uuid, name: 'reject', message: 'Mahsulot rad etildi' })} />
    </>
  );
}
