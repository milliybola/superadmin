import React, { useEffect, useMemo, useState } from 'react';
import { LandPlot, Plus, Inbox } from 'lucide-react';
import { Map, Polygon } from '@pbe/react-yandex-maps';
import { neighborhoodsApi } from '../services/neighborhoodsApi';
import type { Neighborhood } from '../services/neighborhoodsApi';
import NeighborhoodFormDialog from '../components/NeighborhoodFormDialog';
import { SERVICE_AREA_POLYGON, SERVICE_AREA_CENTER } from '../../locations/serviceArea';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const NEIGHBORHOOD_COLORS = ['#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];

const toLatLngRing = (coordinates: Neighborhood['coordinates']): [number, number][] =>
  (coordinates[0] || []).map(([lng, lat]) => [lat, lng]);

const NeighborhoodsPage: React.FC = () => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const fetchNeighborhoods = () => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    neighborhoodsApi.getNeighborhoods()
      .then((result) => {
        if (cancelled) return;
        setNeighborhoods(result.neighborhoods);
        setDistricts(result.districts);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Hududlarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => fetchNeighborhoods(), []);

  const rings = useMemo(
    () => neighborhoods.map((n) => ({ neighborhood: n, ring: toLatLngRing(n.coordinates) })),
    [neighborhoods]
  );

  const handleFormSuccess = () => {
    setFormOpen(false);
    fetchNeighborhoods();
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <LandPlot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Xizmat ko'rsatish hududi</h1>
            <p className="text-sm text-muted-foreground">
              Xizmat ko'rsatiladigan mahallalar chegaralari
            </p>
          </div>
        </div>

        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Yangi hudud
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Jami {neighborhoods.length} ta hudud belgilangan</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <Skeleton className="h-[420px] w-full rounded-xl" />
          ) : (
            <div className="overflow-hidden rounded-2xl border shadow-sm">
              <Map defaultState={{ center: SERVICE_AREA_CENTER, zoom: 13 }} width="100%" height="420px">
                <Polygon
                  geometry={[SERVICE_AREA_POLYGON]}
                  options={{
                    fillColor: 'rgba(59, 130, 246, 0.04)',
                    strokeColor: '#3B82F6',
                    strokeWidth: 1.5,
                    strokeOpacity: 0.5,
                    fillOpacity: 1,
                    interactivityModel: 'default#silent',
                  }}
                />
                {rings.map(({ neighborhood, ring }, i) => (
                  <Polygon
                    key={neighborhood.uuid}
                    geometry={[ring]}
                    properties={{
                      hintContent: neighborhood.name,
                      balloonContentHeader: neighborhood.name,
                      balloonContentBody: neighborhood.district,
                    }}
                    options={{
                      fillColor: `${NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length]}33`,
                      strokeColor: NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length],
                      strokeWidth: 2,
                      fillOpacity: 1,
                    }}
                  />
                ))}
              </Map>
            </div>
          )}

          <div className="rounded-xl border overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : neighborhoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                <Inbox className="h-8 w-8" />
                <span>Hali hech qanday hudud qo'shilmagan.</span>
              </div>
            ) : (
              <ul className="divide-y">
                {rings.map(({ neighborhood, ring }, i) => (
                  <li key={neighborhood.uuid} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: NEIGHBORHOOD_COLORS[i % NEIGHBORHOOD_COLORS.length] }}
                      />
                      <span className="font-medium truncate">{neighborhood.name}</span>
                      <Badge variant="secondary">{neighborhood.district}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{ring.length} nuqta</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <NeighborhoodFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        districts={districts}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default NeighborhoodsPage;
