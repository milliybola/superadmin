import { useState } from 'react';
import { Banknote, Gift, MinusCircle, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { FormDialog } from '@/shared/components/FormDialog';
import { Field } from '@/shared/components/Field';
import { FilterSelect } from '@/shared/components/Filters';
import { Pill } from '@/shared/components/Pill';
import { StatCard } from '@/shared/components/StatCard';
import { formatDateTime, formatMoney } from '@/shared/lib/format';
import type { CourierDetail, Transaction } from '../api';
import { TX_TYPES } from '../constants';
import { useAddTransaction, useCourierTransactions } from '../hooks';

type Kind = 'PAYOUT' | 'BONUS' | 'PENALTY' | 'ADJUSTMENT';

const KIND_TEXT: Record<Kind, { title: string; hint: string; button: string }> = {
  PAYOUT: { title: "To'lov berish", hint: "Kuryerga naqd/kartaga berilgan summa balansdan ayriladi.", button: "To'lov berildi" },
  BONUS: { title: 'Mukofot qo\'shish', hint: 'Balansga qo\'shiladi.', button: 'Mukofot berish' },
  PENALTY: { title: 'Jarima', hint: 'Balansdan ayriladi.', button: 'Jarima qo\'yish' },
  ADJUSTMENT: { title: 'Balansni tuzatish', hint: "Xatolarni to'g'rilash uchun. Kamaytirish uchun manfiy son kiriting (masalan -5000).", button: 'Tuzatish' },
};

function TransactionDialog({ courier, kind, onClose }: { courier: CourierDetail; kind: Kind; onClose: () => void }) {
  const add = useAddTransaction(courier.uuid);
  const [amount, setAmount] = useState(kind === 'PAYOUT' && courier.balance > 0 ? String(courier.balance) : '');
  const [note, setNote] = useState('');
  const n = Number(amount);
  const invalid = amount === '' || Number.isNaN(n) || n === 0 || (kind !== 'ADJUSTMENT' && n < 0) || !note.trim();
  const overdraw = kind === 'PAYOUT' && n > courier.balance;
  const t = KIND_TEXT[kind];

  return (
    <FormDialog open onOpenChange={onClose} title={t.title} description={`${courier.full_name} · balans: ${formatMoney(courier.balance)}`}
      submitting={add.isPending} submitLabel={t.button}
      onSubmit={(e) => {
        e.preventDefault();
        if (invalid || overdraw) return;
        add.mutate({ type: kind, amount: n, note: note.trim() }, { onSuccess: onClose });
      }}>
      <Field label="Summa (so'm)" required hint={t.hint} error={overdraw ? "To'lov balansdan oshib ketdi" : undefined}>
        <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      </Field>
      <Field label="Izoh" required hint="Jurnalda saqlanadi va kuryerga ko'rsatiladi">
        <Textarea rows={2} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </FormDialog>
  );
}

/** Kuryer hisobi: balans, to'langan summa va barcha o'zgarishlar jurnali (ledger). */
export function FinanceTab({ courier }: { courier: CourierDetail }) {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Kind | null>(null);
  const { data, isLoading, isFetching, error, refetch } = useCourierTransactions(courier.uuid, { page, page_size: 20, ...(type ? { type } : {}) });

  const columns: Column<Transaction>[] = [
    { key: 'date', header: 'Sana', cell: (t) => <span className="whitespace-nowrap text-sm">{formatDateTime(t.created_at)}</span> },
    { key: 'type', header: 'Turi', cell: (t) => <Pill tone={TX_TYPES[t.type]?.tone ?? 'muted'}>{t.type_label}</Pill> },
    {
      key: 'note', header: 'Izoh', hideBelow: 'md',
      cell: (t) => (
        <div className="max-w-[320px] text-sm">
          {t.order ? <Link className="text-primary hover:underline" to={`/orders/${t.order.uuid}`}>{t.note || t.order.number}</Link> : (t.note || '—')}
          {t.created_by_name && <div className="text-xs text-muted-foreground">{t.created_by_name}</div>}
        </div>
      ),
    },
    { key: 'amount', header: 'Summa', align: 'right', cell: (t) => <span className={`font-medium tabular-nums ${t.amount < 0 ? 'text-destructive' : 'text-emerald-600'}`}>{t.amount > 0 ? '+' : ''}{formatMoney(t.amount)}</span> },
    { key: 'after', header: 'Qoldiq', align: 'right', hideBelow: 'lg', cell: (t) => <span className="tabular-nums text-muted-foreground">{formatMoney(t.balance_after)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Banknote} tone={courier.balance > 0 ? 'warning' : 'success'} label="Hozirgi balans" value={formatMoney(courier.balance)} hint="kuryerga to'lanishi kerak" />
        <StatCard icon={Banknote} tone="info" label="Jami ishlagan" value={formatMoney(courier.total_earnings)} hint={`${courier.total_deliveries} ta yetkazish`} />
        <StatCard icon={Banknote} tone="success" label="Jami to'langan" value={formatMoney(courier.stats.paid_out)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setDialog('PAYOUT')} disabled={courier.balance <= 0}><Banknote className="mr-2 size-4" />To'lov berish</Button>
        <Button variant="outline" onClick={() => setDialog('BONUS')}><Gift className="mr-2 size-4" />Mukofot</Button>
        <Button variant="outline" onClick={() => setDialog('PENALTY')}><MinusCircle className="mr-2 size-4" />Jarima</Button>
        <Button variant="ghost" onClick={() => setDialog('ADJUSTMENT')}><Scale className="mr-2 size-4" />Tuzatish</Button>
        <div className="ml-auto">
          <FilterSelect label="Turi" value={type} onChange={(v) => { setType(v); setPage(1); }}
            options={Object.entries(TX_TYPES).map(([value, x]) => ({ value, label: x.label }))} />
        </div>
      </div>

      <DataTable columns={columns} rows={data?.results} rowKey={(t) => t.uuid} loading={isLoading || isFetching} error={error} onRetry={refetch}
        page={page} pageSize={20} total={data?.count ?? 0} onPageChange={setPage} emptyTitle="Yozuvlar yo'q" emptyDescription="Yetkazilgan buyurtmalar va to'lovlar shu yerda ko'rinadi." />

      {dialog && <TransactionDialog courier={courier} kind={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
