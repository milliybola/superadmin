import type { Tone } from '@/shared/components/Pill';

export const ORDER_STATUSES: Record<string, { label: string; tone: Tone }> = {
  VERIFYING: { label: 'Tasdiqlanmoqda', tone: 'warning' },
  AWAITING_PAYMENT: { label: "To'lov kutilmoqda", tone: 'warning' },
  PENDING: { label: 'Yangi', tone: 'info' },
  NEW: { label: 'Yangi', tone: 'info' },
  SEARCHING_COURIER: { label: 'Kuryer qidirilmoqda', tone: 'warning' },
  ACCEPTED: { label: 'Qabul qilindi', tone: 'primary' },
  PREPARING: { label: 'Tayyorlanmoqda', tone: 'primary' },
  READY_FOR_PICKUP: { label: 'Tayyor', tone: 'primary' },
  PICKED_UP: { label: 'Kuryer oldi', tone: 'primary' },
  ON_THE_WAY: { label: "Yo'lda", tone: 'primary' },
  DELIVERED: { label: 'Yetkazildi', tone: 'success' },
  CANCELLED: { label: 'Bekor qilindi', tone: 'danger' },
  REJECTED: { label: 'Rad etildi', tone: 'danger' },
};

/** Faol (hali yakunlanmagan) holatlar — jonli kuzatuv uchun */
export const ACTIVE_STATUSES = ['PENDING', 'NEW', 'SEARCHING_COURIER', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY'];
export const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED', 'REJECTED'];

/** Yuqoridagi tez filtr tugmalari: qiymat — `status` parametri */
export const STATUS_GROUPS = [
  { value: '', label: 'Hammasi' },
  { value: ACTIVE_STATUSES.join(','), label: 'Faol' },
  { value: 'VERIFYING', label: 'Tasdiqlanmoqda' },
  { value: 'AWAITING_PAYMENT', label: "To'lov kutilmoqda" },
  { value: 'DELIVERED', label: 'Yetkazilgan' },
  { value: 'CANCELLED,REJECTED', label: 'Bekor qilingan' },
];

export const DELIVERY_TYPES: Record<string, string> = {
  DELIVERY: 'Yetkazib berish',
  PICKUP: 'Olib ketish',
  DINE_IN: 'Restoranda',
};

export const PAYMENT_METHODS: Record<string, string> = {
  CASH: 'Naqd',
  CARD: 'Karta',
  TRANSFER: "O'tkazma",
  PAYME: 'Payme',
  CLICK: 'Click',
};

export const ORDER_SOURCES: Record<string, string> = {
  CUSTOMER: 'Ilova',
  PARTNER: 'Hamkor',
  WAITER: 'Ofitsiant',
};

export const ACTOR_LABELS: Record<string, string> = {
  SYSTEM: 'Tizim',
  CUSTOMER: 'Mijoz',
  PARTNER: 'Hamkor',
  COURIER: 'Kuryer',
  ADMIN: 'Admin',
};

export const orderStatusLabel = (s: string) => ORDER_STATUSES[s]?.label ?? s;
