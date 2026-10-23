import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map as YandexMap, Placemark } from '@pbe/react-yandex-maps';
import { Clock, Radio, Star, Store } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorState } from '@/shared/components/State';
import { ChipTabs } from '@/shared/components/Filters';
import { Pill } from '@/shared/components/Pill';
import { cn } from '@/lib/utils';
import { formatPhone, timeAgo } from '@/shared/lib/format';
import { orderStatusLabel } from '@/features/orders/constants';
import type { MapCourier, WaitingOrder } from '../api';
import { COURIER_STATUSES, TRANSPORT_TYPES } from '../constants';
import { useStage } from '@/app/stage';
import { useCouriersMap } from '../hooks';

const TASHKENT: [number, number] = [41.311081, 69.240562];

const TRANSPORT_EMOJI: Record<string, string> = {
  bike: '🚲', scooter: '🛵', motorcycle: '🏍️', car: '🚗', walk: '🚶', van: '🚐', truck: '🚚',
};
const STATUS_COLOR: Record<string, string> = { available: '#10b981', busy: '#f97316', break: '#3b82f6' };

const iconCache = new Map<string, string>();
/** Kuryer transportiga mos belgi: rangli (status) doira ichida transport emojisi. */
function courierIcon(transport: string | null | undefined, status: string): string {
  const key = `${transport ?? ''}|${status}`;
  let url = iconCache.get(key);
  if (!url) {
    const color = STATUS_COLOR[status] ?? '#6b7280';
    const emoji = TRANSPORT_EMOJI[transport ?? ''] ?? '📍';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">`
      + `<path d="M22 50 L12 36 h20 z" fill="${color}"/>`
      + `<circle cx="22" cy="22" r="19" fill="#fff" stroke="${color}" stroke-width="4"/>`
      + `<text x="22" y="30" font-size="22" text-anchor="middle" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">${emoji}</text></svg>`;
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    iconCache.set(key, url);
  }
  return url;
}

type Selection = { kind: 'courier'; uuid: string } | { kind: 'order'; uuid: string } | null;

/** Jonli xarita: onlayn kuryerlar (15 soniyada yangilanadi) va kuryer kutayotgan buyurtmalar. */
export default function CouriersMapPage() {
  const { stage } = useStage();
  const { data, isLoading, error, refetch, dataUpdatedAt } = useCouriersMap(stage === 1 ? { courier_type: 'PARTNER' } : undefined);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Selection>(null);

  const couriers = useMemo(() => (data?.couriers ?? []).filter((c) => !filter || c.status === filter), [data, filter]);
  const orders = useMemo(() => data?.waiting_orders ?? [], [data]);

  const focus: [number, number] | null = useMemo(() => {
    if (selected?.kind === 'courier') {
      const c = data?.couriers.find((x) => x.uuid === selected.uuid);
      return c ? [c.latitude, c.longitude] : null;
    }
    if (selected?.kind === 'order') {
      const o = orders.find((x) => x.uuid === selected.uuid);
      return o?.latitude != null && o?.longitude != null ? [o.latitude, o.longitude] : null;
    }
    return null;
  }, [selected, data, orders]);

  const center = focus ?? (couriers[0] ? [couriers[0].latitude, couriers[0].longitude] as [number, number] : TASHKENT);
  const counts = (s: string) => data?.couriers.filter((c) => c.status === s).length ?? 0;

  if (error && !data) return <ErrorState onRetry={refetch} />;

  return (
    <>
      <PageHeader
        back={{ to: '/couriers', label: 'Kuryerlar' }}
        title="Jonli xarita"
        description={dataUpdatedAt ? `Yangilangan: ${timeAgo(new Date(dataUpdatedAt))} · avtomatik yangilanadi` : 'Yuklanmoqda...'}
        actions={<ChipTabs value={filter} onChange={setFilter} items={[
          { value: '', label: 'Hammasi', count: data?.couriers.length },
          { value: 'available', label: "Bo'sh", count: counts('available') },
          { value: 'busy', label: 'Band', count: counts('busy') },
        ]} />}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          {isLoading ? <Skeleton className="h-[600px]" /> : (
            <YandexMap state={{ center, zoom: focus ? 15 : 12 }} width="100%" height="600px" modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}>
              {couriers.map((c) => (
                <Placemark key={c.uuid} geometry={[c.latitude, c.longitude]}
                  properties={{ hintContent: c.name, balloonContent: `<b>${c.name}</b><br/>${formatPhone(c.phone)}<br/>${c.transport ? `${TRANSPORT_EMOJI[c.transport] ?? ''} ${TRANSPORT_TYPES[c.transport] ?? c.transport} · ` : ''}${COURIER_STATUSES[c.status]?.label ?? c.status}${c.order ? `<br/>Buyurtma ${c.order.number ?? ''}` : ''}` }}
                  options={{
                    iconLayout: 'default#image',
                    iconImageHref: courierIcon(c.transport, c.status),
                    iconImageSize: [44, 52],
                    iconImageOffset: [-22, -50],
                  }}
                  onClick={() => setSelected({ kind: 'courier', uuid: c.uuid })} />
              ))}
              {orders.filter((o) => o.latitude != null && o.longitude != null).map((o) => (
                <Placemark key={o.uuid} geometry={[o.latitude as number, o.longitude as number]}
                  properties={{ hintContent: `Kuryer kutmoqda: ${o.number ?? ''}`, balloonContent: `<b>${o.number ?? ''}</b><br/>${o.partner ?? ''}<br/>${o.address}` }}
                  options={{ preset: 'islands#redShoppingIcon' }}
                  onClick={() => setSelected({ kind: 'order', uuid: o.uuid })} />
              ))}
            </YandexMap>
          )}
          <div className="flex flex-wrap items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500" />Bo'sh</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-orange-500" />Band</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-500" />Kuryer kutayotgan buyurtma</span>
            <span className="ml-auto">So'nggi 30 daqiqada joylashuv yuborganlar ko'rsatiladi</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-semibold">
              <span className="inline-flex items-center gap-2"><Store className="size-4 text-red-500" />Kuryer kutmoqda</span>
              <Pill tone={orders.length ? 'danger' : 'success'}>{orders.length}</Pill>
            </div>
            <ul className="max-h-[200px] divide-y overflow-y-auto">
              {orders.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Hamma buyurtmaga kuryer topilgan</li>}
              {orders.map((o: WaitingOrder) => (
                <li key={o.uuid}>
                  <button type="button" onClick={() => setSelected({ kind: 'order', uuid: o.uuid })}
                    className={cn('w-full px-4 py-2.5 text-left hover:bg-accent', selected?.uuid === o.uuid && 'bg-accent')}>
                    <div className="flex items-center justify-between">
                      <Link to={`/orders/${o.uuid}`} className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{o.number}</Link>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{timeAgo(o.created_at)}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{o.partner} · {orderStatusLabel(o.status)}</div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-semibold">
              <span className="inline-flex items-center gap-2"><Radio className="size-4 text-emerald-500" />Onlayn kuryerlar</span>
              <Pill tone="success">{couriers.length}</Pill>
            </div>
            <ul className="max-h-[360px] divide-y overflow-y-auto">
              {couriers.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Hozir onlayn kuryer yo'q</li>}
              {couriers.map((c: MapCourier) => {
                const st = COURIER_STATUSES[c.status];
                return (
                  <li key={c.uuid}>
                    <button type="button" onClick={() => setSelected({ kind: 'courier', uuid: c.uuid })}
                      className={cn('w-full px-4 py-2.5 text-left hover:bg-accent', selected?.uuid === c.uuid && 'bg-accent')}>
                      <div className="flex items-center justify-between gap-2">
                        <Link to={`/couriers/${c.uuid}`} className="truncate font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{c.name || formatPhone(c.phone)}</Link>
                        <Pill tone={st?.tone ?? 'muted'} dot>{st?.label ?? c.status}</Pill>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{c.transport ? (TRANSPORT_TYPES[c.transport] ?? c.transport) : '—'}</span>
                        <span className="inline-flex items-center gap-0.5"><Star className="size-3 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span>
                        <span className="ml-auto">{timeAgo(c.updated_at)}</span>
                      </div>
                      {c.order && <div className="mt-0.5 truncate text-xs">Buyurtma: <b>{c.order.number}</b> · {c.order.partner}</div>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
