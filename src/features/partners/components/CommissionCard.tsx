import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field } from '@/shared/components/Field';
import { InfoRow, Section } from '@/shared/components/InfoRow';
import { formatMoney } from '@/shared/lib/format';
import { getCommission, type Commission } from '../api';

export function CommissionCard({ partnerUuid }: { partnerUuid: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Commission['commission_type']>('percentage');
  const [value, setValue] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['partners', 'commission', partnerUuid], queryFn: () => getCommission(partnerUuid) });

  const save = useMutation({
    mutationFn: (body: Partial<Commission>) => apiClient.put(`${ENDPOINTS.ADMIN.PARTNERS}${partnerUuid}/commission/`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
      toast.success('Komissiya saqlandi');
      setOpen(false);
    },
  });

  const edit = () => {
    setType(data?.commission_type ?? 'percentage');
    setValue((data?.commission_type === 'fixed' ? data.fixed_amount : data?.percentage)?.toString() ?? '');
    setOpen(true);
  };
  const n = Number(value);
  const invalid = value === '' || Number.isNaN(n) || n < 0 || (type === 'percentage' && n > 100);

  return (
    <>
      <Section title="Komissiya" action={<Button variant="ghost" size="sm" onClick={edit}><Pencil className="mr-1.5 size-3.5" />O'zgartirish</Button>}>
        {isLoading ? <p className="py-3 text-sm text-muted-foreground">Yuklanmoqda...</p> : !data ? (
          <p className="py-3 text-sm text-muted-foreground">Komissiya belgilanmagan — platforma ulush olmaydi.</p>
        ) : (
          <>
            <InfoRow label="Turi">{data.commission_type === 'percentage' ? 'Foiz' : 'Qat\'iy summa'}</InfoRow>
            <InfoRow label="Miqdor">{data.commission_type === 'percentage' ? `${data.percentage}%` : `${formatMoney(data.fixed_amount)} / buyurtma`}</InfoRow>
          </>
        )}
      </Section>

      <FormDialog open={open} onOpenChange={setOpen} title="Komissiya" description="Yetkazilgan buyurtmalar uchun platforma ulushi"
        submitting={save.isPending} onSubmit={(e) => {
          e.preventDefault();
          if (invalid) return;
          save.mutate(type === 'percentage' ? { commission_type: type, percentage: n } : { commission_type: type, fixed_amount: n });
        }}>
        <Field label="Turi">
          <Select value={type} onValueChange={(v) => setType(v as Commission['commission_type'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Foiz (mahsulotlar summasidan)</SelectItem>
              <SelectItem value="fixed">Qat'iy summa (har bir buyurtmadan)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={type === 'percentage' ? 'Foiz (%)' : "Summa (so'm)"} required
          error={value !== '' && invalid ? (type === 'percentage' ? "0 dan 100 gacha son" : "Musbat son") : undefined}>
          <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
      </FormDialog>
    </>
  );
}
