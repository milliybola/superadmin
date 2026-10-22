import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ListQuery } from '@/shared/api/types';
import { ordersApi } from './api';

export const orderKeys = {
  all: ['orders'] as const,
  list: (query: ListQuery) => ['orders', 'list', query] as const,
  detail: (uuid: string) => ['orders', 'detail', uuid] as const,
  meta: ['orders', 'meta'] as const,
};

/** Buyurtmalar ro'yxati; admin ekranni ochiq qoldirsa ham yangilanib turadi */
export const useOrders = (query: ListQuery, refetchMs: number | false = 20_000) =>
  useQuery({
    queryKey: orderKeys.list(query),
    queryFn: () => ordersApi.list(query),
    placeholderData: keepPreviousData,
    refetchInterval: refetchMs,
  });

export const useOrder = (uuid: string) =>
  useQuery({ queryKey: orderKeys.detail(uuid), queryFn: () => ordersApi.get(uuid), refetchInterval: 15_000 });

export const useOrdersMeta = () =>
  useQuery({ queryKey: orderKeys.meta, queryFn: ordersApi.meta, staleTime: Infinity });

export function useOrderActions(uuid: string) {
  const qc = useQueryClient();
  const onSuccess = (message: string) => (data: unknown) => {
    qc.setQueryData(orderKeys.detail(uuid), data);
    qc.invalidateQueries({ queryKey: ['orders', 'list'] });
    toast.success(message);
  };
  const changeStatus = useMutation({
    mutationFn: (body: { status: string; note?: string; force?: boolean }) => ordersApi.changeStatus(uuid, body),
    onSuccess: onSuccess('Holat yangilandi'),
  });
  const assignCourier = useMutation({
    mutationFn: (courier: string | null) => ordersApi.assignCourier(uuid, courier),
    onSuccess: onSuccess('Kuryer yangilandi'),
  });
  return { changeStatus, assignCourier };
}
