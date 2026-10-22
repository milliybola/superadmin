import { isAxiosError } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/** Backend (DRF) maydon xatolarini forma maydonlariga yozadi; mos kelmaganlari toast orqali ko'rsatiladi */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, known: string[]) {
  if (!isAxiosError(error) || typeof error.response?.data !== 'object' || !error.response.data) return;
  for (const [field, value] of Object.entries(error.response.data as Record<string, unknown>)) {
    const text = Array.isArray(value) ? String(value[0]) : typeof value === 'string' ? value : null;
    if (text && known.includes(field)) setError(field as Path<T>, { message: text });
  }
}
