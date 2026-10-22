import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bell, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/shared/components/PageHeader';
import { Field, SwitchField } from '@/shared/components/Field';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/shared/lib/format';
import { cn } from '@/lib/utils';
import { broadcastApi, type BroadcastBody } from '../api';

export default function BroadcastPage() {
  const { data: audiences, isLoading } = useQuery({ queryKey: ['broadcast', 'audiences'], queryFn: broadcastApi.audiences });
  const [audience, setAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [push, setPush] = useState(true);
  const [type, setType] = useState<BroadcastBody['type']>('PROMO');
  const [confirm, setConfirm] = useState(false);

  const payload: BroadcastBody = { audience, title: title.trim(), body: body.trim(), push, type };
  const recipients = audiences?.find((a) => a.value === audience)?.recipients ?? 0;
  const send = useMutation({
    mutationFn: () => broadcastApi.send(payload),
    onSuccess: (r) => {
      toast.success(`${formatNumber(r.recipients)} ta foydalanuvchiga yuborildi`);
      setTitle(''); setBody('');
    },
  });
  const valid = payload.title.length >= 2 && recipients > 0;

  return (
    <>
      <PageHeader title="Ommaviy xabar" description="Mijozlarga aksiya yoki yangilik yuborish: bildirishnomalar ro'yxatiga yoziladi va push ketadi" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users className="size-4" />Kimga</CardTitle></CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {isLoading && <Skeleton className="h-16" />}
              {audiences?.map((a) => (
                <button key={a.value} type="button" onClick={() => setAudience(a.value)}
                  className={cn('rounded-lg border p-3 text-left transition-colors hover:bg-accent', audience === a.value && 'border-primary bg-primary/5')}>
                  <div className="text-sm font-medium">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{formatNumber(a.recipients)} ta foydalanuvchi</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Bell className="size-4" />Xabar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Sarlavha" required hint={`${title.length}/200`}><Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Bugun 2+1 aksiya!" /></Field>
              <Field label="Matn" hint={`${body.length}/1000`}><Textarea rows={4} value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} /></Field>
              <Field label="Turi">
                <Select value={type} onValueChange={(v) => setType(v as BroadcastBody['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PROMO">Aksiya</SelectItem><SelectItem value="SYSTEM">Tizim xabari</SelectItem></SelectContent>
                </Select>
              </Field>
              <SwitchField label="Push yuborish" description="O'chirilsa faqat bildirishnomalar ro'yxatida ko'rinadi" checked={push} onChange={setPush} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Ko'rinishi</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="flex items-start gap-3 rounded-xl bg-card p-3 shadow-sm">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bell className="size-4" /></div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{title || 'Sarlavha'}</div>
                    <div className="line-clamp-3 text-sm text-muted-foreground">{body || 'Xabar matni shu yerda ko\'rinadi'}</div>
                  </div>
                </div>
              </div>
              <Button className="mt-4 w-full" disabled={!valid || send.isPending} onClick={() => setConfirm(true)}>
                <Send className="mr-2 size-4" />{formatNumber(recipients)} kishiga yuborish
              </Button>
              {recipients === 0 && !isLoading && <p className="mt-2 text-center text-xs text-muted-foreground">Bu guruhda qabul qiluvchi yo'q.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={confirm} onOpenChange={setConfirm} confirmLabel="Yuborish" title="Xabarni yuborish"
        description={<>«{payload.title}» xabari <b>{formatNumber(recipients)}</b> ta foydalanuvchiga yuboriladi. Bu amalni qaytarib bo'lmaydi.</>}
        onConfirm={() => send.mutateAsync()} />
    </>
  );
}
