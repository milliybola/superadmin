/**
 * Bosqich raqamlari: yangi bo'lim/funksiya qaysi bosqichdan ko'rinishini shu nomlar bilan belgilang.
 * Alohida faylda — navigation.ts ↔ stage.tsx aylana importisiz ishlatish uchun.
 */
export const STAGE = {
  BASE: 1, // Hamkor va mijoz
  POS: 2, // + POS tizimi
  COURIERS: 3, // + MilliyGo kuryerlari
  ALL: 4, // Hammasi (ichki va tajribaviy bo'limlar, faqat egasi — Q49)
} as const;
