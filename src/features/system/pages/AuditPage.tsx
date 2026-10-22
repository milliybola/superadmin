import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { DateField, FilterBar, FilterSelect, SearchInput } from '@/shared/components/Filters';
import { InfoRow } from '@/shared/components/InfoRow';
import { Pill, type Tone } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDateTime } from '@/shared/lib/format';
import { auditHooks, type AuditEntry } from '../api';

const METHOD_TONE: Record<string, Tone> = { POST: 'success', PATCH: 'info', PUT: 'info', DELETE: 'danger' };
const METHOD_LABEL: Record<string, string> = { POST: 'Yaratish / amal', PATCH: "O'zgartirish", PUT: "O'zgartirish", DELETE: "O'chirish" };
const statusTone = (c: number): Tone => (c < 300 ? 'success' : c < 500 ? 'warning' : 'danger');

export default function AuditPage() {
  const { params, query, setFilter, setPage, setPageSize, reset, hasFilters } = useListParams();
  const { data, isLoading, isFetching, error, refetch } = auditHooks.useList(query);
  const [open, setOpen] = useState<AuditEntry | null>(null);
  const f = params.filters;

  const columns: Column<AuditEntry>[] = [
    { key: 'date', header: 'Vaqt', cell: (a) => <span className="whitespace-nowrap text-sm">{formatDateTime(a.created_at)}</span> },
    { key: 'admin', header: 'Administrator', cell: (a) => <span className="font-medium">{a.admin_name || '—'}</span> },
    { key: 'method', header: 'Amal', cell: (a) => <Pill tone={METHOD_TONE[a.method] ?? 'muted'}>{METHOD_LABEL[a.method] ?? a.method}</Pill> },
    { key: 'action', header: 'Bo\'lim', hideBelow: 'md', cell: (a) => <span className="font-mono text-xs text-muted-foreground">{a.action.replace('superadmin-', '')}</span> },
    { key: 'status', header: 'Natija', cell: (a) => <Pill tone={statusTone(a.status_code)}>{a.status_code}</Pill> },
    { key: 'ip', header: 'IP', hideBelow: 'xl', cell: (a) => <span className="text-xs text-muted-foreground">{a.ip_address ?? '—'}</span> },
  ];

  return (
    <>
      <PageHeader title="Audit jurnali" description="Paneldagi barcha o'zgartiruvchi amallar: kim, qachon, nimani qildi" />
      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Administrator, yo'l yoki ID..." className="w-[280px]" />
        <FilterSelect label="Amal" value={f.method ?? ''} onChange={(v) => setFilter('method', v)}
          options={Object.entries(METHOD_LABEL).map(([value, label]) => ({ value, label }))} />
        <DateField label="Dan" value={f.date_from ?? ''} onChange={(v) => setFilter('date_from', v)} />
        <DateField label="Gacha" value={f.date_to ?? ''} onChange={(v) => setFilter('date_to', v)} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(a) => String(a.id)} loading={isLoading || isFetching} error={error} onRetry={refetch}
        onRowClick={setOpen} page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Yozuvlar yo'q" />

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>Amal tafsiloti</SheetTitle><SheetDescription>{open && formatDateTime(open.created_at)}</SheetDescription></SheetHeader>
          {open && (
            <div className="space-y-4 px-4 pb-6 text-sm">
              <div className="divide-y divide-border/60">
                <InfoRow label="Administrator">{open.admin_name}</InfoRow>
                <InfoRow label="So'rov"><span className="font-mono text-xs">{open.method} {open.path}</span></InfoRow>
                <InfoRow label="Obyekt ID"><span className="font-mono text-xs">{open.object_uuid || '—'}</span></InfoRow>
                <InfoRow label="Natija">{open.status_code}</InfoRow>
                <InfoRow label="IP">{open.ip_address ?? '—'}</InfoRow>
              </div>
              <div>
                <div className="mb-1 font-medium">Yuborilgan ma'lumot</div>
                <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(open.payload, null, 2)}</pre>
                <p className="mt-1 text-xs text-muted-foreground">Parol va kalit kabi maydonlar yashirilgan.</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
