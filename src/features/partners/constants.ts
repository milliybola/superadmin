// Labels for known partner_type values — falls back to the raw value for
// any type the backend introduces that isn't listed here yet.
export const PARTNER_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restoran',
  SHOP: "Do'kon",
  PHARMACY: 'Dorixona',
  MARKET: 'Bozor',
};

export const WEEKDAY_LABELS: { key: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; label: string }[] = [
  { key: 'mon', label: 'Dush' },
  { key: 'tue', label: 'Sesh' },
  { key: 'wed', label: 'Chor' },
  { key: 'thu', label: 'Pay' },
  { key: 'fri', label: 'Jum' },
  { key: 'sat', label: 'Shan' },
  { key: 'sun', label: 'Yak' },
];

export const FILIAL_STATUSES: Record<string, string> = { ACTIVE: 'Faol', INACTIVE: 'Faol emas', CLOSED: 'Yopiq' };

export const STAFF_ROLES: Record<string, string> = { manager: 'Menejer', waiter: 'Ofitsiant' };
