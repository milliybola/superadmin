import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ImageIcon, Plus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/shared/components/PageHeader';
import { FilterBar, FilterSelect, SearchInput } from '@/shared/components/Filters';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { ImageInput } from '@/shared/components/ImageInput';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState, ErrorState } from '@/shared/components/State';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { applyLibrary, libraryHooks, type LibraryImage } from '../api';

const TYPES = [
  { value: 'ALL', label: 'Hammasi' },
  { value: 'RESTAURANT', label: 'Restoran' },
  { value: 'SHOP', label: "Do'kon" },
];

const schema = z.object({
  name: z.string().trim().min(2, 'Nomini kiriting').max(120),
  keywords: z.string().trim().max(1000),
  partner_type: z.enum(['ALL', 'RESTAURANT', 'SHOP']),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;
const EMPTY: Values = { name: '', keywords: '', partner_type: 'ALL', is_active: true };

function LibraryDialog({ item, onClose }: { item?: LibraryImage; onClose: () => void }) {
  const { create, update } = libraryHooks.useMutations();
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const { register, handleSubmit, control, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: item
      ? { name: item.name, keywords: item.keywords, partner_type: item.partner_type, is_active: item.is_active }
      : EMPTY,
  });

  const submit = handleSubmit(async (v) => {
    if (!item && !image) return setImageError('Rasmni yuklang.');
    let body: unknown = v;
    if (image) {
      const fd = new FormData();
      Object.entries(v).forEach(([k, val]) => fd.append(k, String(val)));
      fd.append('image', image);
      body = fd;
    }
    try {
      if (item) await update.mutateAsync({ id: item.uuid, body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      applyServerErrors(e, setError, Object.keys(EMPTY));
    }
  });

  return (
    <FormDialog open onOpenChange={onClose} onSubmit={submit} submitting={create.isPending || update.isPending}
      title={item ? 'Rasmni tahrirlash' : 'Yangi default rasm'}>
      <Field label="Rasm" required error={imageError} hint="Mahsulot kartasida ko'rinadi. Serverda avtomatik siqiladi.">
        <ImageInput current={item?.image} onChange={(f) => { setImage(f); setImageError(''); }} label="Rasm yuklash" />
      </Field>
      <Field label="Nomi" required error={errors.name?.message}><Input {...register('name')} placeholder="Coca Cola" /></Field>
      <Field label="Kalit so'zlar" error={errors.keywords?.message}
        hint="Vergul bilan: coca cola, ko'la, kola. Mahsulot nomida shu so'z butunligicha uchrasa rasm biriktiriladi. Bo'sh — nomning o'zi ishlatiladi.">
        <Input {...register('keywords')} placeholder="coca cola, ko'la, kola" />
      </Field>
      <Field label="Qayerda ishlaydi">
        <Controller control={control} name="partner_type" render={({ field }) => (
          <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        )} />
      </Field>
      <Controller control={control} name="is_active" render={({ field }) => <SwitchField label="Faol" checked={field.value} onChange={field.onChange} />} />
    </FormDialog>
  );
}

export default function ImageLibraryPage() {
  const { params, query, setFilter, reset, hasFilters } = useListParams({ pageSize: 48 });
  const { data, isLoading, error, refetch } = libraryHooks.useList(query);
  const { update, remove } = libraryHooks.useMutations();
  const [edit, setEdit] = useState<LibraryImage | 'new' | null>(null);
  const [del, setDel] = useState<LibraryImage | null>(null);
  const [confirmApply, setConfirmApply] = useState(false);
  const f = params.filters;

  const apply = useMutation({
    mutationFn: applyLibrary,
    onSuccess: (r) =>
      toast.success(r.attached > 0 ? `${r.attached} ta mahsulotga rasm biriktirildi` : 'Mos keladigan rasmsiz mahsulot topilmadi'),
  });

  const typeLabel = (t: LibraryImage['partner_type']) => TYPES.find((x) => x.value === t)?.label ?? t;

  return (
    <>
      <PageHeader title="Default rasmlar"
        description="Rasmsiz yaratilgan mahsulotga (qo'lda yoki Excel import) nomiga mos rasm avtomatik biriktiriladi"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmApply(true)} disabled={apply.isPending}>
              <Wand2 className="mr-2 size-4" />Rasmsizlarga qo'llash
            </Button>
            <Button onClick={() => setEdit('new')}><Plus className="mr-2 size-4" />Yangi rasm</Button>
          </div>
        } />
      <FilterBar active={hasFilters} onReset={reset}>
        <SearchInput value={f.search ?? ''} onChange={(v) => setFilter('search', v)} placeholder="Nomi yoki kalit so'z..." className="w-[260px]" />
        <FilterSelect label="Turi" value={f.partner_type ?? ''} onChange={(v) => setFilter('partner_type', v)} options={TYPES} />
        <FilterSelect label="Holat" value={f.is_active ?? ''} onChange={(v) => setFilter('is_active', v)}
          options={[{ value: 'true', label: 'Faol' }, { value: 'false', label: 'Nofaol' }]} />
      </FilterBar>

      {error && !data && <ErrorState onRetry={refetch} />}
      {isLoading && <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-56" />)}</div>}
      {data?.results.length === 0 && (
        <Card><EmptyState title="Kutubxona bo'sh"
          description="Coca Cola, Fanta, suv kabi ko'p uchraydigan mahsulotlar uchun rasm qo'shing — yangi hamkor menyusi o'zi bezaladi." /></Card>
      )}
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {data?.results.map((it) => (
          <Card key={it.uuid} className="overflow-hidden">
            <div className="aspect-square bg-muted">
              {it.image ? <img src={it.image} alt={it.name} className="size-full object-cover" /> : <ImageIcon className="m-auto size-8 text-muted-foreground" />}
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate font-medium">{it.name}</div>
                {it.partner_type !== 'ALL' && <Pill tone="muted">{typeLabel(it.partner_type)}</Pill>}
              </div>
              <div className="line-clamp-2 min-h-8 text-xs text-muted-foreground">{it.keywords || it.name}</div>
              <div className="flex items-center justify-between">
                <Switch checked={it.is_active} onCheckedChange={(v) => update.mutate({ id: it.uuid, body: { is_active: v } })} />
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setEdit(it)}>Tahrirlash</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDel(it)}>O'chirish</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {edit && <LibraryDialog item={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} destructive confirmLabel="O'chirish" title="Rasmni o'chirish"
        description={`«${del?.name}» kutubxonadan o'chiriladi. Avval biriktirilgan mahsulot rasmlariga ta'sir qilmaydi.`}
        onConfirm={() => remove.mutateAsync(del!.uuid)} />
      <ConfirmDialog open={confirmApply} onOpenChange={setConfirmApply} confirmLabel="Qo'llash"
        title="Rasmsiz mahsulotlarga qo'llash"
        description="Barcha hamkorlardagi rasmsiz mahsulotlar tekshiriladi: nomi kutubxonadagi kalit so'zlarga mos kelsa rasm biriktiriladi. Mavjud rasmlarga tegilmaydi."
        onConfirm={() => apply.mutateAsync()} />
    </>
  );
}
