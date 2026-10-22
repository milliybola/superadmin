import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { ImageInput } from '@/shared/components/ImageInput';
import { cn } from '@/lib/utils';
import { cuisineHooks, partnerHooks, tariffHooks, type PartnerDetail } from '../api';

const NO_TARIFF = '__none__';

const num = (label: string, optional = false) =>
  z.string().trim().refine((v) => (optional && v === '') || (v !== '' && !Number.isNaN(Number(v)) && Number(v) >= 0), `${label}: to'g'ri son kiriting`);

const schema = z.object({
  name: z.string().trim().min(2, 'Nomini kiriting').max(100),
  partner_type: z.enum(['RESTAURANT', 'SHOP']),
  phone: z.string().trim().min(9, 'Telefonni kiriting'),
  password: z.string(),
  address: z.string().trim().min(3, 'Manzilni kiriting').max(100),
  description: z.string().max(2000),
  email: z.union([z.literal(''), z.string().trim().email("Email noto'g'ri")]),
  owner_phone: z.string().trim(),
  location_lat: z.string().trim().refine((v) => v !== '' && Math.abs(Number(v)) <= 90, "Kenglik -90..90 oralig'ida"),
  location_long: z.string().trim().refine((v) => v !== '' && Math.abs(Number(v)) <= 180, "Uzunlik -180..180 oralig'ida"),
  delivery_fee: num('Yetkazish narxi'),
  min_order_amount: num('Minimal summa'),
  max_order_amount: num('Maksimal summa', true),
  free_delivery_threshold: num('Bepul yetkazish chegarasi', true),
  delivery_time_minutes: num('Yetkazish vaqti'),
  telegram_group_id: z.string().trim(),
  is_active: z.boolean(),
  tariff: z.string(),
  cuisine_uuids: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  name: '', partner_type: 'RESTAURANT', phone: '+998', password: '', address: '', description: '', email: '', owner_phone: '',
  location_lat: '41.311081', location_long: '69.240562', delivery_fee: '0', min_order_amount: '0', max_order_amount: '',
  free_delivery_threshold: '', delivery_time_minutes: '30', telegram_group_id: '', is_active: true, tariff: '', cuisine_uuids: [],
};

const fromPartner = (p: PartnerDetail): Values => ({
  name: p.name, partner_type: p.partner_type, phone: p.phone, password: '', address: p.address, description: p.description ?? '',
  email: p.email ?? '', owner_phone: p.owner?.phone ?? '', location_lat: String(p.location_lat), location_long: String(p.location_long),
  delivery_fee: String(p.delivery_fee), min_order_amount: String(p.min_order_amount), max_order_amount: p.max_order_amount?.toString() ?? '',
  free_delivery_threshold: p.free_delivery_threshold?.toString() ?? '', delivery_time_minutes: String(p.delivery_time_minutes),
  telegram_group_id: p.telegram_group_id ?? '', is_active: p.is_active, tariff: p.tariff?.uuid ?? '', cuisine_uuids: p.cuisines.map((c) => c.uuid),
});

/** Fayl bo'lsa multipart, bo'lmasa JSON (JSON bo'sh `cuisine_uuids` ni ham to'g'ri tozalaydi) */
function buildBody(v: Values, isEdit: boolean, logo: File | null, banner: File | null) {
  const body: Record<string, unknown> = {
    ...v, rating: undefined,
    password: v.password || undefined,
    owner_phone: v.owner_phone,
    max_order_amount: v.max_order_amount === '' ? null : v.max_order_amount,
    free_delivery_threshold: v.free_delivery_threshold === '' ? null : v.free_delivery_threshold,
    telegram_group_id: v.telegram_group_id || null,
    email: v.email || null,
    // Yangi hamkor: bo'sh = standart tarif (server beradi); tahrirda bo'sh = cheklovsiz (tarifsiz)
    tariff: v.tariff || (isEdit ? null : undefined),
    cuisine_uuids: v.partner_type === 'SHOP' ? [] : v.cuisine_uuids,
  };
  if (isEdit) delete body.partner_type;
  if (!logo && !banner) return body;
  const fd = new FormData();
  for (const [k, val] of Object.entries(body)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) val.forEach((x) => fd.append(k, x));
    else fd.append(k, val === null ? '' : String(val));
  }
  if (logo) fd.append('logo', logo);
  if (banner) fd.append('banner', banner);
  return fd;
}

export function PartnerFormDialog({ open, onOpenChange, partner, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; partner?: PartnerDetail; onSaved?: (p: PartnerDetail) => void;
}) {
  const isEdit = !!partner;
  const { create, update } = partnerHooks.useMutations();
  const { data: cuisines } = cuisineHooks.useList({ page_size: 100 });
  const { data: tariffs } = tariffHooks.useList({});
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const { register, handleSubmit, control, setError, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: partner ? fromPartner(partner) : EMPTY,
  });
  const type = useWatch({ control, name: 'partner_type' });
  const selected = useWatch({ control, name: 'cuisine_uuids' });

  const submit = handleSubmit(async (v) => {
    if (!isEdit && v.password.length < 6) return setError('password', { message: 'Parol kamida 6 belgi' });
    const body = buildBody(v, isEdit, logo, banner);
    try {
      const saved = isEdit
        ? await update.mutateAsync({ id: partner.uuid, body })
        : await create.mutateAsync(body);
      onSaved?.(saved as PartnerDetail);
      setLogo(null); setBanner(null);
      onOpenChange(false);
    } catch (e) {
      applyServerErrors(e, setError, Object.keys(EMPTY));
    }
  });

  const err = (k: keyof Values) => errors[k]?.message as string | undefined;
  const toggleCuisine = (uuid: string) =>
    setValue('cuisine_uuids', selected.includes(uuid) ? selected.filter((x) => x !== uuid) : [...selected, uuid], { shouldDirty: true });

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} wide onSubmit={submit} submitting={create.isPending || update.isPending}
      title={isEdit ? 'Hamkorni tahrirlash' : 'Yangi hamkor'} description={isEdit ? partner.name : "Restoran yoki do'kon qo'shish. Bosh filial avtomatik yaratiladi."}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomi" required error={err('name')}><Input {...register('name')} /></Field>
        <Field label="Turi" required>
          <Controller control={control} name="partner_type" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="RESTAURANT">Restoran</SelectItem><SelectItem value="SHOP">Do'kon</SelectItem></SelectContent>
            </Select>
          )} />
        </Field>
        <Field label="Telefon (login)" required error={err('phone')}><Input {...register('phone')} placeholder="+998901234567" /></Field>
        {!isEdit && <Field label="Parol" required error={err('password')} hint="Kamida 6 belgi"><Input type="password" autoComplete="new-password" {...register('password')} /></Field>}
        <Field label="Manzil" required error={err('address')} className="sm:col-span-2"><Input {...register('address')} /></Field>
        <Field label="Tavsif" error={err('description')} className="sm:col-span-2"><Textarea rows={3} {...register('description')} /></Field>
        <Field label="Kenglik (lat)" required error={err('location_lat')}><Input inputMode="decimal" {...register('location_lat')} /></Field>
        <Field label="Uzunlik (long)" required error={err('location_long')}><Input inputMode="decimal" {...register('location_long')} /></Field>
        <Field label="Email" error={err('email')}><Input type="email" {...register('email')} /></Field>
        <Field label="Egasi (foydalanuvchi telefoni)" error={err('owner_phone')} hint="Ixtiyoriy"><Input {...register('owner_phone')} placeholder="+998..." /></Field>
      </div>

      <Field label="Tarif" hint="Qaysi imkoniyatlar ochiq: olib ketish, stollar, filial limiti">
        <Controller control={control} name="tariff" render={({ field }) => (
          <Select value={field.value || NO_TARIFF} onValueChange={(v) => field.onChange(v === NO_TARIFF ? '' : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TARIFF}>{isEdit ? 'Cheklovsiz (tarifsiz)' : 'Standart tarif (avtomatik)'}</SelectItem>
              {(tariffs?.results ?? []).filter((t) => t.is_active).map((t) => <SelectItem key={t.uuid} value={t.uuid}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </Field>

      {type === 'RESTAURANT' && (
        <Field label="Oshxona turlari" hint="Bir nechtasini tanlash mumkin">
          <div className="flex flex-wrap gap-1.5">
            {(cuisines?.results ?? []).map((c) => {
              const on = selected.includes(c.uuid);
              return (
                <button key={c.uuid} type="button" onClick={() => toggleCuisine(c.uuid)}
                  className={cn('rounded-full border px-3 py-1 text-sm transition-colors', on ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent')}>
                  {c.name}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Yetkazish narxi (so'm)" error={err('delivery_fee')}><Input inputMode="numeric" {...register('delivery_fee')} /></Field>
        <Field label="Yetkazish vaqti (daqiqa)" error={err('delivery_time_minutes')}><Input inputMode="numeric" {...register('delivery_time_minutes')} /></Field>
        <Field label="Minimal buyurtma (so'm)" error={err('min_order_amount')}><Input inputMode="numeric" {...register('min_order_amount')} /></Field>
        <Field label="Maksimal buyurtma (so'm)" error={err('max_order_amount')} hint="Bo'sh — cheklov yo'q"><Input inputMode="numeric" {...register('max_order_amount')} /></Field>
        <Field label="Bepul yetkazish chegarasi (so'm)" error={err('free_delivery_threshold')} hint="Bo'sh — bepul yetkazish yo'q"><Input inputMode="numeric" {...register('free_delivery_threshold')} /></Field>
        <Field label="Telegram guruh ID" error={err('telegram_group_id')} hint="Buyurtma xabarlari uchun"><Input {...register('telegram_group_id')} /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Logo"><ImageInput current={partner?.logo} onChange={setLogo} aspect="aspect-square max-w-[160px]" label="Logo yuklash" /></Field>
        <Field label="Muqova (banner)"><ImageInput current={partner?.banner} onChange={setBanner} label="Banner yuklash" /></Field>
      </div>

      <Controller control={control} name="is_active" render={({ field }) => (
        <SwitchField label="Faol" description="O'chirilsa hamkor mijozlarga ko'rinmaydi" checked={field.value} onChange={field.onChange} />
      )} />
    </FormDialog>
  );
}
