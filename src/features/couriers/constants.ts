import type { Tone } from '@/shared/components/Pill';

/** Kuryerning hozirgi holati (ilovadagi «ishga chiqdim» tugmasi) */
export const COURIER_STATUSES: Record<string, { label: string; tone: Tone }> = {
  available: { label: "Bo'sh", tone: 'success' },
  busy: { label: 'Band', tone: 'warning' },
  break: { label: 'Tanaffus', tone: 'info' },
  offline: { label: 'Oflayn', tone: 'muted' },
};

/** Ariza (hujjatlarni ko'rib chiqish) holati */
export const REVIEW_STATUSES: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Ko'rib chiqilmoqda", tone: 'warning' },
  approved: { label: 'Tasdiqlangan', tone: 'success' },
  rejected: { label: 'Rad etilgan', tone: 'danger' },
};

export const DOC_STATUSES = REVIEW_STATUSES;

export const TRANSPORT_TYPES: Record<string, string> = {
  bike: 'Velosiped',
  scooter: 'Skuter',
  motorcycle: 'Mototsikl',
  car: 'Avtomobil',
  walk: 'Piyoda',
  van: 'Furgon',
  truck: 'Yuk mashinasi',
};

export const COURIER_TYPES: Record<string, string> = {
  PLATFORM: 'Platforma kuryeri',
  PARTNER: 'Hamkor kuryeri',
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  selfie: 'Selfi',
  passport: 'Pasport',
  driver_license: 'Haydovchilik guvohnomasi',
  vehicle_registration: 'Texpasport',
  insurance: 'Sug\'urta',
};

export const TX_TYPES: Record<string, { label: string; tone: Tone }> = {
  EARNING: { label: 'Buyurtma daromadi', tone: 'success' },
  PAYOUT: { label: "To'lov berildi", tone: 'info' },
  BONUS: { label: 'Mukofot', tone: 'success' },
  PENALTY: { label: 'Jarima', tone: 'danger' },
  ADJUSTMENT: { label: 'Tuzatish', tone: 'muted' },
};
