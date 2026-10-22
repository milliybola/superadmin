import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { OrderDetail } from '../api';
import { useOrderActions } from '../hooks';
import { ORDER_STATUSES, TERMINAL_STATUSES } from '../constants';

const REASON_STATUSES = ['CANCELLED', 'REJECTED'];

/** Admin holatni qo'lda o'zgartiradi: mijoz, hamkor va kuryerga odatdagidek bildirishnoma ketadi va tarixga yoziladi */
export function ChangeStatusDialog({ order, open, onOpenChange }: { order: OrderDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const { changeStatus } = useOrderActions(order.uuid);

  const terminal = TERMINAL_STATUSES.includes(order.status);
  const needsReason = REASON_STATUSES.includes(status);
  const options = Object.entries(ORDER_STATUSES).filter(([value]) => value !== order.status && value !== 'NEW');

  const submit = () =>
    changeStatus.mutate({ status, note: note.trim(), force: terminal }, {
      onSuccess: () => { setStatus(''); setNote(''); onOpenChange(false); },
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !changeStatus.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Holatni o'zgartirish</DialogTitle>
          <DialogDescription>{order.order_number} · hozir: {ORDER_STATUSES[order.status]?.label ?? order.status}</DialogDescription>
        </DialogHeader>

        {terminal && (
          <Alert variant="destructive">
            <AlertDescription>
              Buyurtma yakunlangan. Holatni o'zgartirish tarixda saqlanadi va mijozga yangi bildirishnoma yuboradi.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Yangi holat</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Holatni tanlang" /></SelectTrigger>
              <SelectContent>
                {options.map(([value, cfg]) => <SelectItem key={value} value={value}>{cfg.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-note">{needsReason ? 'Sabab' : 'Izoh'}{needsReason && <span className="text-destructive"> *</span>}</Label>
            <Textarea id="status-note" rows={3} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)}
              placeholder={needsReason ? 'Mijoz va hamkorga ko\'rsatiladi' : "Ixtiyoriy (tarixda ko'rinadi)"} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={changeStatus.isPending}>Bekor qilish</Button>
          <Button onClick={submit} disabled={!status || (needsReason && !note.trim()) || changeStatus.isPending}
            variant={needsReason ? 'destructive' : 'default'}>
            {changeStatus.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
