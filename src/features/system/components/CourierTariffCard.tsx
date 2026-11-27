import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { Field } from '@/shared/components/Field';
import { formatMoney } from '@/shared/lib/format';

interface CourierTariff {
  base_fee: string | number;
  per_km_fee: string | number;
  cash_limit: string | number;
  examples: { km: number; fee: string | number }[];
}

type Key = 'base_fee' | 'per_km_fee' | 'cash_limit';

const KEY = ['courier-tariff'] as const;

const FIELDS: { key: Key; label: string; hint: string }[] = [
  { key: 'base_fee', label: "Boshlang'ich narx (so'm)", hint: "Masofa noma'lum bo'lsa faqat shu olinadi" },
  { key: 'per_km_fee', label: "Har km uchun (so'm)", hint: "Restoran → mijoz, to'g'ri chiziq bo'yicha" },
  { key: 'cash_limit', label: "Naqd chegarasi (so'm)", hint: "Kuryer bundan katta naqd buyurtmani olmaydi" },
];

/**
 * Global (MilliyGo) kuryer tarifi — admin belgilaydi (2026-11-27). Haq = boshlang'ich + har km × masofa,
 * 500 so'mga yaxlitlanadi. Hisob-kitob olib ketishda qo'lma-qo'l: naqdda kuryer restoranga «jami − haq» to'laydi,
 * onlaynda restoran kuryerga haqni beradi. Hamkorning o'z kuryeri bor bo'lsa, mijoz hamkor narxini to'laydi.
 */
export function CourierTariffCard() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<CourierTariff> => (await apiClient.get(ENDPOINTS.ADMIN.COURIER_TARIFF)).data,
  });
  const [edit, setEdit] = useState<Partial<Record<Key, string>>>({});
  const current = (k: Key) => (q.data ? String(Number(q.data[k])) : '');
  const shown = (k: Key) => edit[k] ?? current(k);
  const bad = (k: Key) => {
    const v = shown(k);
    return v.trim() === '' || Number.isNaN(Number(v)) || Number(v) < 0;
  };
  const changed = FIELDS.filter((f) => shown(f.key) !== current(f.key));
  const invalid = FIELDS.some((f) => bad(f.key));

  const save = useMutation({
    mutationFn: async (body: Partial<Record<Key, number>>): Promise<CourierTariff> =>
      (await apiClient.patch(ENDPOINTS.ADMIN.COURIER_TARIFF, body)).data,
    onSuccess: (d) => {
      qc.setQueryData(KEY, d);
      setEdit({});
      toast.success('Kuryer tarifi saqlandi');
    },
  });

  return (
    <Card className="mt-6 max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">MilliyGo kuryer tarifi</CardTitle>
        <CardDescription>
          Kuryer haqi = boshlang'ich + har km × masofa. Hisob-kitob olib ketishda: naqdda kuryer restoranga
          «jami − haq» to'laydi, onlayn to'lovda restoran kuryerga haqni beradi. Yangi tarif keyingi buyurtmalarga ta'sir qiladi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {q.isLoading ? <Skeleton className="h-32" /> : q.error ? (
          <p className="text-sm text-destructive">Yuklab bo'lmadi. <button type="button" className="underline" onClick={() => q.refetch()}>Qayta urinish</button></p>
        ) : (
          <form className="space-y-1" onSubmit={(e) => {
            e.preventDefault();
            if (invalid || !changed.length) return;
            save.mutate(Object.fromEntries(changed.map((f) => [f.key, Number(shown(f.key))])));
          }}>
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint} error={bad(f.key) ? "Musbat son kiriting" : undefined}>
                <Input inputMode="decimal" value={shown(f.key)} onChange={(e) => setEdit((s) => ({ ...s, [f.key]: e.target.value }))} />
              </Field>
            ))}
            {q.data?.examples?.length ? (
              <p className="pb-3 text-sm text-muted-foreground">
                Hozirgi tarif bo'yicha: {q.data.examples.map((x) => `${x.km ? `${x.km} km` : "nuqtasiz"} — ${formatMoney(Number(x.fee))}`).join(' · ')}
              </p>
            ) : null}
            <Button type="submit" disabled={invalid || !changed.length || save.isPending}>
              {save.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
