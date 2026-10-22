/** DRF sahifalangan ro'yxat javobi (backend: AdminPagination) */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ListQuery = Record<string, string | number | boolean | undefined | null>;
