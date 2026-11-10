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

interface DiscountLimit { max_manual_discount_percent: string | number }

const KEY = ['platform-discount-limit'] as const;

/** A10/Q40 — kassada menejer beradigan qo'lda chegirmaning eng katta foizi (butun platforma uchun) */
export function DiscountLimitCard() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<DiscountLimit> => (await apiClient.get(ENDPOINTS.ADMIN.PLATFORM_DISCOUNT_LIMIT)).data,
  });
  const [value, setValue] = useState<string | null>(null);
  const current = q.data ? String(Number(q.data.max_manual_discount_percent)) : '';
  const shown = value ?? current;
  const n = Number(shown);
  const invalid = shown.trim() === '' || Number.isNaN(n) || n < 0 || n > 100;

  const save = useMutation({
    mutationFn: async (v: number): Promise<DiscountLimit> =>
      (await apiClient.patch(ENDPOINTS.ADMIN.PLATFORM_DISCOUNT_LIMIT, { max_manual_discount_percent: v })).data,
    onSuccess: (d) => {
      qc.setQueryData(KEY, d);
      setValue(null);
      toast.success('Chegirma chegarasi saqlandi');
    },
  });

  return (
    <Card className="mt-6 max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Chegirma chegarasi (kassa)</CardTitle>
        <CardDescription>Menejer bitta buyurtmaga beradigan eng katta chegirma (%). Ega chegarasiz.</CardDescription>
      </CardHeader>
      <CardContent>
        {q.isLoading ? <Skeleton className="h-10" /> : q.error ? (
          <p className="text-sm text-destructive">Yuklab bo'lmadi. <button type="button" className="underline" onClick={() => q.refetch()}>Qayta urinish</button></p>
        ) : (
          <form className="flex items-end gap-3" onSubmit={(e) => {
            e.preventDefault();
            if (!invalid && shown !== current) save.mutate(n);
          }}>
            <Field label="Eng katta chegirma (%)" className="flex-1"
              error={invalid ? "0 dan 100 gacha son" : undefined} hint="0 — menejer chegirma bera olmaydi">
              <Input inputMode="decimal" value={shown} onChange={(e) => setValue(e.target.value)} />
            </Field>
            <Button type="submit" disabled={invalid || shown === current || save.isPending} className="mb-5">
              {save.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
