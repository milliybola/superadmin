import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Pencil, RotateCcw, Check, Loader2, LandPlot } from 'lucide-react';
import { Map, Polygon } from '@pbe/react-yandex-maps';
import { neighborhoodsApi } from '../services/neighborhoodsApi';
import { SERVICE_AREA_POLYGON, SERVICE_AREA_CENTER } from '../../locations/serviceArea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NeighborhoodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  districts: string[];
  onSuccess: () => void;
}

type LatLng = [number, number];

const COORDS_PLACEHOLDER = '[[[67.596163, 40.047039], [67.593165, 40.046991], [67.591188, 40.045880], [67.596163, 40.047039]]]';

const ringToText = (r: LatLng[]) => JSON.stringify([r.map(([lat, lng]) => [lng, lat])]);

const NeighborhoodFormDialog: React.FC<NeighborhoodFormDialogProps> = ({
  open,
  onOpenChange,
  districts,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [ring, setRing] = useState<LatLng[]>([]);
  const [coordsText, setCoordsText] = useState('');
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const polygonRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const resetForm = useCallback(() => {
    setName('');
    setDistrict('');
    setRing([]);
    setCoordsText('');
    setCoordsError(null);
    setDrawing(false);
    setError(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const fitMapToRing = useCallback((r: LatLng[]) => {
    if (!mapRef.current || r.length === 0) return;
    const lats = r.map((p) => p[0]);
    const lngs = r.map((p) => p[1]);
    try {
      mapRef.current.setBounds(
        [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
        { checkZoomRange: true }
      );
    } catch {
      // ignore — bounds fitting is a nicety, not essential
    }
  }, []);

  // ymaps event/instance objects don't ship precise types with this package
  const syncRingFromPolygon = useCallback(() => {
    const instance = polygonRef.current;
    if (!instance) return;
    const coords = instance.geometry.getCoordinates()[0] || [];
    setRing(coords);
    setCoordsText(coords.length ? ringToText(coords) : '');
    setCoordsError(null);
  }, []);

  // The drawing Polygon (re-)mounts and lazily loads the
  // geoObject.addon.editor module when `drawing` turns true, so its
  // instance + .editor aren't necessarily ready on the same tick — poll
  // briefly instead of assuming a fixed delay.
  useEffect(() => {
    if (!drawing) return;
    let cancelled = false;

    const tryStart = (attemptsLeft: number) => {
      if (cancelled) return;
      if (polygonRef.current?.editor) {
        polygonRef.current.editor.startDrawing();
      } else if (attemptsLeft > 0) {
        setTimeout(() => tryStart(attemptsLeft - 1), 100);
      }
    };
    tryStart(50);

    return () => {
      cancelled = true;
    };
  }, [drawing]);

  const handleStartDrawing = () => {
    setError(null);
    setRing([]);
    setCoordsText('');
    setCoordsError(null);
    setDrawing(true);
  };

  const handleFinishDrawing = () => {
    polygonRef.current?.editor?.stopDrawing();
    syncRingFromPolygon();
    setDrawing(false);
  };

  const handleResetDrawing = () => {
    polygonRef.current?.editor?.stopDrawing();
    setRing([]);
    setCoordsText('');
    setCoordsError(null);
    setDrawing(false);
  };

  const handleCoordsTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCoordsText(text);

    if (!text.trim()) {
      setRing([]);
      setCoordsError(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const firstRing = parsed?.[0];
      if (!Array.isArray(firstRing) || firstRing.length < 3) {
        throw new Error('too few points');
      }
      const converted: LatLng[] = firstRing.map((point: unknown) => {
        if (!Array.isArray(point) || point.length < 2 || typeof point[0] !== 'number' || typeof point[1] !== 'number') {
          throw new Error('bad point');
        }
        return [point[1], point[0]];
      });
      setRing(converted);
      setCoordsError(null);
      fitMapToRing(converted);
    } catch {
      setCoordsError("Format noto'g'ri. Kutilgan ko'rinish: [[[uzunlik, kenglik], [uzunlik, kenglik], ...]]");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !district.trim()) {
      setError("Iltimos, nomi va tuman maydonlarini to'ldiring.");
      return;
    }
    if (ring.length < 3) {
      setError("Iltimos, hudud chegarasini xaritada chizing yoki koordinatalarni joylashtiring (kamida 3 nuqta).");
      return;
    }

    const closedRing = [...ring];
    const [firstLat, firstLng] = closedRing[0];
    const [lastLat, lastLng] = closedRing[closedRing.length - 1];
    if (firstLat !== lastLat || firstLng !== lastLng) {
      closedRing.push(closedRing[0]);
    }

    setSaving(true);
    try {
      await neighborhoodsApi.createNeighborhood({
        name: name.trim(),
        district: district.trim(),
        coordinates: [closedRing.map(([lat, lng]) => [lng, lat])],
      });
      resetForm();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const data = err.response?.data;
      const fieldErrors = data && typeof data === 'object'
        ? Object.values(data).flat().filter((v) => typeof v === 'string').join(' ')
        : null;
      setError(fieldErrors || data?.detail || "Saqlashda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yangi xizmat hududi qo'shish</DialogTitle>
          <DialogDescription>
            Hudud chegarasini xaritada chizing yoki koordinatalarni to'g'ridan-to'g'ri joylashtiring.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nomi *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Yangi Hayot MFY"
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">Tuman *</Label>
                <Input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Masalan: Gallaorol"
                  maxLength={200}
                  list="district-suggestions"
                  required
                />
                <datalist id="district-suggestions">
                  {districts.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinates" className="flex items-center gap-1.5">
                  <LandPlot className="h-3.5 w-3.5" />
                  Koordinatalar (JSON)
                </Label>
                <Textarea
                  id="coordinates"
                  value={coordsText}
                  onChange={handleCoordsTextChange}
                  placeholder={COORDS_PLACEHOLDER}
                  rows={6}
                  className="font-mono text-xs"
                />
                {coordsError ? (
                  <p className="text-xs text-destructive">{coordsError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {ring.length > 0 ? `${ring.length} ta nuqta aniqlandi` : "Xaritada chizing yoki [[[uzunlik, kenglik], ...]] formatida joylashtiring"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Xaritada ko'rinishi</Label>
              <div className="overflow-hidden rounded-xl border">
                <Map
                  defaultState={{ center: SERVICE_AREA_CENTER, zoom: 14 }}
                  width="100%"
                  height="360px"
                  instanceRef={(ref: any) => {
                    mapRef.current = ref;
                  }}
                >
                  <Polygon
                    geometry={[SERVICE_AREA_POLYGON]}
                    options={{
                      fillColor: 'rgba(59, 130, 246, 0.04)',
                      strokeColor: '#3B82F6',
                      strokeWidth: 1,
                      strokeOpacity: 0.4,
                      fillOpacity: 1,
                      interactivityModel: 'default#silent',
                    }}
                  />
                  {drawing && (
                    <Polygon
                      instanceRef={(ref: any) => {
                        polygonRef.current = ref;
                      }}
                      // .editor is only available once this module is loaded
                      modules={['geoObject.addon.editor']}
                      // Must be uncontrolled (default*), not geometry= — a
                      // controlled prop gets re-pushed to the instance on
                      // every re-render, which would reset the editor's
                      // in-progress drawing back to empty and refire
                      // geometrychange forever.
                      defaultGeometry={[[]]}
                      options={{
                        fillColor: 'rgba(16, 185, 129, 0.15)',
                        strokeColor: '#10B981',
                        strokeWidth: 2,
                        // editorDrawingCursor is a real ymaps option missing from this package's typings
                        editorDrawingCursor: 'crosshair',
                      } as any}
                      onGeometryChange={syncRingFromPolygon}
                    />
                  )}
                  {!drawing && ring.length >= 3 && (
                    <Polygon
                      geometry={[ring]}
                      options={{
                        fillColor: 'rgba(16, 185, 129, 0.15)',
                        strokeColor: '#10B981',
                        strokeWidth: 2,
                      }}
                    />
                  )}
                </Map>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {!drawing ? (
                  <Button type="button" variant="outline" size="sm" onClick={handleStartDrawing}>
                    <Pencil className="h-3.5 w-3.5" />
                    {ring.length > 0 ? 'Qayta chizish' : 'Xaritada chizish'}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={handleFinishDrawing}>
                    <Check className="h-3.5 w-3.5" />
                    Tugatish
                  </Button>
                )}
                {ring.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={handleResetDrawing}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Tozalash
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Xaritada nuqtalarni ketma-ket bosib chizing (oxirgi nuqtani ikki marta bosib yakunlang) — yoki chapdagi maydonga koordinatalarni joylashtiring.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NeighborhoodFormDialog;
