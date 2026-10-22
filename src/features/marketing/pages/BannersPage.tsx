import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/shared/components/PageHeader';
import { FilterBar, FilterSelect } from '@/shared/components/Filters';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { ImageInput } from '@/shared/components/ImageInput';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState, ErrorState } from '@/shared/components/State';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatDate } from '@/shared/lib/format';
import { PartnerSelect } from '@/features/partners/components/PartnerSelect';
import { bannerHooks, type Banner } from '../api';

const schema = z.object({
  title: z.string().trim().min(2, 'Sarlavhani kiriting').max(200),
  description: z.string().trim().max(200),
  partner: z.string().min(1, 'Hamkorni tanlang'),
  end_date: z.string(),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;
const EMPTY: Values = { title: '', description: '', partner: '', end_date: '', is_active: true };

function BannerDialog({ banner, onClose }: { banner?: Banner; onClose: () => void }) {
  const { create, update } = bannerHooks.useMutations();
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const { register, handleSubmit, control, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: banner ? { title: banner.title, description: banner.description, partner: banner.partner, end_date: banner.end_date ?? '', is_active: banner.is_active } : EMPTY,
  });

  const submit = handleSubmit(async (v) => {
    if (!banner && !image) return setImageError('Banner rasmini yuklang.');
    let body: unknown = { ...v, end_date: v.end_date || null };
    if (image) {
      const fd = new FormData();
      Object.entries(v).forEach(([k, val]) => fd.append(k, String(val)));
      if (!v.end_date) fd.delete('end_date');
      fd.append('image', image);
      body = fd;
    }
    try {
      if (banner) await update.mutateAsync({ id: banner.id, body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      applyServerErrors(e, setError, Object.keys(EMPTY));
    }
  });

  return (
    <FormDialog open onOpenChange={onClose} onSubmit={submit} submitting={create.isPending || update.isPending}
      title={banner ? 'Bannerni tahrirlash' : 'Yangi banner'}>
      <Field label="Rasm" required error={imageError} hint="Ko'pi bilan 5 MB. Tavsiya: 16:9 nisbat.">
        <ImageInput current={banner?.image} onChange={(f) => { setImage(f); setImageError(''); }} label="Banner rasmini yuklash" />
      </Field>
      <Field label="Sarlavha" required error={errors.title?.message}><Input {...register('title')} /></Field>
      <Field label="Qisqa tavsif" error={errors.description?.message}><Input {...register('description')} /></Field>
      <Field label="Hamkor" required error={errors.partner?.message} hint="Banner bosilganda shu hamkorga o'tadi">
        <Controller control={control} name="partner" render={({ field }) => <PartnerSelect value={field.value} onChange={field.onChange} />} />
      </Field>
      <Field label="Tugash sanasi" error={errors.end_date?.message} hint="Bo'sh — muddatsiz"><Input type="date" {...register('end_date')} /></Field>
      <Controller control={control} name="is_active" render={({ field }) => <SwitchField label="Faol" checked={field.value} onChange={field.onChange} />} />
    </FormDialog>
  );
}

export default function BannersPage() {
  const { params, query, setFilter, reset, hasFilters } = useListParams({ pageSize: 48 });
  const { data, isLoading, error, refetch } = bannerHooks.useList(query);
  const { update, remove } = bannerHooks.useMutations();
  const [edit, setEdit] = useState<Banner | 'new' | null>(null);
  const [del, setDel] = useState<Banner | null>(null);
  const f = params.filters;
  const expired = (b: Banner) => !!b.end_date && b.end_date < new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Bannerlar" description="Mijoz ilovasi bosh sahifasidagi reklama bannerlari"
        actions={<Button onClick={() => setEdit('new')}><Plus className="mr-2 size-4" />Yangi banner</Button>} />
      <FilterBar active={hasFilters} onReset={reset}>
        <FilterSelect label="Holat" value={f.is_active ?? ''} onChange={(v) => setFilter('is_active', v)}
          options={[{ value: 'true', label: 'Faol' }, { value: 'false', label: 'Nofaol' }]} />
      </FilterBar>

      {error && !data && <ErrorState onRetry={refetch} />}
      {isLoading && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>}
      {data?.results.length === 0 && <Card><EmptyState title="Bannerlar yo'q" description="Birinchi bannerni qo'shing." /></Card>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.results.map((b) => (
          <Card key={b.id} className="overflow-hidden">
            <div className="aspect-video bg-muted">
              {b.image ? <img src={b.image} alt={b.title} className="size-full object-cover" /> : <ImageIcon className="m-auto size-8 text-muted-foreground" />}
            </div>
            <div className="space-y-3 p-4">
              <div>
                <div className="flex items-center gap-2 font-medium">{b.title}{expired(b) && <Pill tone="muted">Muddati tugagan</Pill>}</div>
                <div className="text-sm text-muted-foreground">{b.partner_name}</div>
                <div className="text-xs text-muted-foreground">{formatDate(b.start_date)} — {b.end_date ? formatDate(b.end_date) : 'muddatsiz'}</div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={b.is_active} onCheckedChange={(v) => update.mutate({ id: b.id, body: { is_active: v } })} />
                  {b.is_active ? 'Faol' : 'Nofaol'}
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEdit(b)}>Tahrirlash</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDel(b)}>O'chirish</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {edit && <BannerDialog banner={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onOpenChange={() => setDel(null)} destructive confirmLabel="O'chirish" title="Bannerni o'chirish"
        description={`«${del?.title}» butunlay o'chiriladi.`} onConfirm={() => remove.mutateAsync(del!.id)} />
    </>
  );
}
