import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/** Rad etish: sabab majburiy (mijozga ko'rinadi) + mijozni bloklash tanlovi */
export function RejectDialog({ open, onOpenChange, orderNumber, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  onConfirm: (reason: string, block: boolean) => Promise<unknown>;
}) {
  const [reason, setReason] = useState('');
  const [block, setBlock] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim(), block);
      setReason('');
      setBlock(false);
      onOpenChange(false);
    } catch {
      /* xatoni mutation ko'rsatadi; oyna ochiq qoladi */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buyurtmani rad etish · {orderNumber}</DialogTitle>
          <DialogDescription>Buyurtma hamkorga yuborilmaydi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Sabab <span className="text-destructive">*</span></Label>
          <Textarea id="reject-reason" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Masalan: mijoz buyurtma bermaganini aytdi" />
          <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />Sabab mijozga ko'rinadi — odobli va aniq yozing.
          </p>
        </div>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4" checked={block} onChange={(e) => setBlock(e.target.checked)} />
          <span>
            <span className="font-medium">Mijozni bloklash</span><br />
            <span className="text-muted-foreground">Soxta buyurtma bo'lsa: mijoz keyin buyurtma bera olmaydi.</span>
          </span>
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Orqaga</Button>
          <Button variant="destructive" onClick={submit} disabled={busy || !reason.trim()}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Rad etish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
