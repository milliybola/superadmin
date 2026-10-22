import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** "Belgi — qiymat" qatori (tafsilot kartalari uchun) */
export function InfoRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2 text-sm', className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-medium">{children ?? '—'}</span>
    </div>
  );
}

/** Sarlavhali karta bo'limi */
export function Section({ title, action, children, className, contentClassName }: {
  title: ReactNode; action?: ReactNode; children: ReactNode; className?: string; contentClassName?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className={cn('divide-y divide-border/60', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
