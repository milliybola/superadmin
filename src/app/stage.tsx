import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { routeStage } from './navigation';

export type Stage = 1 | 2 | 3;

const STORAGE_KEY = 'superadmin_stage';

export const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 1, label: '1-bosqich: Hamkor va mijoz' },
  { value: 2, label: '2-bosqich: + MilliyGo kuryerlari' },
  { value: 3, label: 'Hammasi' },
];

function readStage(): Stage {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    return v === 2 || v === 3 ? v : 1;
  } catch {
    return 1;
  }
}

interface StageCtx {
  stage: Stage;
  setStage: (s: Stage) => void;
}

const StageContext = createContext<StageCtx>({ stage: 1, setStage: () => {} });

export function StageProvider({ children }: { children: ReactNode }) {
  const [stage, setStageState] = useState<Stage>(readStage);
  const value = useMemo<StageCtx>(
    () => ({
      stage,
      setStage: (s) => {
        setStageState(s);
        try {
          localStorage.setItem(STORAGE_KEY, String(s));
        } catch {
          /* localStorage mavjud emas */
        }
      },
    }),
    [stage],
  );
  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export const useStage = () => useContext(StageContext);

/** Bosqich tanlagich (sarlavhada) */
export function StageSelect() {
  const { stage, setStage } = useStage();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">Bosqich</span>
      <Select value={String(stage)} onValueChange={(v) => setStage(Number(v) as Stage)}>
        <SelectTrigger aria-label="Bosqich" className="h-9 w-[150px] sm:w-[250px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {STAGE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Joriy bosqichda ochilmaydigan yo'lga kirilsa — dashbordga qaytaradi */
export function StageGuard({ children }: { children: ReactNode }) {
  const { stage } = useStage();
  const { pathname } = useLocation();
  const blocked = routeStage(pathname) > stage;
  useEffect(() => {
    if (blocked) toast.error("Bu bo'lim keyingi bosqichda");
  }, [blocked]);
  return blocked ? <Navigate to="/" replace /> : <>{children}</>;
}
