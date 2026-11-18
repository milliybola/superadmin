import { useEffect, useState } from 'react';
import { PhoneOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/shared/components/PageHeader';
import { ChipTabs } from '@/shared/components/Filters';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState, ErrorState } from '@/shared/components/State';
import { getErrorMessage } from '@/shared/lib/errors';
import { useToggleVerification, useVerificationQueue, useVerificationSettings } from '../hooks';
import { VerificationCard } from '../components/VerificationCard';

/** Har soniyada yangilanuvchi "hozir" (ms) — kutish taymerlari uchun; tab yashirin bo'lsa to'xtaydi */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => {
      if (!document.hidden) setNow(Date.now());
    };
    const id = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return now;
}

export default function VerificationQueuePage() {
  const [scope, setScope] = useState<'pending' | 'history'>('pending');
  const [confirmOff, setConfirmOff] = useState(false);
  const pending = useVerificationQueue('pending');
  const q = useVerificationQueue(scope);
  const settings = useVerificationSettings();
  const toggle = useToggleVerification();
  const now = useNow();

  const enabled = settings.data?.enabled ?? true;
  const pendingCount = pending.data?.length ?? 0;

  return (
    <div>
      <PageHeader
        title="Tasdiqlash navbati"
        description="Yangi mijozlarning birinchi buyurtmalari: mijozga qo'ng'iroq qilib tasdiqlang yoki rad eting. Tasdiqlanmaguncha hamkorga yuborilmaydi."
        actions={
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2">
              <Switch
                checked={enabled}
                disabled={settings.isLoading || toggle.isPending}
                onCheckedChange={(v) => (v ? toggle.mutate(true) : setConfirmOff(true))}
              />
              <span className="text-sm text-muted-foreground">{enabled ? 'Yoqilgan' : "O'chirilgan"}</span>
            </label>
            <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
              <RefreshCw className={`mr-2 size-4 ${q.isFetching ? 'animate-spin' : ''}`} />Yangilash
            </Button>
          </div>
        }
      />

      {!settings.isLoading && !enabled && (
        <Alert className="mb-4">
          <PhoneOff className="size-4" />
          <AlertTitle>Tasdiqlash navbati o'chirilgan</AlertTitle>
          <AlertDescription>
            Yangi mijozlarning buyurtmalari operator qo'ng'irog'isiz, to'g'ridan-to'g'ri hamkorga boradi.
            Bloklangan mijozlar baribir buyurtma bera olmaydi.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <ChipTabs
          value={scope}
          onChange={(v) => setScope(v as 'pending' | 'history')}
          items={[
            { value: 'pending', label: 'Navbat', count: pendingCount },
            { value: 'history', label: 'Tarix' },
          ]}
        />
      </div>

      {q.isLoading ? (
        <div className="space-y-4"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      ) : q.isError ? (
        <ErrorState message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState
          title={scope === 'pending' ? "Navbat bo'sh" : "Tarix bo'sh"}
          description={
            scope === 'pending'
              ? enabled
                ? 'Tasdiqlanishi kerak bo\'lgan buyurtma yo\'q. Yangisi kelsa signal beriladi.'
                : "Navbat o'chirilgan — yangi buyurtmalar bu yerda to'planmaydi."
              : "Hali qo'ng'iroq qilingan buyurtma yo'q."
          }
        />
      ) : (
        <div className="space-y-4">
          {q.data.map((item) => (
            <VerificationCard key={item.uuid} item={item} fetchedAt={q.dataUpdatedAt} now={now} readOnly={scope === 'history'} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOff}
        onOpenChange={setConfirmOff}
        title="Tasdiqlash navbati o'chirilsinmi?"
        description={
          pendingCount > 0
            ? `Navbatda kutayotgan ${pendingCount} ta buyurtma darhol hamkorlarga yuboriladi. Keyingi yangi mijozlar buyurtmalari ham qo'ng'iroqsiz o'tadi.`
            : "Yangi mijozlarning buyurtmalari operator qo'ng'irog'isiz, to'g'ridan-to'g'ri hamkorga boradi."
        }
        confirmLabel="O'chirish"
        destructive
        onConfirm={() => toggle.mutateAsync(false)}
      />
    </div>
  );
}
