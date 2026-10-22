import apiClient from '@/core/api/client';
import type { ListQuery, Paginated } from './types';

/** Fayl bor bo'lsa (logo, banner, rasm) multipart, aks holda JSON yuboriladi */
function toBody(body: unknown): { data: unknown; headers?: Record<string, string> } {
  if (body instanceof FormData) return { data: body, headers: { 'Content-Type': 'multipart/form-data' } };
  return { data: body };
}

/** Admin REST resursi uchun umumiy CRUD (`base` oxiri `/` bilan: 'superadmin/banners/') */
export function createResource<TList, TDetail = TList>(base: string) {
  return {
    list: async (query: ListQuery = {}): Promise<Paginated<TList>> => (await apiClient.get(base, { params: query })).data,
    get: async (id: string | number): Promise<TDetail> => (await apiClient.get(`${base}${id}/`)).data,
    create: async (body: unknown): Promise<TDetail> => {
      const { data, headers } = toBody(body);
      return (await apiClient.post(base, data, { headers })).data;
    },
    update: async (id: string | number, body: unknown): Promise<TDetail> => {
      const { data, headers } = toBody(body);
      return (await apiClient.patch(`${base}${id}/`, data, { headers })).data;
    },
    remove: async (id: string | number): Promise<void> => {
      await apiClient.delete(`${base}${id}/`);
    },
    action: async <R = TDetail>(id: string | number, name: string, body?: unknown, method: 'post' | 'put' = 'post'): Promise<R> =>
      (await apiClient[method](`${base}${id}/${name}/`, body)).data,
    read: async <R>(id: string | number, name: string): Promise<R> => (await apiClient.get(`${base}${id}/${name}/`)).data,
  };
}

export type Resource<TList, TDetail = TList> = ReturnType<typeof createResource<TList, TDetail>>;

/** Auth sarlavhasi bilan faylni yuklab olish (CSV hisobotlar) */
export async function downloadFile(url: string, params: ListQuery, fallbackName: string) {
  const res = await apiClient.get(url, { params, responseType: 'blob' });
  const disposition: string = res.headers['content-disposition'] ?? '';
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const href = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
  URL.revokeObjectURL(href);
}
