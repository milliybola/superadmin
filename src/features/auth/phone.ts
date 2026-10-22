/** "+998 (90) 123-45-67" ko'rinishida yozish; kiritilgan matndan faqat 9 ta raqam olinadi */
export function formatUzPhone(input: string): string {
  const digits = (input.startsWith('+998') ? input.slice(4) : input).replace(/\D/g, '').slice(0, 9);
  let out = '+998';
  if (digits.length > 0) out += ' (' + digits.slice(0, 2);
  if (digits.length > 2) out += ') ' + digits.slice(2, 5);
  if (digits.length > 5) out += '-' + digits.slice(5, 7);
  if (digits.length > 7) out += '-' + digits.slice(7, 9);
  return out;
}

/** "+998 (90) 123-45-67" → "+998901234567" */
export const cleanPhone = (formatted: string) => formatted.replace(/[^\d+]/g, '');

export const isCompletePhone = (formatted: string) => cleanPhone(formatted).length === 13;
