import { format, formatDistanceToNowStrict, isValid, parse } from 'date-fns';
import { uz } from 'date-fns/locale';

/** Backend DRF sanasi: "20-10-2026 18:21:32" yoki ISO ("2026-10-20T18:21:32+05:00") */
export function parseApiDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const drf = parse(value, 'dd-MM-yyyy HH:mm:ss', new Date());
  if (isValid(drf)) return drf;
  const iso = new Date(value);
  return isValid(iso) ? iso : null;
}

export const formatDateTime = (value: string | Date | null | undefined) => {
  const d = parseApiDate(value);
  return d ? format(d, 'dd.MM.yyyy HH:mm') : '—';
};

export const formatDate = (value: string | Date | null | undefined) => {
  const d = parseApiDate(value);
  return d ? format(d, 'dd.MM.yyyy') : '—';
};

export const formatTime = (value: string | Date | null | undefined) => {
  const d = parseApiDate(value);
  return d ? format(d, 'HH:mm') : '—';
};

/** "5 daqiqa oldin" */
export const timeAgo = (value: string | Date | null | undefined) => {
  const d = parseApiDate(value);
  return d ? formatDistanceToNowStrict(d, { addSuffix: true, locale: uz }) : '—';
};

const nf = new Intl.NumberFormat('ru-RU');

export const formatNumber = (n: number | string | null | undefined) =>
  n === null || n === undefined || n === '' ? '—' : nf.format(Number(n));

/** 1234567 -> "1 234 567 so'm" */
export const formatMoney = (n: number | string | null | undefined) =>
  n === null || n === undefined || n === '' ? '—' : `${nf.format(Math.round(Number(n)))} so'm`;

/** 1 250 000 -> "1.25 mln", 12 500 -> "12.5 ming" (grafik o'qlari va kichik kartalar uchun) */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${+(n / 1_000_000_000).toFixed(2)} mlrd`;
  if (abs >= 1_000_000) return `${+(n / 1_000_000).toFixed(2)} mln`;
  if (abs >= 1_000) return `${+(n / 1_000).toFixed(1)} ming`;
  return String(Math.round(n));
}

/** +998901234567 -> "+998 90 123-45-67" */
export function formatPhone(raw: string | null | undefined): string {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('998')) {
    return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)}-${d.slice(8, 10)}-${d.slice(10, 12)}`;
  }
  return raw || '—';
}

/** Kecha bilan solishtirish: +12.5% / −8% (kecha 0 bo'lsa null) */
export function deltaPercent(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

/** Sana input (yyyy-MM-dd) uchun */
export const toInputDate = (d: Date) => format(d, 'yyyy-MM-dd');
