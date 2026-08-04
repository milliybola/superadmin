import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, Search, ChevronLeft, ChevronRight, Inbox, Eye, Pencil, Plus, Map as MapIcon } from 'lucide-react';
import { locationsApi } from '../services/locationsApi';
import type { Location, LocationType } from '../services/locationsApi';
import { LOCATION_TYPE_META } from '../constants';
import { useLocationTypes } from '../hooks/useLocationTypes';
import LocationDetailDialog from '../components/LocationDetailDialog';
import LocationsMapDialog from '../components/LocationsMapDialog';
import LocationFormDialog from '../components/LocationFormDialog';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [count, setCount] = useState(0);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [locationType, setLocationType] = useState<LocationType | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailUuid, setDetailUuid] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formUuid, setFormUuid] = useState<string | null>(null);

  const { types: locationTypes } = useLocationTypes();

  const fetchLocations = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    locationsApi.getLocations({
      location_type: locationType === 'ALL' ? '' : locationType,
      search,
      page,
    })
      .then((result) => {
        if (cancelled) return;
        setLocations(result.locations);
        setCount(result.count);
        setHasNext(result.hasNext);
        if (page === 1) setPageSize(result.locations.length || null);
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
  }, [locationType, search, page]);

  useEffect(() => {
    const cancel = fetchLocations();
    return cancel;
  }, [fetchLocations]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleViewDetail = (uuid: string) => {
    setDetailUuid(uuid);
    setDetailOpen(true);
  };

  const handleCreate = () => {
    setFormMode('create');
    setFormUuid(null);
    setFormOpen(true);
  };

  const handleEdit = (uuid: string) => {
    setFormMode('edit');
    setFormUuid(uuid);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    fetchLocations();
  };

  const rangeStart = pageSize ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = pageSize ? Math.min(page * pageSize, count) : locations.length;

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Joy manzillari</h1>
            <p className="text-sm text-muted-foreground">
              Mijozlar buyurtma berayotganda tanlaydigan joy manzillari ro'yxati
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMapOpen(true)}>
            <MapIcon className="h-4 w-4" />
            Xarita
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Yangi joy
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardDescription>Jami {count} ta joy manzili topildi</CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nom yoki manzil bo'yicha qidirish"
                  className="pl-9 sm:w-72"
                />
              </form>

              <Select
                value={locationType}
                onValueChange={(value) => {
                  setPage(1);
                  setLocationType(value as LocationType | 'ALL');
                }}
              >
                <SelectTrigger className="sm:w-52">
                  <SelectValue placeholder="Joy turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Barcha turlar</SelectItem>
                  {locationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Manzil</TableHead>
                  <TableHead>Koordinatalar</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Inbox className="h-8 w-8" />
                        <span>Hech qanday joy manzili topilmadi.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location) => (
                    <TableRow key={location.uuid}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>
                        <Badge variant={LOCATION_TYPE_META[location.location_type]?.badgeVariant ?? 'outline'}>
                          {location.location_type_display}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{location.address}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {location.latitude}, {location.longitude}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(location.uuid)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Tahrirlash
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewDetail(location.uuid)}>
                            <Eye className="h-3.5 w-3.5" />
                            Batafsil
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              {count > 0 ? `${rangeStart}–${rangeEnd} / ${count}` : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-6 text-center">{page}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <LocationDetailDialog uuid={detailUuid} open={detailOpen} onOpenChange={setDetailOpen} />
      <LocationsMapDialog open={mapOpen} onOpenChange={setMapOpen} />
      <LocationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        uuid={formUuid}
        locationTypes={locationTypes}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default LocationsPage;
