import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/State';
import { Pill } from '@/shared/components/Pill';
import { formatDate, formatDateTime } from '@/shared/lib/format';
import { couriersApi, type CourierDetail, type CourierDocument } from '../api';
import { DOC_STATUSES } from '../constants';
import { useCourierActions } from '../hooks';

/** Hujjat fayli: token bilan olinadi va blob sifatida ko'rsatiladi */
function useDocFile(courier: string, doc: CourierDocument) {
  return useQuery({
    queryKey: ['couriers', 'doc-file', courier, doc.id, doc.uploaded_at, doc.status],
    queryFn: () => couriersApi.documentBlob(courier, doc.id),
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  });
}

function Preview({ courier, doc, full }: { courier: string; doc: CourierDocument; full?: boolean }) {
  const { data, isLoading, error } = useDocFile(courier, doc);
  if (isLoading) return <div className="flex h-full min-h-40 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (error || !data) return <div className="flex h-full min-h-40 items-center justify-center text-sm text-destructive">Fayl ochilmadi</div>;
  if (data.type === 'application/pdf') {
    return full
      ? <iframe title={doc.type_label} src={data.url} className="h-[70vh] w-full rounded-lg border" />
      : <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-muted-foreground"><FileText className="size-10" />PDF</div>;
  }
  return <img src={data.url} alt={doc.type_label} className={full ? 'max-h-[70vh] w-full rounded-lg object-contain' : 'h-full w-full object-cover'} />;
}

function ApproveDialog({ doc, onClose, onConfirm, busy }: { doc: CourierDocument; onClose: () => void; onConfirm: (expires: string | null) => void; busy: boolean }) {
  const [expires, setExpires] = useState(doc.expires_at ?? '');
  const needsExpiry = doc.type === 'driver_license' || doc.type === 'insurance' || doc.type === 'vehicle_registration';
  return (
    <Dialog open onOpenChange={(o) => !busy && !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{doc.type_label}ni tasdiqlash</DialogTitle></DialogHeader>
        {needsExpiry && (
          <div className="space-y-1.5">
            <Label htmlFor="exp">Amal qilish muddati</Label>
            <Input id="exp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            <p className="text-xs text-muted-foreground">Muddati yaqinlashganda panelda ogohlantirish chiqadi.</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Bekor qilish</Button>
          <Button onClick={() => onConfirm(expires || null)} disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}Tasdiqlash
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Hujjatlar: ko'rish, tasdiqlash (muddat bilan), sabab bilan rad etish. */
export function DocumentsTab({ courier }: { courier: CourierDetail }) {
  const { reviewDocument } = useCourierActions(courier.uuid);
  const [viewing, setViewing] = useState<CourierDocument | null>(null);
  const [approving, setApproving] = useState<CourierDocument | null>(null);
  const [rejecting, setRejecting] = useState<CourierDocument | null>(null);
  const { approval } = courier;

  if (courier.documents.length === 0) {
    return <Card><EmptyState title="Hujjat yuklanmagan" description={`Kuryer ilovadan ariza yuborganda hujjatlar shu yerda paydo bo'ladi. Talab qilinadi: ${approval.required.join(', ')}.`} /></Card>;
  }

  return (
    <div className="space-y-4">
      {approval.missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>Yuklanmagan majburiy hujjatlar: <b>{approval.missing.join(', ')}</b></span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courier.documents.map((d) => {
          const st = DOC_STATUSES[d.status];
          return (
            <Card key={d.id} className="overflow-hidden">
              <button type="button" onClick={() => setViewing(d)} className="block aspect-[4/3] w-full bg-muted" aria-label={`${d.type_label}ni kattalashtirish`}>
                <Preview courier={courier.uuid} doc={d} />
              </button>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{d.type_label}</div>
                    <div className="text-xs text-muted-foreground">Yuklangan: {formatDateTime(d.uploaded_at)}</div>
                  </div>
                  <Pill tone={st.tone}>{st.label}</Pill>
                </div>
                {d.expires_at && (
                  <div className={`text-xs ${d.expired ? 'font-semibold text-destructive' : d.expiring_soon ? 'font-semibold text-amber-600' : 'text-muted-foreground'}`}>
                    {d.expired ? 'Muddati tugagan: ' : d.expiring_soon ? 'Tez orada tugaydi: ' : 'Amal qiladi: '}{formatDate(d.expires_at)}
                  </div>
                )}
                {d.status === 'rejected' && d.note && <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">Sabab: {d.note}</div>}
                <div className="flex gap-2">
                  {d.status !== 'approved' && <Button size="sm" className="flex-1" onClick={() => setApproving(d)}><Check className="mr-1 size-4" />Tasdiqlash</Button>}
                  {d.status !== 'rejected' && <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => setRejecting(d)}><X className="mr-1 size-4" />Rad etish</Button>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {viewing && (
        <Dialog open onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader><DialogTitle>{viewing.type_label} · {courier.full_name}</DialogTitle></DialogHeader>
            <Preview courier={courier.uuid} doc={viewing} full />
          </DialogContent>
        </Dialog>
      )}

      {approving && (
        <ApproveDialog doc={approving} busy={reviewDocument.isPending} onClose={() => setApproving(null)}
          onConfirm={(expires) => reviewDocument.mutate({ docId: approving.id, status: 'approved', expires_at: expires }, { onSuccess: () => setApproving(null) })} />
      )}
      <ConfirmDialog
        open={!!rejecting} onOpenChange={() => setRejecting(null)} destructive confirmLabel="Rad etish"
        title={`${rejecting?.type_label ?? 'Hujjat'}ni rad etish`} description="Sabab kuryerga ko'rsatiladi va u hujjatni qayta yuklaydi."
        reason={{ label: 'Sabab', required: true, placeholder: 'Masalan: rasm xira, ma\'lumotlar o\'qilmayapti' }}
        onConfirm={(note) => reviewDocument.mutateAsync({ docId: rejecting!.id, status: 'rejected', note })}
      />
    </div>
  );
}
