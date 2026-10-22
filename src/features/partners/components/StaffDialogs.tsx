import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiClient from '@/core/api/client';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { filialHooks, staffHooks, type Staff } from '../api';
import { STAFF_ROLES } from '../constants';

const NONE = '__none__';

const schema = z.object({
  name: z.string().trim().min(2, 'Ismni kiriting').max(100),
  phone: z.string().trim().min(9, 'Telefonni kiriting').max(20),
  role: z.enum(['manager', 'waiter']),
  password: z.string(),
  home_filial: z.string(),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;
const EMPTY: Values = { name: '', phone: '+998', role: 'waiter', password: '', home_filial: '', is_active: true };

export function StaffDialog({ partnerUuid, staff, open, onOpenChange }: {
  partnerUuid: string; staff?: Staff; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { create, update } = staffHooks.useMutations();
  const { data: filials } = filialHooks.useList({ partner: partnerUuid, page_size: 100 });
  const { register, handleSubmit, control, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: staff ? { name: staff.name, phone: staff.phone, role: staff.role, password: '', home_filial: staff.home_filial ?? '', is_active: staff.is_active } : EMPTY,
  });

  const submit = handleSubmit(async (v) => {
    if (!staff && v.password.length < 6) return setError('password', { message: 'Parol kamida 6 belgi' });
    const body = { ...v, partner: partnerUuid, home_filial: v.home_filial || null, password: v.password || undefined };
    try {
      if (staff) await update.mutateAsync({ id: staff.uuid, body });
      else await create.mutateAsync(body);
      onOpenChange(false);
    } catch (e) {
      applyServerErrors(e, setError, Object.keys(EMPTY));
    }
  });

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} onSubmit={submit} submitting={create.isPending || update.isPending}
      title={staff ? 'Xodimni tahrirlash' : 'Yangi xodim'}>
      <Field label="Ism" required error={errors.name?.message}><Input {...register('name')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefon (login)" required error={errors.phone?.message}><Input {...register('phone')} /></Field>
        <Field label="Lavozim">
          <Controller control={control} name="role" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STAFF_ROLES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </Field>
      </div>
      {!staff && <Field label="Parol" required error={errors.password?.message} hint="Kamida 6 belgi"><Input type="password" autoComplete="new-password" {...register('password')} /></Field>}
      <Field label="Asosiy filial" error={errors.home_filial?.message}>
        <Controller control={control} name="home_filial" render={({ field }) => (
          <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Biriktirilmagan</SelectItem>
              {(filials?.results ?? []).map((f) => <SelectItem key={f.uuid} value={f.uuid}>{f.filial_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </Field>
      <Controller control={control} name="is_active" render={({ field }) => (
        <SwitchField label="Faol" description="O'chirilsa xodim tizimga kira olmaydi" checked={field.value} onChange={field.onChange} />
      )} />
    </FormDialog>
  );
}

const pwSchema = z.object({ password: z.string().min(6, 'Kamida 6 belgi') });

/** Hamkor yoki xodim parolini yangilash (`url` — `.../set-password/`) */
export function PasswordDialog({ url, title, subject, open, onOpenChange }: {
  url: string; title: string; subject: string; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ password: string }>({ resolver: zodResolver(pwSchema) });
  const save = useMutation({
    mutationFn: (password: string) => apiClient.post(url, { password }),
    onSuccess: () => { toast.success('Parol yangilandi'); reset(); onOpenChange(false); },
  });
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={title} description={subject} submitting={save.isPending}
      onSubmit={handleSubmit((v) => save.mutate(v.password))}>
      <Field label="Yangi parol" required error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...register('password')} />
      </Field>
    </FormDialog>
  );
}
