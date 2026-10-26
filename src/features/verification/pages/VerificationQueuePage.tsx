import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/shared/components/PageHeader';
import { ChipTabs } from '@/shared/components/Filters';
import { EmptyState, ErrorState } from '@/shared/components/State';
import { getErrorMessage } from '@/shared/lib/errors';
import { useVerificationQueue } from '../hooks';
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
  const pending = useVerificationQueue('pending');
  const q = useVerificationQueue(scope);
  const now = useNow();

  return (
    <div>
      <PageHeader
        title="Tasdiqlash navbati"
        description="Yangi mijozlarning birinchi buyurtmalari: mijozga qo'ng'iroq qilib tasdiqlang yoki rad eting. Tasdiqlanmaguncha hamkorga yuborilmaydi."
        actions={
          <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCw className={`mr-2 size-4 ${q.isFetching ? 'animate-spin' : ''}`} />Yangilash
          </Button>
        }
      />
      <div className="mb-4">
        <ChipTabs
          value={scope}
          onChange={(v) => setScope(v as 'pending' | 'history')}
          items={[
            { value: 'pending', label: 'Navbat', count: pending.data?.length ?? 0 },
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
          description={scope === 'pending' ? 'Tasdiqlanishi kerak bo\'lgan buyurtma yo\'q. Yangisi kelsa signal beriladi.' : "Hali qo'ng'iroq qilingan buyurtma yo'q."}
        />
      ) : (
        <div className="space-y-4">
          {q.data.map((item) => (
            <VerificationCard key={item.uuid} item={item} fetchedAt={q.dataUpdatedAt} now={now} readOnly={scope === 'history'} />
          ))}
        </div>
      )}
    </div>
  );
}
