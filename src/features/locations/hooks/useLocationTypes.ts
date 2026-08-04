import { useEffect, useState } from 'react';
import { locationsApi } from '../services/locationsApi';
import type { LocationTypeOption } from '../services/locationsApi';

export function useLocationTypes() {
  const [types, setTypes] = useState<LocationTypeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    locationsApi.getLocationTypes()
      .then((result) => {
        if (!cancelled) setTypes(result);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { types, loading };
}
