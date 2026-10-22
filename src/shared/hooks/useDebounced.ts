import { useEffect, useState } from 'react';

/** Qiymat o'zgarishini `delay` ms kechiktiradi (qidiruv maydoni har harfda so'rov yubormasligi uchun) */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
