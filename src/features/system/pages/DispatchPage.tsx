import { Controller, useForm } from 'react-hook-form';
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
import { Field, SwitchField } from '@/shared/components/Field';
import { Pill } from '@/shared/components/Pill';
import { dispatchApi } from '../api';

const schema = z.object({
  courier_group_id: z.string().trim().min(1, 'Guruh ID ni kiriting'),
  operator_chat_id: z.string().trim(),
  dispatch_timeout_minutes: z.string().refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 240, "1 dan 240 gacha daqiqa"),
  bot_token: z.string().trim(),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;

export default function DispatchPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['dispatch-config'], queryFn: dispatchApi.get });
  const save = useMutation({
    mutationFn: (v: Values) => dispatchApi.save({
      courier_group_id: v.courier_group_id, operator_chat_id: v.operator_chat_id || null,
      dispatch_timeout_minutes: Number(v.dispatch_timeout_minutes), is_active: v.is_active,
      ...(v.bot_token ? { bot_token: v.bot_token } : {}),
    }),
    onSuccess: (d) => { qc.setQueryData(['dispatch-config'], d); toast.success('Sozlamalar saqlandi'); },
  });
  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: data ? {
      courier_group_id: data.courier_group_id ?? '', operator_chat_id: data.operator_chat_id ?? '',
      dispatch_timeout_minutes: String(data.dispatch_timeout_minutes ?? 30), bot_token: '', is_active: data.is_active ?? true,
    } : undefined,
  });

  if (error && !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <PageHeader title="Telegram dispetcher" description="Buyurtmalarni Telegram orqali kuryerlarga tarqatish sozlamalari" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Telegram sozlamalari</CardTitle>
          <CardDescription>Bot token xavfsizlik uchun hech qachon ko'rsatilmaydi — faqat almashtirish mumkin.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64" /> : (
            <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v, { onSuccess: () => reset({ ...v, bot_token: '' }) }))}>
              <Field label="Bot token" error={errors.bot_token?.message} hint={data?.has_bot_token ? 'Token saqlangan. Almashtirish uchun yangisini kiriting.' : 'Hali kiritilmagan'}>
                <div className="flex items-center gap-2">
                  <Input type="password" autoComplete="off" placeholder="123456:ABC..." {...register('bot_token')} />
                  <Pill tone={data?.has_bot_token ? 'success' : 'danger'}>{data?.has_bot_token ? 'Bor' : "Yo'q"}</Pill>
                </div>
              </Field>
              <Field label="Kuryerlar guruhi ID" required error={errors.courier_group_id?.message} hint="Masalan: -1001234567890"><Input {...register('courier_group_id')} /></Field>
              <Field label="Operator chat ID" error={errors.operator_chat_id?.message} hint="Kuryer topilmasa yoki hamkor guruhi yo'q bo'lsa xabar shu yerga boradi"><Input {...register('operator_chat_id')} /></Field>
              <Field label="Kuryer qidirish muddati (daqiqa)" error={errors.dispatch_timeout_minutes?.message} hint="Shundan keyin «kuryer topilmadi» deb belgilanadi"><Input inputMode="numeric" {...register('dispatch_timeout_minutes')} /></Field>
              <Controller control={control} name="is_active" render={({ field }) => (
                <SwitchField label="Dispetcher yoqilgan" description="O'chirilsa buyurtmalar Telegram orqali kuryerlarga yuborilmaydi" checked={field.value ?? true} onChange={field.onChange} />
              )} />
              <div className="flex justify-end">
                <Button type="submit" disabled={save.isPending || (!isDirty && !!data?.has_bot_token)}>
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
