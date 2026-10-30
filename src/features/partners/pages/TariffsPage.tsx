import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { formatMoney } from '@/shared/lib/format';
import { tariffHooks, type Tariff } from '../api';

const limit = z.string().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 0), "Butun son yoki bo'sh (cheksiz)");
const money = z.string().refine((v) => v === '' || Number(v) >= 0, 'Musbat son');

const schema = z.object({
  code: z.string().trim().min(2, 'Kod kiriting').max(40).regex(/^[a-z0-9-]+$/, 'Faqat kichik lotin harf, raqam va "-"'),
  name: z.string().trim().min(2, 'Nomini kiriting').max(80),
  description: z.string().max(255),
  price_monthly: z.string().refine((v) => v !== '' && Number(v) >= 0, 'Narxni kiriting'),
  price_monthly_original: money,
  allow_pickup: z.boolean(),
  allow_dine_in: z.boolean(),
  allow_qr_menu: z.boolean(),
  max_tables: limit,
  tables_per_filial: z.boolean(),
  max_filials: limit.refine((v) => v === '' || Number(v) >= 1, 'Kamida 1 (bosh filial)'),
  max_products: limit,
  max_couriers: limit,
  free_orders_monthly: limit,
  extra_order_fee: money,
  listing_priority: z.string().refine((v) => /^\d{1,3}$/.test(v), 'Butun son (0–999)'),
  priority_support: z.boolean(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  order: z.string().refine((v) => /^\d{1,4}$/.test(v), 'Butun son'),
});
type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  code: '', name: '', description: '', price_monthly: '0', price_monthly_original: '0',
  allow_pickup: false, allow_dine_in: false, allow_qr_menu: false, max_tables: '', tables_per_filial: true,
  max_filials: '1', max_products: '', max_couriers: '', free_orders_monthly: '', extra_order_fee: '0',
  listing_priority: '0', priority_support: false, is_default: false, is_active: true, order: '0',
};

const toNumberOrNull = (v: string) => (v === '' ? null : Number(v));
const text = (n: number | null) => (n === null ? 'Cheksiz' : String(n));

function TariffDialog({ tariff, onClose }: { tariff?: Tariff; onClose: () => void }) {
  const { create, update } = tariffHooks.useMutations();
  const { register, handleSubmit, control, setError, watch, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: tariff ? {
      code: tariff.code, name: tariff.name, description: tariff.description, price_monthly: String(tariff.price_monthly),
      price_monthly_original: String(tariff.price_monthly_original ?? 0),
      allow_pickup: tariff.allow_pickup, allow_dine_in: tariff.allow_dine_in, allow_qr_menu: tariff.allow_qr_menu ?? false, max_tables: tariff.max_tables?.toString() ?? '',
      tables_per_filial: tariff.tables_per_filial ?? true,
      max_filials: tariff.max_filials?.toString() ?? '', max_products: tariff.max_products?.toString() ?? '',
      max_couriers: tariff.max_couriers?.toString() ?? '', free_orders_monthly: tariff.free_orders_monthly?.toString() ?? '',
      extra_order_fee: String(tariff.extra_order_fee ?? 0), listing_priority: String(tariff.listing_priority ?? 0),
      priority_support: tariff.priority_support ?? false,
      is_default: tariff.is_default, is_active: tariff.is_active, order: String(tariff.order),
    } : EMPTY,
  });
  const dineIn = watch('allow_dine_in');
  const tablesPerFilial = watch('tables_per_filial');

  const submit = handleSubmit(async (v) => {
    const body = {
      ...v, price_monthly: Number(v.price_monthly), price_monthly_original: Number(v.price_monthly_original || 0),
      order: Number(v.order), listing_priority: Number(v.listing_priority || 0), extra_order_fee: Number(v.extra_order_fee || 0),
      allow_qr_menu: v.allow_dine_in && v.allow_qr_menu,
      max_tables: v.allow_dine_in ? toNumberOrNull(v.max_tables) : null, max_filials: toNumberOrNull(v.max_filials),
      max_products: toNumberOrNull(v.max_products), max_couriers: toNumberOrNull(v.max_couriers),
      free_orders_monthly: toNumberOrNull(v.free_orders_monthly),
    };
    try {
      if (tariff) await update.mutateAsync({ id: tariff.uuid, body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      applyServerErrors(e, setError, Object.keys(EMPTY));
    }
  });
  const err = (k: keyof Values) => errors[k]?.message;

  return (
    <FormDialog open onOpenChange={onClose} onSubmit={submit} submitting={create.isPending || update.isPending}
      title={tariff ? 'Tarifni tahrirlash' : 'Yangi tarif'} description="Yetkazib berish barcha tariflarda bor.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomi" required error={err('name')}><Input {...register('name')} placeholder="Standart" /></Field>
        <Field label="Kod" required error={err('code')} hint="Masalan: standard"><Input {...register('code')} disabled={!!tariff} /></Field>
      </div>
      <Field label="Tavsif" error={err('description')}><Input {...register('description')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Oylik narx (so'm)" error={err('price_monthly')} hint="Aksiya narxi — mijoz to'laydi"><Input inputMode="numeric" {...register('price_monthly')} /></Field>
        <Field label="Aksiyagacha narx (so'm)" error={err('price_monthly_original')} hint="Chizilgan eski narx. 0 — ko'rsatilmaydi"><Input inputMode="numeric" {...register('price_monthly_original')} /></Field>
      </div>

      <Controller control={control} name="allow_pickup" render={({ field }) => (
        <SwitchField label="Olib ketish" description="Mijoz va kassa «olib ketish» buyurtmasi bera oladi" checked={field.value} onChange={field.onChange} />
      )} />
      <Controller control={control} name="allow_dine_in" render={({ field }) => (
        <SwitchField label="Zal va stollar" description="Stol qo'shish va stol buyurtmalari" checked={field.value} onChange={field.onChange} />
      )} />
      {dineIn && (
        <Controller control={control} name="allow_qr_menu" render={({ field }) => (
          <SwitchField label="Stol QR menyusi" description="Har stolga alohida QR: mijoz telefondan buyurtma beradi, ofitsiantni chaqiradi, hisobni ko'radi"
            checked={field.value} onChange={field.onChange} />
        )} />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Filial limiti" error={err('max_filials')} hint="Bosh filial bilan birga. Bo'sh — cheksiz"><Input inputMode="numeric" {...register('max_filials')} /></Field>
        <Field label="Stol limiti" error={err('max_tables')} hint={dineIn ? (tablesPerFilial ? 'Har filialga. Bo\'sh — cheksiz' : 'Jami. Bo\'sh — cheksiz') : 'Zal yoqilmagan'}><Input inputMode="numeric" disabled={!dineIn} {...register('max_tables')} /></Field>
      </div>
      {dineIn && (
        <Controller control={control} name="tables_per_filial" render={({ field }) => (
          <SwitchField label="Stol limiti har filialga" description="Yoqilgan: jami = limit × filiallar soni. O'chirilgan: umumiy jami"
            checked={field.value} onChange={field.onChange} />
        )} />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mahsulot limiti" error={err('max_products')} hint="Bo'sh — cheksiz"><Input inputMode="numeric" {...register('max_products')} /></Field>
        <Field label="Kuryer limiti" error={err('max_couriers')} hint="Bo'sh — cheksiz"><Input inputMode="numeric" {...register('max_couriers')} /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Oylik bepul buyurtma" error={err('free_orders_monthly')} hint="MilliyGo orqali. Bo'sh — cheksiz bepul"><Input inputMode="numeric" {...register('free_orders_monthly')} /></Field>
        <Field label="Ortiqcha buyurtma narxi (so'm)" error={err('extra_order_fee')} hint="Kvotadan oshgan har biri uchun"><Input inputMode="numeric" {...register('extra_order_fee')} /></Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ro'yxatda ustuvorlik" error={err('listing_priority')} hint="Katta son — mijoz ilovasida oldinroq. 0 — oddiy"><Input inputMode="numeric" {...register('listing_priority')} /></Field>
        <Field label="Tartib raqami" error={err('order')}><Input inputMode="numeric" {...register('order')} /></Field>
      </div>
      <Controller control={control} name="priority_support" render={({ field }) => (
        <SwitchField label="Ustuvor qo'llab-quvvatlash" description="24/7 ustuvor javob" checked={field.value} onChange={field.onChange} />
      )} />

      <Controller control={control} name="is_default" render={({ field }) => (
        <SwitchField label="Yangi hamkorlar uchun standart" description="Faqat bittasi standart bo'ladi" checked={field.value} onChange={field.onChange} />
      )} />
      <Controller control={control} name="is_active" render={({ field }) => (
        <SwitchField label="Faol" description="Nofaol tarifni yangi hamkorga biriktirib bo'lmaydi" checked={field.value} onChange={field.onChange} />
      )} />
    </FormDialog>
  );
}

export default function TariffsPage() {
  const { data, isLoading, error, refetch } = tariffHooks.useList({});
  const { update, remove } = tariffHooks.useMutations();
  const [edit, setEdit] = useState<Tariff | 'new' | null>(null);
  const [del, setDel] = useState<Tariff | null>(null);

  const columns: Column<Tariff>[] = [
    { key: 'name', header: 'Tarif', cell: (t) => (
      <div><div className="flex items-center gap-2 font-medium">{t.name}{t.is_default && <Pill tone="primary">Standart</Pill>}</div>
        <div className="max-w-[260px] truncate text-xs text-muted-foreground">{t.description || t.code}</div></div>) },
    { key: 'delivery', header: 'Yetkazish', cell: () => <Pill tone="success">Bor</Pill> },
    { key: 'pickup', header: 'Olib ketish', cell: (t) => <Pill tone={t.allow_pickup ? 'success' : 'muted'}>{t.allow_pickup ? 'Bor' : "Yo'q"}</Pill> },
    { key: 'dine', header: 'Zal / stollar', cell: (t) => t.allow_dine_in ? <Pill tone="success">{text(t.max_tables)} ta{t.tables_per_filial ? ' /filial' : ''} stol</Pill> : <Pill tone="muted">Yo'q</Pill> },
    { key: 'qr', header: 'Stol QR', hideBelow: 'lg', cell: (t) => <Pill tone={t.allow_qr_menu ? 'success' : 'muted'}>{t.allow_qr_menu ? 'Bor' : "Yo'q"}</Pill> },
    { key: 'filials', header: 'Filial', cell: (t) => text(t.max_filials) },
    { key: 'products', header: 'Mahsulot', hideBelow: 'lg', cell: (t) => text(t.max_products) },
    { key: 'couriers', header: 'Kuryer', hideBelow: 'lg', cell: (t) => text(t.max_couriers) },
    { key: 'orders', header: 'Bepul / oy', hideBelow: 'lg', cell: (t) => <span className="tabular-nums">{text(t.free_orders_monthly)}{t.free_orders_monthly !== null && t.extra_order_fee > 0 ? ` +${formatMoney(t.extra_order_fee)}` : ''}</span> },
    { key: 'price', header: 'Narx / oy', align: 'right', hideBelow: 'md', cell: (t) => <span className="tabular-nums">{t.price_monthly ? formatMoney(t.price_monthly) : 'Bepul'}</span> },
    { key: 'count', header: 'Hamkorlar', align: 'right', cell: (t) => <span className="tabular-nums">{t.partners_count}</span> },
    { key: 'active', header: 'Faol', cell: (t) => <Switch checked={t.is_active} onCheckedChange={(v) => update.mutate({ id: t.uuid, body: { is_active: v } })} aria-label="Faol" /> },
    { key: 'actions', header: '', align: 'right', cell: (t) => (
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setEdit(t)}>Tahrirlash</Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDel(t)}>O'chirish</Button>
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Tariflar" description="Hamkorga qaysi imkoniyatlar ochiq: olib ketish, zal/stollar, filial va stol limiti. Tarifi bo'lmagan hamkorda cheklov yo'q."
        actions={<Button onClick={() => setEdit('new')}><Plus className="mr-2 size-4" />Yangi tarif</Button>} />
      <DataTable columns={columns} rows={data?.results} rowKey={(t) => t.uuid} loading={isLoading} error={error} onRetry={refetch}
        page={1} pageSize={100} total={data?.count ?? 0} onPageChange={() => undefined} emptyTitle="Tariflar yo'q" />
      {edit && <TariffDialog tariff={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} destructive confirmLabel="O'chirish" title="Tarifni o'chirish"
        description={del?.partners_count ? `«${del.name}» ${del.partners_count} ta hamkorda — avval ularni boshqa tarifga o'tkazing.` : `«${del?.name}» o'chiriladi.`}
        onConfirm={() => remove.mutateAsync(del!.uuid)} />
    </>
  );
}
