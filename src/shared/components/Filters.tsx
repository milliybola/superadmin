import { useEffect, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDebounced } from '../hooks/useDebounced';

/** Qidiruv: yozishni to'xtatgandan keyin (350 ms) `onChange` chaqiriladi */
export function SearchInput({ value, onChange, placeholder = 'Qidirish...', className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const debounced = useDebounced(text);

  // URLdagi qiymat tashqaridan o'zgarsa (filtrlarni tozalash) maydon ham yangilanadi
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value);
  }
  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="pl-9 pr-8" />
      {text && (
        <button type="button" onClick={() => { setText(''); onChange(''); }} aria-label="Tozalash"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

const ALL = '__all__';

/** "Hammasi" bilan filtr tanlagich; bo'sh qiymat = filtr yo'q */
export function FilterSelect({ value, onChange, options, label, className }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string; className?: string;
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
      <SelectTrigger className={cn('w-[170px]', value && 'border-primary/50 bg-primary/5', className)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: hammasi</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function DateField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="whitespace-nowrap">{label}</span>
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={cn('w-[150px]', value && 'border-primary/50 bg-primary/5')} />
    </label>
  );
}

/** Tez filtr tugmalari (masalan buyurtma holatlari): bittasi faol yoki hech biri */
export function ChipTabs({ value, onChange, items }: {
  value: string; onChange: (v: string) => void; items: { value: string; label: ReactNode; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button key={it.value} type="button" onClick={() => onChange(it.value)}
            className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
              active ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
            {it.label}
            {it.count !== undefined && <span className={cn('rounded-full px-1.5 text-xs tabular-nums', active ? 'bg-primary/20' : 'bg-muted')}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function FilterBar({ children, onReset, active }: { children: ReactNode; onReset?: () => void; active?: boolean }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {children}
      {active && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <X className="mr-1 size-4" /> Tozalash
        </Button>
      )}
    </div>
  );
}
