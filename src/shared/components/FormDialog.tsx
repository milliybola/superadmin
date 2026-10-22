import type { FormEventHandler, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Forma oynasi: sarlavha, scroll bo'ladigan tana va "Bekor qilish / Saqlash" tugmalari */
export function FormDialog({ open, onOpenChange, title, description, onSubmit, submitting, submitLabel = 'Saqlash', wide, children }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string;
  onSubmit: FormEventHandler<HTMLFormElement>; submitting?: boolean; submitLabel?: string; wide?: boolean; children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className={cn('max-h-[90vh] gap-0 p-0 sm:max-w-lg', wide && 'sm:max-w-2xl')}>
        <form onSubmit={onSubmit} className="flex max-h-[90vh] flex-col">
          <DialogHeader className="px-6 pb-3 pt-6">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-3">{children}</div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Bekor qilish</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}{submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
