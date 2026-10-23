import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ListQuery } from '@/shared/api/types';
import { couriersApi, type CourierDetail, type CourierScope } from './api';

export const courierKeys = {
  list: (query: ListQuery) => ['couriers', 'list', query] as const,
  detail: (uuid: string) => ['couriers', 'detail', uuid] as const,
  summary: (scope?: CourierScope) => ['couriers', 'summary', scope ?? {}] as const,
  map: (scope?: CourierScope) => ['couriers', 'map', scope ?? {}] as const,
};

export const useCouriers = (query: ListQuery, enabled = true) =>
  useQuery({
    queryKey: courierKeys.list(query),
    queryFn: () => couriersApi.list(query),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    enabled,
  });

export const useCourier = (uuid: string) =>
  useQuery({ queryKey: courierKeys.detail(uuid), queryFn: () => couriersApi.get(uuid), refetchInterval: 30_000 });

export const useCouriersSummary = (scope?: CourierScope) =>
  useQuery({ queryKey: courierKeys.summary(scope), queryFn: () => couriersApi.summary(scope), refetchInterval: 30_000 });

/** Onlayn kuryerlar xaritasi: har 15 soniyada yangilanadi */
export const useCouriersMap = (scope?: CourierScope) =>
  useQuery({ queryKey: courierKeys.map(scope), queryFn: () => couriersApi.map(scope), refetchInterval: 15_000 });

/** Kuryer ustidagi barcha amallar. Javob (yangilangan profil) keshga yoziladi, ro'yxatlar yangilanadi. */
export function useCourierActions(uuid: string) {
  const qc = useQueryClient();
  const done = (message: string) => (data: CourierDetail) => {
    qc.setQueryData(courierKeys.detail(uuid), data);
    qc.invalidateQueries({ queryKey: ['couriers', 'list'] });
    qc.invalidateQueries({ queryKey: ['couriers', 'summary'] });
    toast.success(message);
  };
  return {
    approve: useMutation({ mutationFn: (force?: boolean) => couriersApi.approve(uuid, !!force), onSuccess: done('Kuryer tasdiqlandi') }),
    reject: useMutation({ mutationFn: (reason: string) => couriersApi.reject(uuid, reason), onSuccess: done('Ariza rad etildi') }),
    block: useMutation({ mutationFn: (reason: string) => couriersApi.block(uuid, reason), onSuccess: done('Kuryer bloklandi') }),
    unblock: useMutation({ mutationFn: () => couriersApi.unblock(uuid), onSuccess: done('Blok olib tashlandi') }),
    update: useMutation({ mutationFn: (body: Parameters<typeof couriersApi.update>[1]) => couriersApi.update(uuid, body), onSuccess: done('Saqlandi') }),
    reviewDocument: useMutation({
      mutationFn: (v: { docId: number; status: 'approved' | 'rejected' | 'pending'; note?: string; expires_at?: string | null }) =>
        couriersApi.reviewDocument(uuid, v.docId, { status: v.status, note: v.note, expires_at: v.expires_at }),
      onSuccess: done('Hujjat yangilandi'),
    }),
  };
}

export function useCourierTransactions(uuid: string, query: ListQuery) {
  return useQuery({
    queryKey: ['couriers', 'transactions', uuid, query],
    queryFn: () => couriersApi.transactions(uuid, query),
    placeholderData: keepPreviousData,
  });
}

export function useAddTransaction(uuid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: string; amount: number; note: string }) => couriersApi.addTransaction(uuid, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['couriers'] });
      toast.success('Yozuv qo\'shildi');
    },
  });
}
