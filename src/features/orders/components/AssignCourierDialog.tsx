import { useState } from 'react';
import { Check, Loader2, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pill } from '@/shared/components/Pill';
import { SearchInput } from '@/shared/components/Filters';
import { EmptyState } from '@/shared/components/State';
import { formatPhone } from '@/shared/lib/format';
import { cn } from '@/lib/utils';
import { COURIER_STATUSES } from '@/features/couriers/constants';
import { useCouriers } from '@/features/couriers/hooks';
import type { OrderDetail } from '../api';
import { useOrderActions } from '../hooks';

/** Kuryer biriktirish: faqat faol va bloklanmagan kuryerlar; "bo'sh" kuryerlar yuqorida */
export function AssignCourierDialog({ order, open, onOpenChange }: { order: OrderDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [search, setSearch] = useState('');
  const { assignCourier } = useOrderActions(order.uuid);
  const { data, isLoading } = useCouriers(
    { search, is_active: 'true', is_blocked: 'false', review_status: 'approved', ordering: 'status,-rating', page_size: 30 }, open);
  const available = [...(data?.results ?? [])].sort((a, b) => Number(b.status === 'available') - Number(a.status === 'available'));

  const assign = (uuid: string | null) =>
    assignCourier.mutate(uuid, { onSuccess: () => onOpenChange(false) });

  return (
    <Dialog open={open} onOpenChange={(o) => !assignCourier.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kuryer biriktirish</DialogTitle>
          <DialogDescription>
            {order.order_number}
            {order.status === 'SEARCHING_COURIER' || order.status === 'PENDING' ? " · biriktirilgach buyurtma «Qabul qilindi» holatiga o'tadi" : ''}
          </DialogDescription>
        </DialogHeader>

        <SearchInput value={search} onChange={setSearch} placeholder="Ism yoki telefon bo'yicha..." />

        <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
          {isLoading && <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}
          {!isLoading && available.length === 0 && <EmptyState title="Kuryer topilmadi" description="Qidiruvni o'zgartirib ko'ring." />}
          {available.map((c) => {
            const current = order.courier?.uuid === c.uuid;
            const st = COURIER_STATUSES[c.status];
            return (
              <button key={c.uuid} type="button" disabled={assignCourier.isPending || current} onClick={() => assign(c.uuid)}
                className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:cursor-default', current && 'border-primary bg-primary/5')}>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.full_name || c.phone}</div>
                  <div className="text-xs text-muted-foreground">{formatPhone(c.phone)} · {c.active_orders} ta faol buyurtma</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3.5 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span>
                <Pill tone={st?.tone ?? 'muted'}>{st?.label ?? c.status}</Pill>
                {current && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>

        {order.courier && (
          <Button variant="outline" className="text-destructive" disabled={assignCourier.isPending} onClick={() => assign(null)}>
            Kuryerni olib tashlash
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
