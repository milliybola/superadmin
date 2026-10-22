import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ListParams {
  page: number;
  pageSize: number;
  ordering: string;
  filters: Record<string, string>;
}

const RESERVED = new Set(['page', 'page_size', 'ordering']);

/**
 * Ro'yxat holati (sahifa, tartib, filtrlar) URLda saqlanadi: sahifa yangilansa, havola ulashilsa yoki
 * "orqaga" bosilsa joyida qoladi. Filtr o'zgarsa 1-sahifaga qaytadi.
 */
export function useListParams(defaults: { ordering?: string; pageSize?: number } = {}) {
  const [search, setSearch] = useSearchParams();

  const params: ListParams = useMemo(() => {
    const filters: Record<string, string> = {};
    search.forEach((value, key) => {
      if (!RESERVED.has(key) && value !== '') filters[key] = value;
    });
    return {
      page: Math.max(1, Number(search.get('page')) || 1),
      pageSize: Number(search.get('page_size')) || defaults.pageSize || 20,
      ordering: search.get('ordering') || defaults.ordering || '',
      filters,
    };
  }, [search, defaults.ordering, defaults.pageSize]);

  const update = useCallback(
    (patch: Record<string, string | number | null | undefined>, resetPage = true) => {
      setSearch(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === undefined || v === '') next.delete(k);
            else next.set(k, String(v));
          }
          if (resetPage && !('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearch],
  );

  const setFilter = useCallback((key: string, value: string | null) => update({ [key]: value }), [update]);
  const setPage = useCallback((page: number) => update({ page: page > 1 ? page : null }, false), [update]);
  const setPageSize = useCallback((size: number) => update({ page_size: size, page: null }, false), [update]);
  const setOrdering = useCallback((ordering: string) => update({ ordering }), [update]);
  const reset = useCallback(() => setSearch({}, { replace: true }), [setSearch]);

  /** API'ga yuboriladigan so'rov parametrlari */
  const query = useMemo(
    () => ({
      ...params.filters,
      page: params.page,
      page_size: params.pageSize,
      ...(params.ordering ? { ordering: params.ordering } : {}),
    }),
    [params],
  );

  return { params, query, setFilter, setPage, setPageSize, setOrdering, update, reset, hasFilters: Object.keys(params.filters).length > 0 };
}
