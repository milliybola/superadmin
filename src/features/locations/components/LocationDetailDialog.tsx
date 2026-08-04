import React, { useEffect, useState } from 'react';
import { MapPin, AlertCircle, ExternalLink, Navigation, Fingerprint, Copy, Check } from 'lucide-react';
import { Map, Placemark } from '@pbe/react-yandex-maps';
import { locationsApi } from '../services/locationsApi';
import type { Location } from '../services/locationsApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationDetailDialogProps {
  uuid: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
      title="Nusxalash"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
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

const LocationDetailDialog: React.FC<LocationDetailDialogProps> = ({ uuid, open, onOpenChange }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !uuid) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setLocation(null);

    locationsApi.getLocation(uuid)
      .then((result) => {
        if (!cancelled) setLocation(result);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Joy manzili ma'lumotlarini yuklashda xatolik yuz berdi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, uuid]);

  const lat = location ? parseFloat(location.latitude) : NaN;
  const lng = location ? parseFloat(location.longitude) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const externalMapUrl = hasCoords ? `https://yandex.uz/maps/?pt=${lng},${lat}&z=16&l=map` : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="truncate text-xl">
                  {loading ? 'Yuklanmoqda...' : location?.name || 'Joy manzili'}
                </DialogTitle>
                {location && (
                  <Badge variant="secondary">{location.location_type_display}</Badge>
                )}
              </div>
              <DialogDescription>Joy manzili haqida batafsil ma'lumot</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-xl col-span-2" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          </div>
        ) : location ? (
          <div className="space-y-4">
            {hasCoords && (
              <div className="overflow-hidden rounded-2xl border shadow-sm">
                <Map
                  defaultState={{ center: [lat, lng], zoom: 15 }}
                  width="100%"
                  height="320px"
                  modules={['geoObject.addon.balloon']}
                >
                  <Placemark
                    geometry={[lat, lng]}
                    properties={{ balloonContent: location.name }}
                    options={{ preset: 'islands#blueDotIcon' }}
                  />
                </Map>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField icon={MapPin} label="Manzil" className="sm:col-span-2">
                {location.address}
              </InfoField>

              <InfoField icon={Navigation} label="Koordinatalar">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono">{location.latitude}, {location.longitude}</span>
                  <CopyButton value={`${location.latitude}, ${location.longitude}`} />
                </div>
              </InfoField>

              <InfoField icon={Fingerprint} label="UUID">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs truncate">{location.uuid}</span>
                  <CopyButton value={location.uuid} />
                </div>
              </InfoField>
            </div>
          </div>
        ) : null}

        {location && (
          <DialogFooter>
            {externalMapUrl && (
              <Button variant="outline" asChild>
                <a href={externalMapUrl} target="_blank" rel="noopener noreferrer">
                  Kattaroq xaritada ochish
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationDetailDialog;
