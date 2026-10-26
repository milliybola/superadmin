import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { verificationApi, type CustomerAction } from './api';
import { QUEUE_REFETCH_MS } from './constants';

export const verificationKeys = {
  all: ['verifications'] as const,
  list: (scope: 'pending' | 'history') => ['verifications', 'list', scope] as const,
  customer: (uuid: string) => ['verifications', 'customer', uuid] as const,
};

/** Navbat: eng eskisi birinchi (backend tartiblaydi). Tab ko'rinib turganda har ~10 soniyada yangilanadi. */
export const useVerificationQueue = (scope: 'pending' | 'history' = 'pending') =>
  useQuery({
    queryKey: verificationKeys.list(scope),
    queryFn: () => verificationApi.list(scope),
    refetchInterval: scope === 'pending' ? QUEUE_REFETCH_MS : false,
    staleTime: 0,
  });

/** Qisqa signal (WebAudio) — yangi buyurtma navbatga tushganda; brauzer ruxsat bermasa jim o'tadi */
function playBeep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const tone = (freq: number, at: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.3);
    };
    tone(880, 0);
    tone(1175, 0.18);
    setTimeout(() => void ctx.close(), 800);
  } catch {
    /* ovoz mavjud emas */
  }
}

/**
 * Layout'da (barcha sahifalarda) ishlaydi: navbat sonini qaytaradi, son OSHGANDA ovozli signal + toast beradi,
 * brauzer sarlavhasiga `(N)` qo'shadi.
 */
export function useVerificationAlerts(): number {
  const { data } = useVerificationQueue('pending');
  const count = data?.length ?? 0;
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (data === undefined) return;
    if (prev.current !== null && count > prev.current) {
      playBeep();
      toast.warning(`Tasdiqlash navbatida yangi buyurtma (${count} ta kutmoqda)`);
    }
    prev.current = count;
  }, [count, data]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = count > 0 ? `(${count}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [count]);

  return count;
}

export function useVerificationActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: verificationKeys.all });
  const settled = (message: string) => () => {
    toast.success(message);
    refresh();
    qc.invalidateQueries({ queryKey: ['orders'] });
  };
  // 400 (allaqachon hal qilingan) — xabarni umumiy mutationCache ko'rsatadi; ro'yxatni yangilaymiz
  const onError = () => refresh();

  const approve = useMutation({
    mutationFn: ({ uuid, note }: { uuid: string; note?: string }) => verificationApi.approve(uuid, note),
    onSuccess: settled('Mijoz tasdiqlandi — buyurtma hamkorga yuborildi'),
    onError,
  });
  const reject = useMutation({
    mutationFn: ({ uuid, reason, block }: { uuid: string; reason: string; block: boolean }) =>
      verificationApi.reject(uuid, { reason, block_customer: block }),
    onSuccess: settled('Buyurtma rad etildi'),
    onError,
  });
  const attempt = useMutation({
    mutationFn: ({ uuid, outcome, note }: { uuid: string; outcome: 'NO_ANSWER' | 'BUSY' | 'CALLBACK' | 'OTHER'; note?: string }) =>
      verificationApi.attempt(uuid, { outcome, note: note || undefined }),
    onSuccess: () => {
      toast.success("Urinish jurnalga yozildi");
      refresh();
    },
    onError,
  });
  return { approve, reject, attempt };
}

export const useCustomerVerification = (userUuid: string | null | undefined) =>
  useQuery({
    queryKey: verificationKeys.customer(userUuid ?? ''),
    queryFn: () => verificationApi.customer(userUuid as string),
    enabled: !!userUuid,
  });

export function useCustomerVerificationAction(userUuid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { action: CustomerAction; reason?: string }) => verificationApi.customerAction(userUuid, body),
    onSuccess: (data, vars) => {
      qc.setQueryData(verificationKeys.customer(userUuid), data);
      qc.invalidateQueries({ queryKey: verificationKeys.all });
      toast.success(
        { trust: 'Mijoz ishonchli deb belgilandi', revoke: 'Tasdiqlash bekor qilindi', block: 'Mijoz bloklandi', unblock: 'Blok olib tashlandi' }[vars.action],
      );
    },
  });
}
