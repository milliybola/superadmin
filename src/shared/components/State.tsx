import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </div>
      <div className="font-medium">{title}</div>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="font-medium">Ma'lumotni yuklab bo'lmadi</div>
      <p className="max-w-sm text-sm text-muted-foreground">{message || "Internetni tekshirib, qayta urinib ko'ring."}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Qayta urinish</Button>}
    </div>
  );
}
