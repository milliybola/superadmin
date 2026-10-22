import { isAxiosError } from 'axios';

/**
 * Backend xatosidan odam o'qiydigan matn: DRF `{detail}`, `{message}`, `{field: ["..."]}` shakllarini tushunadi.
 */
export function getErrorMessage(error: unknown, fallback = "Xatolik yuz berdi. Qayta urinib ko'ring."): string {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  if (!error.response) return "Serverga ulanib bo'lmadi. Internetni tekshiring.";

  const data = error.response.data as unknown;
  if (typeof data === 'string' && data.length < 200) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['detail', 'message']) {
      const v = obj[key];
      if (typeof v === 'string') return v;
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
    }
    for (const [field, v] of Object.entries(obj)) {
      const text = Array.isArray(v) ? v.find((x) => typeof x === 'string') : typeof v === 'string' ? v : null;
      if (text) return field === 'non_field_errors' ? text : `${text}`;
    }
  }
  if (error.response.status === 403) return "Bu amal uchun ruxsat yo'q.";
  if (error.response.status === 404) return 'Topilmadi.';
  if (error.response.status >= 500) return 'Serverda xatolik. Birozdan keyin urinib ko\'ring.';
  return fallback;
}
