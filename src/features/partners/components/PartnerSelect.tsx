import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { partnerHooks } from '../api';

/** Hamkor tanlagich (nom bo'yicha tartiblangan, birinchi 100 ta) */
export function PartnerSelect({ value, onChange, placeholder = 'Hamkorni tanlang' }: {
  value: string; onChange: (uuid: string) => void; placeholder?: string;
}) {
  const { data } = partnerHooks.useList({ page_size: 100, ordering: 'name' });
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {(data?.results ?? []).map((p) => <SelectItem key={p.uuid} value={p.uuid}>{p.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
