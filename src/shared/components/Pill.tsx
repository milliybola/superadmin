import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'muted';

const TONES: Record<Tone, string> = {
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/25',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-red-500/25',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-sky-500/25',
  primary: 'bg-primary/15 text-primary ring-primary/25',
  muted: 'bg-muted text-muted-foreground ring-border',
};

/** Holat belgisi (status, rol, ha/yo'q): rangi ma'nosini bildiradi */
export function Pill({ tone = 'muted', children, className, dot }: {
  tone?: Tone; children: ReactNode; className?: string; dot?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
