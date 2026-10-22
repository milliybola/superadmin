import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { Switch } from '@/components/ui/switch';
import { cuisineHooks, type Cuisine } from '../api';

const schema = z.object({
  name: z.string().trim().min(2, 'Nomini kiriting').max(60),
  order: z.string().refine((v) => /^\d{1,4}$/.test(v), 'Butun son kiriting'),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;

function CuisineDialog({ cuisine, onClose }: { cuisine?: Cuisine; onClose: () => void }) {
  const { create, update } = cuisineHooks.useMutations();
  const { register, handleSubmit, control, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: cuisine ? { name: cuisine.name, order: String(cuisine.order ?? 0), is_active: cuisine.is_active ?? true } : { name: '', order: '0', is_active: true },
  });
  const submit = handleSubmit(async (v) => {
    const body = { ...v, order: Number(v.order) };
    try {
      if (cuisine) await update.mutateAsync({ id: cuisine.uuid, body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      applyServerErrors(e, setError, ['name', 'order']);
    }
  });
  return (
    <FormDialog open onOpenChange={onClose} onSubmit={submit} submitting={create.isPending || update.isPending}
      title={cuisine ? 'Turni tahrirlash' : 'Yangi oshxona turi'}>
      <Field label="Nomi" required error={errors.name?.message}><Input {...register('name')} placeholder="Masalan: Palov" /></Field>
      <Field label="Tartib raqami" error={errors.order?.message} hint="Kichik raqam ro'yxatda birinchi chiqadi"><Input inputMode="numeric" {...register('order')} /></Field>
      <Controller control={control} name="is_active" render={({ field }) => (
        <SwitchField label="Faol" description="Nofaol tur mijozlarga ko'rsatilmaydi" checked={field.value} onChange={field.onChange} />
      )} />
    </FormDialog>
  );
}

export default function CuisinesPage() {
  const { data, isLoading, error, refetch } = cuisineHooks.useList({ page_size: 100 });
  const { update, remove } = cuisineHooks.useMutations();
  const [edit, setEdit] = useState<Cuisine | 'new' | null>(null);
  const [del, setDel] = useState<Cuisine | null>(null);

  const columns: Column<Cuisine>[] = [
    { key: 'order', header: '#', cell: (c) => <span className="text-muted-foreground tabular-nums">{c.order}</span> },
    { key: 'name', header: 'Nomi', cell: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'count', header: 'Restoranlar', align: 'right', cell: (c) => <span className="tabular-nums">{c.partners_count}</span> },
    { key: 'active', header: 'Holat', cell: (c) => (
      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
        <Switch checked={!!c.is_active} onCheckedChange={(v) => update.mutate({ id: c.uuid, body: { is_active: v } })} aria-label="Faol" />
        {!c.is_active && <Pill tone="muted">Nofaol</Pill>}
      </div>) },
    { key: 'actions', header: '', align: 'right', cell: (c) => (
      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" onClick={() => setEdit(c)}>Tahrirlash</Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDel(c)}>O'chirish</Button>
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Oshxona turlari" description="Restoran turlari: O'zbek, Fast food, Palov va h.k. Mijoz ilovasidagi filtr shundan olinadi."
        actions={<Button onClick={() => setEdit('new')}><Plus className="mr-2 size-4" />Yangi tur</Button>} />
      <DataTable columns={columns} rows={data?.results} rowKey={(c) => c.uuid} loading={isLoading} error={error} onRetry={refetch}
        page={1} pageSize={100} total={data?.count ?? 0} onPageChange={() => undefined} emptyTitle="Turlar yo'q" />
      {edit && <CuisineDialog cuisine={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} destructive confirmLabel="O'chirish" title="Turni o'chirish"
        description={del?.partners_count ? `«${del.name}» ${del.partners_count} ta restoranga biriktirilgan — ulardan olib tashlanadi.` : `«${del?.name}» o'chiriladi.`}
        onConfirm={() => remove.mutateAsync(del!.uuid)} />
    </>
  );
}
