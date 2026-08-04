import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Map, Placemark, Polygon } from '@pbe/react-yandex-maps';
import { locationsApi } from '../services/locationsApi';
import type { Location } from '../services/locationsApi';
import { LOCATION_TYPE_META } from '../constants';
import { SERVICE_AREA_POLYGON } from '../serviceArea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationsMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The map always opens framed to the service area itself — locations
// elsewhere in the country are still plotted, but zooming out to fit every
// one of them would make the actual delivery zone unreadably small.
const SERVICE_AREA_LATS = SERVICE_AREA_POLYGON.map((c) => c[0]);
const SERVICE_AREA_LNGS = SERVICE_AREA_POLYGON.map((c) => c[1]);
const SERVICE_AREA_BOUNDS: [[number, number], [number, number]] = [
  [Math.min(...SERVICE_AREA_LATS), Math.min(...SERVICE_AREA_LNGS)],
  [Math.max(...SERVICE_AREA_LATS), Math.max(...SERVICE_AREA_LNGS)],
];

const toCoords = (location: Location): [number, number] | null => {
  const lat = parseFloat(location.latitude);
  const lng = parseFloat(location.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

const LocationsMapDialog: React.FC<LocationsMapDialogProps> = ({ open, onOpenChange }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    locationsApi.getAllLocations()
      .then((result) => {
        if (!cancelled) setLocations(result);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Joy manzillarini yuklashda xatolik yuz berdi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const points = locations
    .map((location) => ({ location, coords: toCoords(location) }))
    .filter((item): item is { location: Location; coords: [number, number] } => item.coords !== null);

  const defaultState = { bounds: SERVICE_AREA_BOUNDS };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Barcha joy manzillari xaritada</DialogTitle>
          <DialogDescription>
            {loading
              ? 'Yuklanmoqda...'
              : `${points.length} ta joy manzili xaritada belgilandi — rangli chegara xizmat ko'rsatish hududini bildiradi`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Skeleton className="h-[85vh] w-full rounded-xl" />
        ) : (
          <div className="overflow-hidden rounded-2xl border shadow-sm">
            <Map
              defaultState={defaultState}
              width="100%"
              height="85vh"
              modules={['geoObject.addon.hint', 'geoObject.addon.balloon']}
            >
              <Polygon
                geometry={[SERVICE_AREA_POLYGON]}
                options={{
                  fillColor: 'rgba(59, 130, 246, 0.08)',
                  strokeColor: '#3B82F6',
                  strokeWidth: 2,
                  strokeOpacity: 0.8,
                  fillOpacity: 1,
                }}
                properties={{ hintContent: "Xizmat ko'rsatish hududi" }}
              />

              {points.map(({ location, coords }) => (
                <Placemark
                  key={location.uuid}
                  geometry={coords}
                  properties={{
                    hintContent: location.name,
                    balloonContentHeader: location.name,
                    balloonContentBody: location.address,
                  }}
                  options={{ preset: LOCATION_TYPE_META[location.location_type]?.mapIcon ?? 'islands#grayDotIcon' }}
                />
              ))}
            </Map>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationsMapDialog;
