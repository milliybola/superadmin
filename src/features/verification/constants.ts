import type { Tone } from '@/shared/components/Pill';
import type { AttemptOutcome, RiskCode, VerificationStatus } from './api';

/** Qo'ng'iroqlar navbati yangilanish oralig'i (ms) */
export const QUEUE_REFETCH_MS = 10_000;

export const VERIFICATION_STATUS: Record<VerificationStatus, { label: string; tone: Tone }> = {
  UNVERIFIED: { label: 'Tasdiqlanmagan', tone: 'warning' },
  TRUSTED: { label: 'Ishonchli', tone: 'success' },
  BLOCKED: { label: 'Bloklangan', tone: 'danger' },
};

export const TRUSTED_VIA: Record<string, string> = {
  FIRST_ORDER: 'Birinchi buyurtma muvaffaqiyatli yakunlandi',
  LEGACY: 'Avvalgi yetkazilgan buyurtma bor (eski mijoz)',
  ADMIN: "Admin qo'lda tasdiqladi",
};

export const ATTEMPT_OUTCOMES: Record<AttemptOutcome, { label: string; tone: Tone }> = {
  CONFIRMED: { label: 'Mijoz tasdiqladi', tone: 'success' },
  REJECTED: { label: 'Rad etildi', tone: 'danger' },
  NO_ANSWER: { label: 'Javob bermadi', tone: 'warning' },
  BUSY: { label: 'Band', tone: 'warning' },
  CALLBACK: { label: "Keyinroq qayta qo'ng'iroq", tone: 'info' },
  OTHER: { label: 'Boshqa', tone: 'muted' },
};

/** Xavf belgilari rangi (qaror emas — qo'ng'iroqda e'tibor berish uchun) */
export const RISK_TONES: Record<RiskCode, Tone> = {
  HIGH_CASH: 'danger',
  NO_POINT: 'warning',
  FAR: 'warning',
  NO_ADDRESS: 'warning',
  NIGHT: 'info',
  BAD_HISTORY: 'danger',
};

/** Kutish vaqtiga qarab rang: muddat (expires_at) ga yaqinlashsa sariq, o'tay desa qizil */
export function waitTone(remainingSec: number): Tone {
  if (remainingSec <= 120) return 'danger';
  if (remainingSec <= 300) return 'warning';
  return 'muted';
}

export const mapLinks = (lat: number, lng: number) => ({
  yandex: `https://yandex.uz/maps/?pt=${lng},${lat}&z=17&l=map`,
  google: `https://www.google.com/maps?q=${lat},${lng}`,
});
