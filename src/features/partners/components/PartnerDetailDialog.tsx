import React from 'react';
import { Star, Phone, Mail, MapPin, Clock, Check, X, Banknote, Truck, Gift } from 'lucide-react';
import { Map, Placemark } from '@pbe/react-yandex-maps';
import type { Partner } from '../services/partnersApi';
import { PARTNER_TYPE_LABELS, WEEKDAY_LABELS } from '../constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface PartnerDetailDialogProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatSum = (value: string | null | undefined) => {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return null;
  return `${num.toLocaleString('uz-UZ')} so'm`;
};

const InfoField: React.FC<{ icon: React.ElementType; label: string; className?: string; children: React.ReactNode }> = ({
  icon: Icon,
  label,
  className,
  children,
}) => (
  <div className={`rounded-xl border bg-muted/30 p-4 ${className ?? ''}`}>
    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <div className="text-sm">{children}</div>
  </div>
);

const PartnerDetailDialog: React.FC<PartnerDetailDialogProps> = ({ partner, open, onOpenChange }) => {
  if (!partner) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl" />
      </Dialog>
    );
  }

  const hasCoords =
    Number.isFinite(partner.location_lat) &&
    Number.isFinite(partner.location_long) &&
    !(partner.location_lat === 1 && partner.location_long === 1);

  const initials = partner.name.slice(0, 2).toUpperCase();
  const typeLabel = PARTNER_TYPE_LABELS[partner.partner_type] ?? partner.partner_type;
  const minOrder = formatSum(partner.min_order_amount);
  const maxOrder = formatSum(partner.max_order_amount);
  const deliveryFee = formatSum(partner.delivery_fee);
  const freeDeliveryThreshold = formatSum(partner.free_delivery_threshold);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {partner.banner && (
          <div className="-mx-6 -mt-6 mb-2 h-40 overflow-hidden bg-muted sm:rounded-t-2xl">
            <img src={partner.banner} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 rounded-2xl border shrink-0">
              <AvatarImage src={partner.logo ?? undefined} alt={partner.name} />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="truncate text-xl">{partner.name}</DialogTitle>
                <Badge variant="secondary">{typeLabel}</Badge>
                <Badge variant={partner.is_open ? 'success' : 'destructive'}>
                  {partner.is_open ? 'Ochiq' : 'Yopiq'}
                </Badge>
              </div>
              <DialogDescription className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {parseFloat(partner.rating).toFixed(2)} reyting
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {partner.description && (
          <p className="text-sm text-muted-foreground">{partner.description}</p>
        )}

        {hasCoords && (
          <div className="overflow-hidden rounded-2xl border shadow-sm">
            <Map
              defaultState={{ center: [partner.location_lat as number, partner.location_long as number], zoom: 15 }}
              width="100%"
              height="220px"
            >
              <Placemark
                geometry={[partner.location_lat as number, partner.location_long as number]}
                options={{ preset: 'islands#blueDotIcon' }}
              />
            </Map>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField icon={MapPin} label="Manzil" className="sm:col-span-2">
            {partner.address}
          </InfoField>

          <InfoField icon={Phone} label="Telefon">
            {partner.phone || '—'}
          </InfoField>

          <InfoField icon={Mail} label="Email">
            {partner.email || '—'}
          </InfoField>

          <InfoField icon={Clock} label="Ish vaqti" className="sm:col-span-2">
            {partner.opening_hours ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map(({ key, label }) => {
                    const active = partner.opening_hours?.[key];
                    return (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                          active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {label}
                      </span>
                    );
                  })}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {partner.opening_hours.from_hour.slice(0, 5)} – {partner.opening_hours.to_hour.slice(0, 5)}
                </div>
              </div>
            ) : (
              '—'
            )}
          </InfoField>

          <InfoField icon={Banknote} label="Minimal buyurtma">
            {minOrder ?? '—'}
          </InfoField>
          <InfoField icon={Banknote} label="Maksimal buyurtma">
            {maxOrder ?? '—'}
          </InfoField>
          <InfoField icon={Truck} label="Yetkazib berish narxi">
            {deliveryFee ?? '—'}
          </InfoField>
          <InfoField icon={Gift} label="Bepul yetkazib berish chegarasi">
            {freeDeliveryThreshold ?? '—'}
          </InfoField>
        </div>

        <Separator />

        <div className="text-xs text-muted-foreground font-mono break-all">UUID: {partner.uuid}</div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerDetailDialog;
