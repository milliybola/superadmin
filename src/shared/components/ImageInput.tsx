import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_MB = 5;

/** Rasm tanlash (ko'rinish bilan). `current` — serverdagi mavjud rasm URL'i; `onChange(null)` faqat tanlov bekor qilinganda */
export function ImageInput({ current, onChange, label = 'Rasm tanlash', className, aspect = 'aspect-video' }: {
  current?: string | null; onChange: (file: File | null) => void; label?: string; className?: string; aspect?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Faqat rasm fayli.');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Rasm ${MAX_MB} MB dan oshmasin.`);
    setError('');
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const shown = preview ?? current ?? null;
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className={cn('relative flex items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40', aspect)}>
        {shown ? <img src={shown} alt="" className="size-full object-cover" /> : (
          <button type="button" onClick={() => ref.current?.click()} className="flex flex-col items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ImagePlus className="size-6" />{label}
          </button>
        )}
        {preview && (
          <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2 size-7"
            onClick={() => { setPreview(null); onChange(null); if (ref.current) ref.current.value = ''; }} aria-label="Bekor qilish">
            <X className="size-4" />
          </Button>
        )}
      </div>
      {shown && <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>Almashtirish</Button>}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
