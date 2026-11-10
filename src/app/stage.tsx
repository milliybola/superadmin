import { useEffect, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { routeStage } from './navigation';
import { STAGE } from './stageLevels';

export type Stage = 1 | 2 | 3 | 4;

export { STAGE };

export const STAGE_OPTIONS: { value: Stage; label: string; short: string }[] = [
  { value: STAGE.BASE, label: '1-bosqich: Hamkor va mijoz', short: 'Hamkor va mijoz' },
  { value: STAGE.POS, label: '2-bosqich: + POS tizimi', short: '+ POS tizimi' },
  { value: STAGE.COURIERS, label: '3-bosqich: + MilliyGo kuryerlari', short: '+ MilliyGo kuryerlari' },
  { value: STAGE.ALL, label: '4-bosqich: Hammasi', short: 'Hammasi' },
];

export interface PlatformStage {
  stage: Stage;
  features: { pos: boolean; couriers: boolean };
  updated_at: string | null;
  updated_by_name: string;
}

export const PLATFORM_STAGE_KEY = ['platform-stage'] as const;

export const platformStageApi = {
  get: async (): Promise<PlatformStage> => (await apiClient.get(ENDPOINTS.ADMIN.PLATFORM_STAGE)).data,
  set: async (stage: Stage): Promise<PlatformStage> => (await apiClient.patch(ENDPOINTS.ADMIN.PLATFORM_STAGE, { stage })).data,
};

/**
 * Joriy platforma bosqichi — serverdan (butun platformaga ta'sir qiladi, «Bosqichlar» sahifasida o'zgartiriladi).
 * Yuklanguncha `stage` = 1 (eng tor ko'rinish), `ready` = false.
 */
export function useStage() {
  const q = useQuery({ queryKey: PLATFORM_STAGE_KEY, queryFn: platformStageApi.get, staleTime: 60_000 });
  return { stage: (q.data?.stage ?? STAGE.BASE) as Stage, ready: !!q.data, query: q };
}

/** Sarlavhadagi kichik belgi: joriy bosqich; bosilsa «Bosqichlar» sahifasi */
export function StageBadge() {
  const { stage, ready } = useStage();
  if (!ready) return null;
  const opt = STAGE_OPTIONS.find((o) => o.value === stage);
  return (
    <Link
      to="/stages"
      title={opt?.label}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/25 hover:bg-primary/15"
    >
      <Layers className="size-3.5" />
      <span>{stage}-bosqich</span>
      <span className="hidden text-primary/80 md:inline">· {opt?.short}</span>
    </Link>
  );
}

/** Joriy bosqichda ochilmaydigan yo'lga kirilsa — dashbordga qaytaradi (bosqich yuklangandan keyin) */
export function StageGuard({ children }: { children: ReactNode }) {
  const { stage, ready } = useStage();
  const { pathname } = useLocation();
  const blocked = ready && routeStage(pathname) > stage;
  useEffect(() => {
    if (blocked) toast.error("Bu bo'lim keyingi bosqichda");
  }, [blocked]);
  return blocked ? <Navigate to="/" replace /> : <>{children}</>;
}
