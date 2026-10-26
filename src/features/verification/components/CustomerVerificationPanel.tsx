import { useState } from 'react';
import { Ban, RotateCcw, ShieldCheck, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { InfoRow } from '@/shared/components/InfoRow';
import { Pill } from '@/shared/components/Pill';
import { formatDateTime } from '@/shared/lib/format';
import type { CustomerAction } from '../api';
import { TRUSTED_VIA, VERIFICATION_STATUS } from '../constants';
import { useCustomerVerification, useCustomerVerificationAction } from '../hooks';

const DIALOGS: Record<CustomerAction, { title: string; description: string; confirm: string; reasonRequired: boolean; destructive?: boolean }> = {
  trust: { title: 'Ishonchli qilib belgilash', description: "Mijoz keyingi buyurtmalarida tasdiqlash so'ralmaydi.", confirm: 'Ishonchli qilish', reasonRequired: false },
  revoke: { title: 'Tasdiqlashni bekor qilish', description: "Mijoz yana yangi mijoz kabi bo'ladi: keyingi buyurtmasida qayta qo'ng'iroq bilan tasdiqlanadi.", confirm: 'Bekor qilish', reasonRequired: true, destructive: true },
  block: { title: 'Mijozni bloklash', description: "Mijoz buyurtma bera olmaydi (ilova va saytda).", confirm: 'Bloklash', reasonRequired: true, destructive: true },
  unblock: { title: 'Blokdan chiqarish', description: "Mijoz yana buyurtma bera oladi; keyingi buyurtmada qayta tasdiqlanadi.", confirm: 'Blokdan chiqarish', reasonRequired: false },
};

/** Mijozning tasdiqlash holati va boshqaruvi (foydalanuvchi sahifasi va navbat kartasida) */
export function CustomerVerificationPanel({ userUuid, className }: { userUuid: string; className?: string }) {
  const { data, isLoading } = useCustomerVerification(userUuid);
  const act = useCustomerVerificationAction(userUuid);
  const [dialog, setDialog] = useState<CustomerAction | null>(null);

  if (isLoading || !data) return <Skeleton className="h-24 w-full" />;
  const st = VERIFICATION_STATUS[data.status];
  const cfg = dialog ? DIALOGS[dialog] : null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={st.tone} dot>{st.label}</Pill>
        {data.status === 'TRUSTED' && data.trusted_via && <span className="text-xs text-muted-foreground">{TRUSTED_VIA[data.trusted_via] ?? data.trusted_via}</span>}
      </div>
      <div className="divide-y divide-border/60">
        <InfoRow label="Buyurtmalar">{data.orders_total} ta (yetkazilgan {data.delivered}, bekor {data.cancelled})</InfoRow>
        {data.trusted_at && <InfoRow label="Ishonchli bo'lgan">{formatDateTime(data.trusted_at)}</InfoRow>}
        {data.revoked_at && <InfoRow label="Oxirgi bekor/blok">{formatDateTime(data.revoked_at)}</InfoRow>}
        {data.note && <InfoRow label="Izoh">{data.note}</InfoRow>}
        {data.reviewed_by && <InfoRow label="Kim ko'rib chiqdi">{data.reviewed_by}</InfoRow>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.status !== 'TRUSTED' && data.status !== 'BLOCKED' && (
          <Button size="sm" variant="outline" onClick={() => setDialog('trust')}><ShieldCheck className="mr-1.5 size-4" />Ishonchli qilish</Button>
        )}
        {data.status === 'TRUSTED' && (
          <Button size="sm" variant="outline" onClick={() => setDialog('revoke')}><RotateCcw className="mr-1.5 size-4" />Tasdiqlashni bekor qilish</Button>
        )}
        {data.status !== 'BLOCKED' ? (
          <Button size="sm" variant="destructive" onClick={() => setDialog('block')}><Ban className="mr-1.5 size-4" />Bloklash</Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setDialog('unblock')}><ShieldOff className="mr-1.5 size-4" />Blokdan chiqarish</Button>
        )}
      </div>

      {cfg && dialog && (
        <ConfirmDialog
          open onOpenChange={(o) => !o && setDialog(null)}
          title={cfg.title} description={cfg.description} confirmLabel={cfg.confirm} destructive={cfg.destructive}
          reason={{ label: 'Sabab', required: cfg.reasonRequired, placeholder: 'Masalan: buyurtma bermaganini aytdi' }}
          onConfirm={(reason) => act.mutateAsync({ action: dialog, reason: reason || undefined })}
        />
      )}
    </div>
  );
}
