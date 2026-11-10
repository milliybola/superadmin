import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field, SwitchField } from '@/shared/components/Field';
import { Pill } from '@/shared/components/Pill';
import { PartnerSelect } from '@/features/partners/components/PartnerSelect';
import { financeApi, type Merchant, type MerchantInput } from '../api';

type Form = {
  legal_name: string; tin: string; pinfl: string;
  is_payme_enabled: boolean; payme_test_mode: boolean; payme_merchant_id: string; payme_key: string;
  is_click_enabled: boolean; click_service_id: string; click_merchant_id: string; click_merchant_user_id: string; click_secret_key: string;
  delivery_mxik_code: string; delivery_package_code: string; delivery_vat_percent: string;
};

const toForm = (m: Merchant): Form => ({
  legal_name: m.legal_name ?? '', tin: m.tin ?? '', pinfl: m.pinfl ?? '',
  is_payme_enabled: m.is_payme_enabled, payme_test_mode: m.payme_test_mode, payme_merchant_id: m.payme_merchant_id ?? '', payme_key: '',
  is_click_enabled: m.is_click_enabled, click_service_id: m.click_service_id?.toString() ?? '', click_merchant_id: m.click_merchant_id?.toString() ?? '',
  click_merchant_user_id: m.click_merchant_user_id?.toString() ?? '', click_secret_key: '',
  delivery_mxik_code: m.delivery_mxik_code ?? '', delivery_package_code: m.delivery_package_code ?? '', delivery_vat_percent: String(m.delivery_vat_percent ?? 0),
});

const num = (v: string) => (v.trim() === '' ? null : Number(v));

function KeyField({ label, isSet, value, onChange }: { label: string; isSet: boolean; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label} hint={isSet ? "Kalit saqlangan va ko'rsatilmaydi. Almashtirish uchun yangisini kiriting, aks holda bo'sh qoldiring." : 'Kalit hali kiritilmagan.'}>
      <div className="flex items-center gap-2">
        <Input type="password" autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={isSet ? '•••••••• (o\'rnatilgan)' : 'Kalitni kiriting'} />
        {isSet && <Pill tone="success"><KeyRound className="mr-1 inline size-3" />O'rnatilgan</Pill>}
      </div>
    </Field>
  );
}

/** Hamkor to'lov ulanishi: Payme/Click kalitlari (faqat yoziladi), STIR/JShShIR, yetkazish MXIK va QQS. */
export function MerchantDialog({ partnerUuid: initialPartner, onClose }: { partnerUuid: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [partnerUuid, setPartnerUuid] = useState(initialPartner ?? '');
  const [form, setForm] = useState<Form | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['merchants', 'edit', partnerUuid], queryFn: () => financeApi.merchant(partnerUuid), enabled: !!partnerUuid,
  });
  useEffect(() => { if (data) setForm(toForm(data)); }, [data]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = useMutation({
    mutationFn: (body: MerchantInput) => financeApi.saveMerchant(partnerUuid, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merchants'] });
      toast.success("To'lov ulanishi saqlandi");
      onClose();
    },
  });

  const submit = () => {
    if (!form) return;
    const body: MerchantInput = {
      legal_name: form.legal_name.trim(), tin: form.tin.trim(), pinfl: form.pinfl.trim(),
      is_payme_enabled: form.is_payme_enabled, payme_test_mode: form.payme_test_mode, payme_merchant_id: form.payme_merchant_id.trim(),
      is_click_enabled: form.is_click_enabled, click_service_id: num(form.click_service_id), click_merchant_id: num(form.click_merchant_id),
      click_merchant_user_id: num(form.click_merchant_user_id),
      delivery_mxik_code: form.delivery_mxik_code.trim(), delivery_package_code: form.delivery_package_code.trim(),
      delivery_vat_percent: Number(form.delivery_vat_percent),
    };
    // Bo'sh kalit yuborilmaydi — saqlangan kalit o'zgarmaydi
    if (form.payme_key.trim()) body.payme_key = form.payme_key.trim();
    if (form.click_secret_key.trim()) body.click_secret_key = form.click_secret_key.trim();
    save.mutate(body);
  };

  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} wide submitting={save.isPending}
      title={data?.partner.name ? `To'lov ulanishi — ${data.partner.name}` : "To'lov ulanishi"}
      description="Kalitlar shifrlangan saqlanadi va qayta ko'rsatilmaydi. Har o'zgarish audit jurnaliga (qiymatsiz) yoziladi."
      onSubmit={(e) => { e.preventDefault(); submit(); }}>
      {!initialPartner && (
        <Field label="Hamkor" required><PartnerSelect value={partnerUuid} onChange={setPartnerUuid} /></Field>
      )}
      {!partnerUuid ? null : isLoading || !form ? <Skeleton className="h-64" /> : (
        <>
          <div className="text-sm font-medium">Yuridik ma'lumot (fiskal chek shu STIR bilan chiqadi)</div>
          <Field label="Yuridik nomi"><Input value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} maxLength={255} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="STIR (9 raqam)"><Input inputMode="numeric" value={form.tin} onChange={(e) => set('tin', e.target.value)} maxLength={9} /></Field>
            <Field label="JShShIR (YaTT, 14 raqam)"><Input inputMode="numeric" value={form.pinfl} onChange={(e) => set('pinfl', e.target.value)} maxLength={14} /></Field>
          </div>

          <div className="pt-2 text-sm font-medium">Payme</div>
          <SwitchField label="Payme yoqilgan" checked={form.is_payme_enabled} onChange={(v) => set('is_payme_enabled', v)}
            description="Yoqish uchun merchant ID va kalit kerak" />
          <SwitchField label="Test rejimi" checked={form.payme_test_mode} onChange={(v) => set('payme_test_mode', v)}
            description="Haqiqiy to'lovlar uchun o'chiring" />
          <Field label="Merchant ID"><Input value={form.payme_merchant_id} onChange={(e) => set('payme_merchant_id', e.target.value)} maxLength={64} /></Field>
          <KeyField label="Payme kaliti" isSet={!!data?.payme_key_set} value={form.payme_key} onChange={(v) => set('payme_key', v)} />

          <div className="pt-2 text-sm font-medium">Click</div>
          <SwitchField label="Click yoqilgan" checked={form.is_click_enabled} onChange={(v) => set('is_click_enabled', v)}
            description="Yoqish uchun barcha ID'lar, secret key va STIR yoki JShShIR kerak" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Service ID"><Input inputMode="numeric" value={form.click_service_id} onChange={(e) => set('click_service_id', e.target.value)} /></Field>
            <Field label="Merchant ID"><Input inputMode="numeric" value={form.click_merchant_id} onChange={(e) => set('click_merchant_id', e.target.value)} /></Field>
            <Field label="Merchant user ID"><Input inputMode="numeric" value={form.click_merchant_user_id} onChange={(e) => set('click_merchant_user_id', e.target.value)} /></Field>
          </div>
          <KeyField label="Click secret key" isSet={!!data?.click_secret_key_set} value={form.click_secret_key} onChange={(v) => set('click_secret_key', v)} />

          <div className="pt-2 text-sm font-medium">Yetkazib berish xizmati (fiskal chek)</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="MXIK kodi (17 raqam)"><Input inputMode="numeric" value={form.delivery_mxik_code} onChange={(e) => set('delivery_mxik_code', e.target.value)} maxLength={17} /></Field>
            <Field label="Qadoq kodi"><Input value={form.delivery_package_code} onChange={(e) => set('delivery_package_code', e.target.value)} maxLength={20} /></Field>
            <Field label="QQS">
              <Select value={form.delivery_vat_percent} onValueChange={(v) => set('delivery_vat_percent', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="0">QQSsiz (0%)</SelectItem><SelectItem value="12">QQS 12%</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
        </>
      )}
    </FormDialog>
  );
}
