import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorState } from '@/shared/components/State';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { formatDateTime } from '@/shared/lib/format';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/app/navigation';
import { PLATFORM_STAGE_KEY, STAGE, STAGE_OPTIONS, platformStageApi, useStage, type Stage } from '@/app/stage';
import { DiscountLimitCard } from '../components/DiscountLimitCard';

/**
 * Har bosqich nimani QO'SHADI (oldingi bosqichlar ustiga) — docs/bosqichlar/matritsa.md bilan bir xil.
 * Menyu bo'limlari navigation.ts dan avtomatik olinadi.
 */
const STAGE_INFO: Record<Stage, { summary: string; backend: string[]; extraMenu?: string[] }> = {
  1: {
    summary: "Agregator: mijoz MilliyGo ilovasi yoki saytidan buyurtma beradi, hamkor o'z kuryeri yoki olib ketish bilan beradi.",
    backend: [
      "Mijoz ilovasi va sayt orqali buyurtma, onlayn to'lov",
      "Yetkazib berish faqat o'z kuryeri bor hamkorlarda (qolganlarida olib ketish)",
      "Hamkor: menyu, aksiya, statistika, Tez rejim, oshxona printeri, Telegram kunlik hisobot",
      "Hamkor xodimlari: faqat menejer",
      "MilliyGo kuryerlari to'xtatilgan: ilovaga kira olmaydi, buyurtma ularga tarqatilmaydi",
    ],
    extraMenu: ["Kuryerlar (faqat hamkor kuryerlari)"],
  },
  2: {
    summary: 'Hamkorlar uchun kassa (POS) tizimi ochiladi.',
    backend: [
      'Kassa rejimi, smena, kassir roli',
      "Kassadan buyurtma: zal, olib ketish, telefon buyurtmasi",
      "To'lov oynasi (aralash to'lov, qaytim), mijoz cheki, oflayn navbat",
      "Zal, stol, ofitsiant va stol QR menyusi (QR — Plus tarifida)",
      'Ombor va texkarta (hamkor Sozlamalarda yoqadi)',
    ],
  },
  3: {
    summary: "MilliyGo o'z kuryerlari ishga tushadi.",
    backend: [
      "MilliyGo kuryerlari ilovaga kira oladi va buyurtma qabul qiladi",
      'Buyurtmalar umumiy kuryerlar guruhiga va avtomatik taqsimlashga yuboriladi',
      "Yetkazib berish o'z kuryeri yo'q hamkorlarda ham ochiladi",
    ],
    extraMenu: ['Kuryerlar va xarita (MilliyGo kuryerlari bilan)'],
  },
  4: {
    summary: "Ichki va tajribaviy bo'limlar — faqat egasi uchun.",
    backend: ["3-bosqichdagi hamma narsa; yangi funksiyalar avval shu bosqichda sinaladi"],
  },
};

const menuFor = (s: Stage) => [
  ...NAV_GROUPS.flatMap((g) => g.items.filter((i) => i.stage === s).map((i) => i.label)),
  ...(STAGE_INFO[s].extraMenu ?? []),
];

/** Joriy → yangi bosqichga o'tishda yoqiladigan/o'chiriladigan narsalar */
function transition(from: Stage, to: Stage) {
  const up = to > from;
  const range = STAGE_OPTIONS.filter((o) => (up ? o.value > from && o.value <= to : o.value > to && o.value <= from));
  const lines = range.flatMap((o) => [...menuFor(o.value).map((m) => `Menyu: ${m}`), ...STAGE_INFO[o.value].backend]);
  const couriersOn = up && from < STAGE.COURIERS && to >= STAGE.COURIERS;
  const couriersOff = !up && from >= STAGE.COURIERS && to < STAGE.COURIERS;
  return { up, lines, couriersOn, couriersOff };
}

export default function StagesPage() {
  const qc = useQueryClient();
  const { stage, query } = useStage();
  const [target, setTarget] = useState<Stage | null>(null);
  const save = useMutation({
    mutationFn: platformStageApi.set,
    onSuccess: (d) => {
      qc.setQueryData(PLATFORM_STAGE_KEY, d);
      toast.success(`${d.stage}-bosqichga o'tildi`);
    },
  });

  if (query.error && !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  const t = target ? transition(stage, target) : null;

  return (
    <>
      <PageHeader
        title="Bosqichlar"
        description="Platforma qaysi bosqichda ishlashini belgilaydi. Bu butun platformaga ta'sir qiladi: mijoz, hamkor, kuryer ilovalari va shu panel."
      />
      {query.data?.updated_at && (
        <p className="-mt-4 mb-4 text-xs text-muted-foreground">
          Oxirgi o'zgarish: {formatDateTime(query.data.updated_at)}{query.data.updated_by_name ? ` · ${query.data.updated_by_name}` : ''}
        </p>
      )}
      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STAGE_OPTIONS.map((o) => {
            const current = o.value === stage;
            const reached = o.value <= stage;
            const menu = menuFor(o.value);
            return (
              <Card key={o.value} className={cn('flex flex-col', current && 'border-primary ring-1 ring-primary')}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{o.value}-bosqich</span>
                    {current ? <Pill tone="primary" dot>Joriy</Pill> : reached ? <Pill tone="success">Yoqilgan</Pill> : <Pill>Yopiq</Pill>}
                  </div>
                  <CardTitle className="text-base">{o.short}</CardTitle>
                  <CardDescription>{STAGE_INFO[o.value].summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 text-sm">
                  <div>
                    <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Menyu bo'limlari</div>
                    {menu.length ? (
                      <ul className="space-y-1">
                        {(o.value === STAGE.BASE ? menu.slice(0, 6) : menu).map((m) => (
                          <li key={m} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" />{m}</li>
                        ))}
                        {o.value === STAGE.BASE && menu.length > 6 && <li className="text-xs text-muted-foreground">va yana {menu.length - 6} ta asosiy bo'lim</li>}
                      </ul>
                    ) : <p className="text-xs text-muted-foreground">Yangi menyu bo'limi yo'q</p>}
                  </div>
                  <div>
                    <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Platformada</div>
                    <ul className="space-y-1">
                      {STAGE_INFO[o.value].backend.map((b) => (
                        <li key={b} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-auto pt-2">
                    <Button className="w-full" variant={current ? 'secondary' : 'outline'} disabled={current || save.isPending} onClick={() => setTarget(o.value)}>
                      {current ? 'Joriy bosqich' : "Shu bosqichga o'tish"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {stage >= STAGE.POS && <DiscountLimitCard />}

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `${target}-bosqichga o'tish` : ''}
        destructive={!!t?.couriersOff}
        confirmLabel="Ha, o'tish"
        description={t && target ? (
          <span className="block space-y-3 text-left">
            <span className="block">{stage}-bosqich → {target}-bosqich. O'zgarish darhol butun platformaga qo'llanadi.</span>
            {t.lines.length > 0 && (
              <span className="block">
                <span className="block font-medium text-foreground">{t.up ? 'Yoqiladi:' : "O'chiriladi:"}</span>
                {t.lines.map((l) => <span key={l} className="block">• {l}</span>)}
              </span>
            )}
            {t.couriersOn && (
              <span className="flex gap-2 rounded-md bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                MilliyGo kuryerlari darhol ishga tushadi: ular ilovaga kira oladi va yangi buyurtmalar ularga ham tarqatiladi. Kuryerlar va Telegram bot sozlamalarini tekshiring.
              </span>
            )}
            {t.couriersOff && (
              <span className="flex gap-2 rounded-md bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                MilliyGo kuryerlari to'xtatiladi: yangi buyurtma ularga yuborilmaydi va ilovaga kira olmaydi. O'z kuryeri yo'q hamkorlarda yetkazib berish yopiladi. Yo'ldagi buyurtmalarni oldindan tekshiring.
              </span>
            )}
          </span>
        ) : undefined}
        onConfirm={() => (target ? save.mutateAsync(target) : undefined)}
      />
    </>
  );
}
