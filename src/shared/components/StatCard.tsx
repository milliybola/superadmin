import type { ElementType, ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: ElementType;
  label: string;
  value: ReactNode;
  loading?: boolean;
  /** Kecha/oldingi davrga nisbatan o'zgarish (foiz); null — hisoblab bo'lmaydi */
  delta?: number | null;
  /** O'zgarish teskari yaxshi bo'lsa (masalan bekor qilinganlar) true */
  invertDelta?: boolean;
  hint?: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const ICON_TONES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-500',
  warning: 'bg-amber-500/10 text-amber-500',
  danger: 'bg-red-500/10 text-red-500',
  info: 'bg-sky-500/10 text-sky-500',
};

export function StatCard({ icon: Icon, label, value, loading, delta, invertDelta, hint, tone = 'primary' }: StatCardProps) {
  const up = (delta ?? 0) > 0;
  const good = delta === 0 || delta === null || delta === undefined ? null : invertDelta ? !up : up;
  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-6">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl', ICON_TONES[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          {loading ? <Skeleton className="mt-1.5 h-7 w-24" /> : <div className="truncate text-2xl font-semibold tabular-nums">{value}</div>}
          {!loading && (delta !== undefined || hint) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {delta !== undefined && delta !== null && (
                <span className={cn('inline-flex items-center gap-0.5 font-medium', good === null ? '' : good ? 'text-emerald-500' : 'text-red-500')}>
                  {up ? <ArrowUpRight className="size-3.5" /> : delta < 0 ? <ArrowDownRight className="size-3.5" /> : null}
                  {Math.abs(delta).toFixed(delta % 1 === 0 ? 0 : 1)}%
                </span>
              )}
              {hint}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
