import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorState } from '@/shared/components/State';
import { Field } from '@/shared/components/Field';
import { dispatchApi } from '../api';

/** Telegram dispetcher (4-bosqich, ichki): MilliyGo kuryerlar guruhi. Bot, operator, muddat — «Telegram bot» sahifasida. */
const schema = z.object({ courier_group_id: z.string().trim().min(1, 'Guruh ID ni kiriting') });
type Values = z.infer<typeof schema>;

export default function DispatchPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['dispatch-config'], queryFn: dispatchApi.get });
  const save = useMutation({
    mutationFn: (v: Values) => dispatchApi.save({ courier_group_id: v.courier_group_id }),
    onSuccess: (d) => { qc.setQueryData(['dispatch-config'], d); toast.success('Sozlamalar saqlandi'); },
  });
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: data ? { courier_group_id: data.courier_group_id ?? '' } : undefined,
  });

  if (error && !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <PageHeader title="Telegram dispetcher" description="Buyurtmalarni Telegram orqali MilliyGo kuryerlariga tarqatish (ichki, tajribaviy)" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">MilliyGo kuryerlar guruhi</CardTitle>
          <CardDescription>
            Bot token, operator chat va kuryer qidirish muddati — <Link to="/telegram" className="text-primary underline-offset-2 hover:underline">Telegram bot</Link> sahifasida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32" /> : (
            <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
              <Field label="Kuryerlar guruhi ID" required error={errors.courier_group_id?.message}
                hint={data?.has_bot_token ? 'Masalan: -1001234567890' : "Avval «Telegram bot» sahifasida bot tokenini kiriting"}>
                <Input {...register('courier_group_id')} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={save.isPending || !isDirty || !data?.has_bot_token}>
                  {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Saqlash
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
