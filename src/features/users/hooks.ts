import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ListQuery } from '@/shared/api/types';
import { usersApi, type UserUpdate } from './api';

export const userKeys = {
  list: (query: ListQuery) => ['users', 'list', query] as const,
  detail: (uuid: string) => ['users', 'detail', uuid] as const,
};

export const useUsers = (query: ListQuery) =>
  useQuery({ queryKey: userKeys.list(query), queryFn: () => usersApi.list(query), placeholderData: keepPreviousData });

export const useUser = (uuid: string) =>
  useQuery({ queryKey: userKeys.detail(uuid), queryFn: () => usersApi.get(uuid) });

export function useUserActions(uuid: string) {
  const qc = useQueryClient();
  const done = (message: string) => (data: unknown) => {
    qc.setQueryData(userKeys.detail(uuid), data);
    qc.invalidateQueries({ queryKey: ['users', 'list'] });
    toast.success(message);
  };
  const update = useMutation({ mutationFn: (body: UserUpdate) => usersApi.update(uuid, body), onSuccess: done('Saqlandi') });
  const setBlocked = useMutation({
    mutationFn: (blocked: boolean) => usersApi.block(uuid, blocked),
    onSuccess: (data, blocked) => done(blocked ? 'Foydalanuvchi bloklandi' : 'Blok olib tashlandi')(data),
  });
  return { update, setBlocked };
}
