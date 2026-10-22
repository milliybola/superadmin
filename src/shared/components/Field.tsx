import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/** Belgi + kiritish maydoni + xato matni */
export function Field({ label, error, hint, required, className, children }: {
  label: string; error?: string; hint?: string; required?: boolean; className?: string; children: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Yoqish/o'chirish qatori (tavsif bilan) */
export function SwitchField({ label, description, checked, onChange, disabled }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
