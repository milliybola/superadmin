import React, { useEffect, useState } from 'react';
import { AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { Map, Placemark, Polygon } from '@pbe/react-yandex-maps';
import { locationsApi } from '../services/locationsApi';
import type { LocationPayload, LocationTypeOption } from '../services/locationsApi';
import { getNominalByCoords } from '../services/geocode';
import { SERVICE_AREA_POLYGON } from '../serviceArea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  uuid: string | null;
  locationTypes: LocationTypeOption[];
  onSuccess: () => void;
}

const SERVICE_AREA_CENTER: [number, number] = [
  SERVICE_AREA_POLYGON.reduce((sum, c) => sum + c[0], 0) / SERVICE_AREA_POLYGON.length,
  SERVICE_AREA_POLYGON.reduce((sum, c) => sum + c[1], 0) / SERVICE_AREA_POLYGON.length,
];

interface FormState {
  name: string;
  description: string;
  location_type: string;
  address: string;
  orientir: string;
  order: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  location_type: '',
  address: '',
  orientir: '',
  order: '',
};

const LocationFormDialog: React.FC<LocationFormDialogProps> = ({
  open,
  onOpenChange,
  mode,
  uuid,
  locationTypes,
  onSuccess,
}) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (mode === 'edit' && uuid) {
      setLoading(true);
      locationsApi.getLocation(uuid)
        .then((location) => {
          setForm({
            name: location.name,
            description: location.description || '',
            location_type: location.location_type,
            address: location.address,
            orientir: location.orientir || '',
            order: location.order !== undefined && location.order !== null ? String(location.order) : '',
          });
          const lat = parseFloat(location.latitude);
          const lng = parseFloat(location.longitude);
          setCoords(Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null);
        })
        .catch((err) => {
          console.error(err);
          setError("Joy manzili ma'lumotlarini yuklashda xatolik yuz berdi.");
        })
        .finally(() => setLoading(false));
    } else {
      setForm(EMPTY_FORM);
      setCoords(null);
    }
  }, [open, mode, uuid]);

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Reverse-geocodes the picked point via Nominatim and fills the address
  // field — the admin can still freely overwrite it afterward.
  const applyCoords = (newCoords: [number, number]) => {
    setCoords(newCoords);
    setGeocoding(true);
    getNominalByCoords(newCoords[0], newCoords[1], 'uz')
      .then((address) => {
        if (address) setForm((prev) => ({ ...prev, address }));
      })
      .finally(() => setGeocoding(false));
  };

  // ymaps event objects don't ship precise types with this package
  const handleMapClick = (e: any) => {
    applyCoords(e.get('coords') as [number, number]);
  };

  const handleDragEnd = (e: any) => {
    applyCoords(e.get('target').geometry.getCoordinates() as [number, number]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.location_type || !form.address.trim() || !coords) {
      setError("Iltimos, majburiy maydonlarni to'ldiring va xaritadan joyni tanlang.");
      return;
    }

    const payload: LocationPayload = {
      name: form.name.trim(),
      location_type: form.location_type as LocationPayload['location_type'],
      address: form.address.trim(),
      latitude: coords[0].toFixed(6),
      longitude: coords[1].toFixed(6),
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.orientir.trim()) payload.orientir = form.orientir.trim();
    if (form.order.trim() !== '') payload.order = parseInt(form.order, 10);

    setSaving(true);
    try {
      if (mode === 'edit' && uuid) {
        await locationsApi.updateLocation(uuid, payload);
      } else {
        await locationsApi.createLocation(payload);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Saqlashda xatolik yuz berdi. Ma'lumotlarni tekshirib qayta urinib ko'ring."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Joy manzilini tahrirlash' : "Yangi joy manzili qo'shish"}</DialogTitle>
          <DialogDescription>
            Xaritadan joyni belgilang yoki markerni sudrab aniq nuqtaga qo'ying.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="py-16 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yuklanmoqda...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Joy nomi *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="Masalan: Gallaorol Hokimiyati"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_type">Joy turi *</Label>
                  <Select
                    value={form.location_type}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, location_type: value }))}
                  >
                    <SelectTrigger id="location_type">
                      <SelectValue placeholder="Turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1.5">
                    Manzil *
                    {geocoding && (
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> aniqlanmoqda...
                      </span>
                    )}
                  </Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={handleChange('address')}
                    placeholder="To'liq manzil matni yoki xaritadan avtomatik aniqlanadi"
                    maxLength={300}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientir">Mo'ljal (ixtiyoriy)</Label>
                  <Input
                    id="orientir"
                    value={form.orientir}
                    onChange={handleChange('orientir')}
                    placeholder="Masalan: Hokimiyat yonida"
                    maxLength={300}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Qisqacha ma'lumot (ixtiyoriy)</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={handleChange('description')}
                    placeholder="Joy haqida qisqacha ma'lumot"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Tartib raqami (ixtiyoriy)</Label>
                  <Input
                    id="order"
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={handleChange('order')}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Xaritadan joyni tanlang *
                </Label>
                <div className="overflow-hidden rounded-xl border">
                  <Map
                    defaultState={{ center: coords || SERVICE_AREA_CENTER, zoom: coords ? 15 : 13 }}
                    width="100%"
                    height="360px"
                    onClick={handleMapClick}
                  >
                    <Polygon
                      geometry={[SERVICE_AREA_POLYGON]}
                      options={{
                        fillColor: 'rgba(59, 130, 246, 0.06)',
                        strokeColor: '#3B82F6',
                        strokeWidth: 1.5,
                        strokeOpacity: 0.6,
                        fillOpacity: 1,
                      }}
                    />
                    {coords && (
                      <Placemark
                        geometry={coords}
                        options={{ preset: 'islands#blueDotIcon', draggable: true }}
                        onDragEnd={handleDragEnd}
                      />
                    )}
                  </Map>
                </div>
                <p className="text-xs text-muted-foreground">
                  Xaritani bosing yoki markerni sudrab joyni aniqlashtiring — manzil avtomatik topiladi, keyin uni tahrirlash mumkin.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={coords ? coords[0] : ''}
                      onChange={(e) => {
                        const lat = parseFloat(e.target.value);
                        if (Number.isFinite(lat)) {
                          setCoords((prev) => [lat, prev ? prev[1] : SERVICE_AREA_CENTER[1]]);
                        }
                      }}
                      placeholder="40.123456"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={coords ? coords[1] : ''}
                      onChange={(e) => {
                        const lng = parseFloat(e.target.value);
                        if (Number.isFinite(lng)) {
                          setCoords((prev) => [prev ? prev[0] : SERVICE_AREA_CENTER[0], lng]);
                        }
                      }}
                      placeholder="67.123456"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'edit' ? 'Saqlash' : "Qo'shish"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationFormDialog;
