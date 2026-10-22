import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ENDPOINTS } from '@/core/config/constants';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FilterBar, FilterSelect } from '@/shared/components/Filters';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field } from '@/shared/components/Field';
import { applyServerErrors } from '@/shared/lib/formErrors';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pill } from '@/shared/components/Pill';
import { useListParams } from '@/shared/hooks/useListParams';
import { formatPhone, timeAgo } from '@/shared/lib/format';
import { PasswordDialog } from '@/features/partners/components/StaffDialogs';
import { adminHooks, type AdminAccount } from '../api';

const schema = z.object({
  full_name: z.string().trim().min(2, 'Ismni kiriting').max(100),
  phone_number: z.string().trim().min(9, 'Telefonni kiriting').max(20),
  email: z.union([z.literal(''), z.string().trim().email("Email noto'g'ri")]),
  password: z.string().min(8, 'Kamida 8 belgi'),
});
type Values = z.infer<typeof schema>;

function CreateAdminDialog({ onClose }: { onClose: () => void }) {
  const { create } = adminHooks.useMutations();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema), defaultValues: { full_name: '', phone_number: '+998', email: '', password: '' },
  });
  const submit = handleSubmit(async (v) => {
    try {
      await create.mutateAsync({ ...v, email: v.email || undefined });
      onClose();
    } catch (e) {
      applyServerErrors(e, setError, ['full_name', 'phone_number', 'email', 'password']);
    }
  });
  return (
    <FormDialog open onOpenChange={onClose} onSubmit={submit} submitting={create.isPending} title="Yangi administrator"
      description="Administrator butun panelni boshqara oladi. Faqat ishonchli xodimlarga bering.">
      <Field label="Ism" required error={errors.full_name?.message}><Input {...register('full_name')} /></Field>
      <Field label="Telefon (login)" required error={errors.phone_number?.message}><Input {...register('phone_number')} /></Field>
      <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} /></Field>
      <Field label="Parol" required error={errors.password?.message} hint="Kamida 8 belgi"><Input type="password" autoComplete="new-password" {...register('password')} /></Field>
    </FormDialog>
  );
}

export default function AdminsPage() {
  const { params, query, setFilter, setPage, setPageSize, reset, hasFilters } = useListParams();
  const { data, isLoading, isFetching, error, refetch } = adminHooks.useList(query);
  const { act } = adminHooks.useMutations();
  const [create, setCreate] = useState(false);
  const [pw, setPw] = useState<AdminAccount | null>(null);
  const [demote, setDemote] = useState<AdminAccount | null>(null);
  const [block, setBlock] = useState<AdminAccount | null>(null);
  const f = params.filters;

  const columns: Column<AdminAccount>[] = [
    { key: 'name', header: 'Administrator', cell: (a) => (
      <div><div className="flex items-center gap-2 font-medium">{a.full_name || '—'}{a.is_superuser && <Pill tone="primary">Superuser</Pill>}</div>
        <div className="text-xs text-muted-foreground">{formatPhone(a.phone_number)}{a.email && ` · ${a.email}`}</div></div>) },
    { key: 'state', header: 'Holat', cell: (a) => a.is_blocked ? <Pill tone="danger">Bloklangan</Pill> : a.is_active ? <Pill tone="success">Faol</Pill> : <Pill tone="muted">Nofaol</Pill> },
    { key: 'login', header: 'Oxirgi kirish', hideBelow: 'md', cell: (a) => (a.last_login ? timeAgo(a.last_login) : 'Kirmagan') },
    { key: 'actions', header: '', align: 'right', cell: (a) => (
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setPw(a)}><KeyRound className="mr-1.5 size-3.5" />Parol</Button>
        {a.is_blocked
          ? <Button variant="outline" size="sm" onClick={() => act.mutate({ id: a.uuid, name: 'unblock', message: 'Blok olib tashlandi' })}>Blokdan chiqarish</Button>
          : <Button variant="outline" size="sm" onClick={() => setBlock(a)}>Bloklash</Button>}
        {!a.is_superuser && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDemote(a)}>Huquqni olish</Button>}
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Administratorlar" description="Panelga kira oladigan xodimlar"
        actions={<Button onClick={() => setCreate(true)}><Plus className="mr-2 size-4" />Yangi administrator</Button>} />
      <FilterBar active={hasFilters} onReset={reset}>
        <FilterSelect label="Blok" value={f.is_blocked ?? ''} onChange={(v) => setFilter('is_blocked', v)}
          options={[{ value: 'true', label: 'Bloklangan' }, { value: 'false', label: 'Bloklanmagan' }]} />
      </FilterBar>
      <DataTable columns={columns} rows={data?.results} rowKey={(a) => a.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        page={params.page} pageSize={params.pageSize} total={data?.count ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {create && <CreateAdminDialog onClose={() => setCreate(false)} />}
      {pw && <PasswordDialog open url={`${ENDPOINTS.ADMIN.ADMINS}${pw.uuid}/set-password/`} title="Parolni yangilash" subject={pw.full_name} onOpenChange={() => setPw(null)} />}
      <ConfirmDialog open={!!block} onOpenChange={() => setBlock(null)} destructive confirmLabel="Bloklash" title="Administratorni bloklash"
        description={`${block?.full_name} panelga kira olmaydi.`} onConfirm={() => act.mutateAsync({ id: block!.uuid, name: 'block', message: 'Bloklandi' })} />
      <ConfirmDialog open={!!demote} onOpenChange={() => setDemote(null)} destructive confirmLabel="Huquqni olish" title="Administratorlikni olib tashlash"
        description={`${demote?.full_name} oddiy foydalanuvchi bo'lib qoladi.`} onConfirm={() => act.mutateAsync({ id: demote!.uuid, name: 'demote', message: 'Administratorlik olib tashlandi' })} />
    </>
  );
}
