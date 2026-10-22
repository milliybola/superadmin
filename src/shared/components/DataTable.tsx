import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatNumber } from '../lib/format';
import { EmptyState, ErrorState } from './State';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Server tartiblash kaliti (`?ordering=<sortKey>` / `-<sortKey>`) */
  sortKey?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  /** Tor ekranlarda yashirish */
  hideBelow?: 'md' | 'lg' | 'xl';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  ordering?: string;
  onOrderingChange?: (ordering: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

const HIDE = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' } as const;
const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;
const PAGE_SIZES = [10, 20, 50, 100];

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  if (!active) return <ArrowUpDown className="size-3.5 opacity-40" />;
  return desc ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />;
}

/** Server tomonlama sahifalash va tartiblash bilan jadval (ro'yxat sahifalarining umumiy asosi) */
export function DataTable<T>({
  columns, rows, rowKey, loading, error, onRetry, onRowClick, ordering, onOrderingChange,
  page, pageSize, total, onPageChange, onPageSizeChange, emptyTitle = "Ma'lumot topilmadi", emptyDescription, emptyAction,
}: DataTableProps<T>) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const toggleSort = (key: string) => {
    if (!onOrderingChange) return;
    onOrderingChange(ordering === key ? `-${key}` : ordering === `-${key}` ? '' : key);
  };

  const colClass = (c: Column<T>) => cn(c.align && ALIGN[c.align], c.hideBelow && HIDE[c.hideBelow], c.className);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((c) => {
                const active = ordering === c.sortKey || ordering === `-${c.sortKey}`;
                return (
                  <TableHead key={c.key} className={cn('whitespace-nowrap', colClass(c))}>
                    {c.sortKey ? (
                      <button type="button" onClick={() => toggleSort(c.sortKey!)}
                        className={cn('inline-flex items-center gap-1 font-medium hover:text-foreground', active && 'text-foreground', c.align === 'right' && 'flex-row-reverse')}>
                        {c.header}
                        <SortIcon active={active} desc={ordering === `-${c.sortKey}`} />
                      </button>
                    ) : c.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !rows
              ? Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {columns.map((c) => (
                      <TableCell key={c.key} className={colClass(c)}><Skeleton className="h-5 w-full max-w-[140px]" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : rows?.map((row) => (
                  <TableRow key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && 'cursor-pointer', loading && 'opacity-60')}>
                    {columns.map((c) => <TableCell key={c.key} className={colClass(c)}>{c.cell(row)}</TableCell>)}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {!!error && !rows && <ErrorState onRetry={onRetry} />}
      {!error && rows && rows.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
        <div className="text-muted-foreground">
          {total > 0 ? <>{formatNumber(from)}–{formatNumber(to)} / <span className="font-medium text-foreground">{formatNumber(total)}</span></> : '0 ta'}
        </div>
        <div className="flex items-center gap-3">
          {onPageSizeChange && (
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>{PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s} ta / sahifa</SelectItem>)}</SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Oldingi sahifa">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[64px] text-center tabular-nums text-muted-foreground">{page} / {pages}</span>
            <Button variant="outline" size="icon" className="size-8" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="Keyingi sahifa">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
