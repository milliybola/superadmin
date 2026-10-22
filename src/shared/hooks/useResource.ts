import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ListQuery } from '../api/types';
import type { Resource } from '../api/resource';

/**
 * Resurs uchun react-query ilmoqlari. `key` — keshdagi nom ('banners'); ro'yxat/tafsilot kalitlari shundan hosil bo'ladi.
 * Mutatsiyalar muvaffaqiyatda ro'yxatni yangilaydi va xabar ko'rsatadi; xatoni global MutationCache ko'rsatadi.
 */
export function createResourceHooks<TList, TDetail = TList>(key: string, api: Resource<TList, TDetail>) {
  const useList = (query: ListQuery, options: { refetchMs?: number; enabled?: boolean } = {}) =>
    useQuery({
      queryKey: [key, 'list', query],
      queryFn: () => api.list(query),
      placeholderData: keepPreviousData,
      refetchInterval: options.refetchMs,
      enabled: options.enabled,
    });

  const useDetail = (id: string | number | undefined) =>
    useQuery({ queryKey: [key, 'detail', id], queryFn: () => api.get(id as string | number), enabled: id !== undefined && id !== '' });

  const useMutations = () => {
    const qc = useQueryClient();
    const refresh = () => qc.invalidateQueries({ queryKey: [key] });
    const create = useMutation({
      mutationFn: (body: unknown) => api.create(body),
      onSuccess: () => { refresh(); toast.success("Qo'shildi"); },
    });
    const update = useMutation({
      mutationFn: ({ id, body }: { id: string | number; body: unknown }) => api.update(id, body),
      onSuccess: (data, { id }) => { qc.setQueryData([key, 'detail', id], data); refresh(); toast.success('Saqlandi'); },
    });
    const remove = useMutation({
      mutationFn: (id: string | number) => api.remove(id),
      onSuccess: () => { refresh(); toast.success("O'chirildi"); },
    });
    const act = useMutation({
      mutationFn: ({ id, name, body, method }: { id: string | number; name: string; body?: unknown; method?: 'post' | 'put'; message?: string }) =>
        api.action(id, name, body, method),
      onSuccess: (_data, { message }) => { refresh(); if (message) toast.success(message); },
    });
    return { create, update, remove, act };
  };

  return { useList, useDetail, useMutations };
}
