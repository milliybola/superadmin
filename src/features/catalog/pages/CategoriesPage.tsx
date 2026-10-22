import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { ChipTabs, FilterBar, SearchInput } from '@/shared/components/Filters';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { ImageInput } from '@/shared/components/ImageInput';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { PARTNER_TYPE_LABELS } from '@/features/partners/constants';
import { categoryHooks, type Category } from '../api';

const schema = z.object({
  name: z.string().trim().min(2, 'Nomini kiriting').max(120),
  partner_type: z.enum(['RESTAURANT', 'SHOP']),
  category_type: z.enum(['main', 'extra']),
  description: z.string().max(1000),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;
const EMPTY: Values = { name: '', partner_type: 'RESTAURANT', category_type: 'main', description: '', is_active: true };

const CATEGORY_TYPES: Record<string, string> = { main: 'Asosiy', extra: "Qo'shimcha (add-on)" };

function CategoryDialog({ category, onClose }: { category?: Category; onClose: () => void }) {
  const { create, update } = categoryHooks.useMutations();
  const [logo, setLogo] = useState<File | null>(null);
  const { register, handleSubmit, control, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: category ? { name: category.name, partner_type: category.partner_type, category_type: category.category_type, description: category.description ?? '', is_active: category.is_active } : EMPTY,
  });

  const submit = handleSubmit(async (v) => {
    let body: unknown = v;
    if (logo) {
      const fd = new FormData();
      Object.entries(v).forEach(([k, val]) => fd.append(k, String(val)));
      fd.append('logo', logo);
      body = fd;
    }
    try {
      if (category) await update.mutateAsync({ id: category.uuid, body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      applyServerErrors(e, setError, Object.keys(EMPTY));
    }
  });

  return (
    <FormDialog open onOpenChange={onClose} onSubmit={submit} submitting={create.isPending || update.isPending}
      title={category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}>
      <Field label="Nomi" required error={errors.name?.message}><Input {...register('name')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Qaysi hamkorlar uchun">
          <Controller control={control} name="partner_type" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries({ RESTAURANT: 'Restoranlar', SHOP: "Do'konlar" }).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </Field>
        <Field label="Turi">
          <Controller control={control} name="category_type" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CATEGORY_TYPES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </Field>
      </div>
      <Field label="Tavsif" error={errors.description?.message}><Textarea rows={2} {...register('description')} /></Field>
      <Field label="Logo"><ImageInput current={category?.logo} onChange={setLogo} aspect="aspect-square max-w-[140px]" label="Logo yuklash" /></Field>
      <Controller control={control} name="is_active" render={({ field }) => (
        <SwitchField label="Faol" checked={field.value} onChange={field.onChange} />
      )} />
    </FormDialog>
  );
}

export default function CategoriesPage() {
  const { params, query, setFilter, setPage, setPageSize, setOrdering, reset, hasFilters } = useListParams({ ordering: 'name' });
  const { data, isLoading, isFetching, error, refetch } = categoryHooks.useList(query);
  const { update, remove } = categoryHooks.useMutations();
  const [edit, setEdit] = useState<Category | 'new' | null>(null);
  const [del, setDel] = useState<Category | null>(null);
  const f = params.filters;

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Kategoriya', sortKey: 'name', cell: (c) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-9 rounded-lg border">
          <AvatarImage src={c.logo ?? undefined} alt="" />
          <AvatarFallback className="rounded-lg bg-primary/10 text-xs text-primary">{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{c.name}</span>
      </div>) },
    { key: 'type', header: 'Turi', hideBelow: 'md', cell: (c) => (
      <div className="text-sm">{PARTNER_TYPE_LABELS[c.partner_type]} · <span className="text-muted-foreground">{CATEGORY_TYPES[c.category_type] ?? c.category_type}</span></div>) },
    { key: 'count', header: 'Hamkorlar', sortKey: 'partners_count', align: 'right', cell: (c) => <span className="tabular-nums">{c.partners_count}</span> },
    { key: 'active', header: 'Holat', cell: (c) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Switch checked={c.is_active} onCheckedChange={(v) => update.mutate({ id: c.uuid, body: { is_active: v } })} aria-label="Faol" />
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
      <PageHeader title="Kategoriyalar" description="Hamkorlar ulanadigan bazaviy kategoriyalar"
        actions={<Button onClick={() => setEdit('new')}><Plus className="mr-2 size-4" />Yangi kategoriya</Button>} />
      <div className="mb-4">
        <ChipTabs value={f.partner_type ?? ''} onChange={(v) => setFilter('partner_type', v)}
          items={[{ value: '', label: 'Hammasi' }, { value: 'RESTAURANT', label: 'Restoranlar' }, { value: 'SHOP', label: "Do'konlar" }]} />
      </div>
      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Nomi bo'yicha..." className="w-[260px]" />
      </FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(c) => c.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        ordering={params.ordering} onOrderingChange={setOrdering}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize}
        emptyTitle="Kategoriyalar yo'q" />
      {edit && <CategoryDialog category={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} destructive confirmLabel="O'chirish" title="Kategoriyani o'chirish"
        description={del?.partners_count ? `Kategoriyani ${del.partners_count} ta hamkor ishlatadi — o'chirib bo'lmaydi, nofaol qiling.` : `«${del?.name}» o'chiriladi.`}
        onConfirm={() => remove.mutateAsync(del!.uuid)} />
    </>
  );
}
