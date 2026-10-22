import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  /** Sabab/izoh so'rash (bekor qilish kabi amallar uchun) */
  reason?: { label: string; required?: boolean; placeholder?: string };
  onConfirm: (reason: string) => Promise<unknown> | unknown;
}

/** Xavfli yoki qaytarib bo'lmas amallarni tasdiqlash. `onConfirm` xato bersa oyna ochiq qoladi. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Tasdiqlash', destructive, reason, onConfirm }: ConfirmDialogProps) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const missing = !!reason?.required && !text.trim();

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(text.trim());
      setText('');
      onOpenChange(false);
    } catch {
      /* xatoni chaqiruvchi (mutation) ko'rsatadi; oyna ochiq qoladi */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {reason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason">{reason.label}{reason.required && <span className="text-destructive"> *</span>}</Label>
            <Textarea id="confirm-reason" value={text} onChange={(e) => setText(e.target.value)} placeholder={reason.placeholder} rows={3} maxLength={300} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Bekor qilish</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={submit} disabled={busy || missing}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
