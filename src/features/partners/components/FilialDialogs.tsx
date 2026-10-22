import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { FILIAL_STATUSES, WEEKDAY_LABELS } from '../constants';
import { filialHooks, getOpeningHours, staffHooks, type Filial, type OpeningHours } from '../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { toast } from 'sonner';


const filialSchema = z.object({
  filial_name: z.string().trim().min(2, 'Nomini kiriting').max(100),
  filial_status: z.enum(['ACTIVE', 'INACTIVE', 'CLOSED']),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(20),
  location_lat: z.string().trim().refine((v) => v === '' || Math.abs(Number(v)) <= 90, 'Noto\'g\'ri kenglik'),
  location_long: z.string().trim().refine((v) => v === '' || Math.abs(Number(v)) <= 180, 'Noto\'g\'ri uzunlik'),
  manager: z.string(),
});
type FilialValues = z.infer<typeof filialSchema>;
const FILIAL_EMPTY: FilialValues = { filial_name: '', filial_status: 'ACTIVE', address: '', phone: '', location_lat: '', location_long: '', manager: '' };
const NONE = '__none__';

export function FilialDialog({ partnerUuid, filial, open, onOpenChange }: {
  partnerUuid: string; filial?: Filial; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { create, update } = filialHooks.useMutations();
  const { data: managers } = staffHooks.useList({ partner: partnerUuid, role: 'manager', page_size: 100 });
  const { register, handleSubmit, control, setError, formState: { errors } } = useForm<FilialValues>({
    resolver: zodResolver(filialSchema),
    values: filial ? {
      filial_name: filial.filial_name, filial_status: filial.filial_status, address: filial.address ?? '', phone: filial.phone ?? '',
      location_lat: filial.location_lat?.toString() ?? '', location_long: filial.location_long?.toString() ?? '', manager: filial.manager ?? '',
    } : FILIAL_EMPTY,
  });
  const err = (k: keyof FilialValues) => errors[k]?.message;

  const submit = handleSubmit(async (v) => {
    const body = {
      ...v, partner: partnerUuid, manager: v.manager || null,
      location_lat: v.location_lat === '' ? null : Number(v.location_lat),
      location_long: v.location_long === '' ? null : Number(v.location_long),
    };
    try {
      if (filial) await update.mutateAsync({ id: filial.uuid, body });
      else await create.mutateAsync(body);
      onOpenChange(false);
    } catch (e) {
      applyServerErrors(e, setError, Object.keys(FILIAL_EMPTY));
    }
  });

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} onSubmit={submit} submitting={create.isPending || update.isPending}
      title={filial ? 'Filialni tahrirlash' : 'Yangi filial'}>
      <Field label="Filial nomi" required error={err('filial_name')}><Input {...register('filial_name')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Holati">
          <Controller control={control} name="filial_status" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(FILIAL_STATUSES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </Field>
        <Field label="Telefon" error={err('phone')}><Input {...register('phone')} /></Field>
      </div>
      <Field label="Manzil" error={err('address')}><Input {...register('address')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kenglik (lat)" error={err('location_lat')}><Input inputMode="decimal" {...register('location_lat')} /></Field>
        <Field label="Uzunlik (long)" error={err('location_long')}><Input inputMode="decimal" {...register('location_long')} /></Field>
      </div>
      <Field label="Menejer" error={err('manager')} hint="Avval «Xodimlar» bo'limida menejer qo'shing">
        <Controller control={control} name="manager" render={({ field }) => (
          <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Biriktirilmagan</SelectItem>
              {(managers?.results ?? []).map((m) => <SelectItem key={m.uuid} value={m.uuid}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </Field>
    </FormDialog>
  );
}

export function OpeningHoursDialog({ filial, open, onOpenChange }: { filial: Filial; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['filials', 'hours', filial.uuid], queryFn: () => getOpeningHours(filial.uuid), enabled: open });
  const save = useMutation({
    mutationFn: (body: OpeningHours) => apiClient.put(`${ENDPOINTS.ADMIN.FILIALS}${filial.uuid}/opening-hours/`, body).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['filials', 'hours', filial.uuid] }); toast.success('Ish vaqti saqlandi'); onOpenChange(false); },
  });
  const { control, register, handleSubmit } = useForm<OpeningHours>({ values: data });

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Ish vaqti" description={filial.filial_name}
      submitting={save.isPending} onSubmit={handleSubmit((v) => save.mutate({
        ...v, from_hour: v.from_hour.slice(0, 5), to_hour: v.to_hour.slice(0, 5),
      }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ochilish"><Input type="time" {...register('from_hour')} /></Field>
        <Field label="Yopilish"><Input type="time" {...register('to_hour')} /></Field>
      </div>
      <div className="space-y-2">
        {WEEKDAY_LABELS.map((d) => (
          <Controller key={d.key} control={control} name={d.key} render={({ field }) => (
            <SwitchField label={d.label} checked={!!field.value} onChange={field.onChange} />
          )} />
        ))}
      </div>
    </FormDialog>
  );
}
