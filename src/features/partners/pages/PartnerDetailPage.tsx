import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Star, Phone, Mail, MapPin, Clock, Check, X, Banknote, Truck, Gift,
  FileText, BarChart3, Users, Building2, Package, Inbox,
} from 'lucide-react';
import { Map, Placemark } from '@pbe/react-yandex-maps';
import { partnersApi } from '../services/partnersApi';
import type {
  Partner, PartnerStatistics, PartnerStaffMember, PartnerFilial, Product,
} from '../services/partnersApi';
import { PARTNER_TYPE_LABELS, WEEKDAY_LABELS } from '../constants';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const formatSum = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return null;
  return `${num.toLocaleString('uz-UZ')} so'm`;
};

const InfoField: React.FC<{ icon: React.ElementType; label: string; className?: string; children: React.ReactNode }> = ({
  icon: Icon, label, className, children,
}) => (
  <div className={`rounded-xl border bg-muted/30 p-4 ${className ?? ''}`}>
    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <div className="text-sm">{children}</div>
  </div>
);

const StatTile: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl border bg-muted/30 p-4">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

// The three sections below call the same endpoints the partner-facing app
// uses for its own logged-in session, filtered by `?partner=uuid` as a best
// guess — there's no confirmed superadmin-scoped equivalent yet. Each loads
// independently and degrades to a quiet "unavailable" state on any failure
// (401/403/404/network) rather than blocking the rest of the page.
type SectionStatus = 'loading' | 'ready' | 'unavailable';

const SectionBody: React.FC<{ status: SectionStatus; children: React.ReactNode }> = ({ status, children }) => {
  if (status === 'loading') {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }
  if (status === 'unavailable') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <Inbox className="h-6 w-6" />
        <span className="text-sm">Bu bo'lim uchun hozircha ma'lumot mavjud emas.</span>
      </div>
    );
  }
  return <>{children}</>;
};

const NAV_ITEMS = [
  { key: 'info', label: 'Hamkor haqida', icon: FileText },
  { key: 'stats', label: 'Statistika', icon: BarChart3 },
  { key: 'staff', label: 'Xodimlar', icon: Users },
  { key: 'filials', label: 'Filiallar', icon: Building2 },
  { key: 'catalog', label: 'Katalog', icon: Package },
] as const;

type SectionKey = typeof NAV_ITEMS[number]['key'];

const SECTION_META: Record<SectionKey, { title: string; description: string }> = {
  info: { title: 'Hamkor haqida', description: "Asosiy ma'lumotlar va profil" },
  stats: { title: 'Statistika', description: "Buyurtma va daromad ko'rsatkichlari" },
  staff: { title: 'Xodimlar', description: "Hamkorga tegishli xodimlar ro'yxati" },
  filials: { title: 'Filiallar', description: 'Hamkorning filiallari' },
  catalog: { title: 'Katalog', description: 'Hamkor mahsulotlari' },
};

const PartnerDetailPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<SectionKey>('info');

  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statsStatus, setStatsStatus] = useState<SectionStatus>('loading');
  const [stats, setStats] = useState<PartnerStatistics | null>(null);

  const [staffStatus, setStaffStatus] = useState<SectionStatus>('loading');
  const [staff, setStaff] = useState<PartnerStaffMember[]>([]);

  const [filialsStatus, setFilialsStatus] = useState<SectionStatus>('loading');
  const [filials, setFilials] = useState<PartnerFilial[]>([]);

  const [productsStatus, setProductsStatus] = useState<SectionStatus>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [productsPage, setProductsPage] = useState(1);

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    partnersApi.getPartner(uuid)
      .then((result) => { if (!cancelled) setPartner(result); })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Hamkor ma'lumotlarini yuklashda xatolik yuz berdi.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [uuid]);

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    setStatsStatus('loading');
    partnersApi.getPartnerStatistics(uuid)
      .then((result) => { if (!cancelled) { setStats(result); setStatsStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatsStatus('unavailable'); });
    return () => { cancelled = true; };
  }, [uuid]);

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    setStaffStatus('loading');
    partnersApi.getPartnerStaff(uuid)
      .then((result) => { if (!cancelled) { setStaff(result); setStaffStatus('ready'); } })
      .catch(() => { if (!cancelled) setStaffStatus('unavailable'); });
    return () => { cancelled = true; };
  }, [uuid]);

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    setFilialsStatus('loading');
    partnersApi.getPartnerFilials(uuid)
      .then((result) => { if (!cancelled) { setFilials(result); setFilialsStatus('ready'); } })
      .catch(() => { if (!cancelled) setFilialsStatus('unavailable'); });
    return () => { cancelled = true; };
  }, [uuid]);

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    setProductsStatus('loading');
    partnersApi.getPartnerProducts(uuid, productsPage)
      .then((result) => {
        if (cancelled) return;
        setProducts(result.products);
        setProductsCount(result.count);
        setProductsStatus('ready');
      })
      .catch(() => { if (!cancelled) setProductsStatus('unavailable'); });
    return () => { cancelled = true; };
  }, [uuid, productsPage]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/partners')}>
          <ChevronLeft className="h-4 w-4" />
          Hamkorlarga qaytish
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Hamkor topilmadi.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasCoords =
    Number.isFinite(partner.location_lat) &&
    Number.isFinite(partner.location_long) &&
    !(partner.location_lat === 1 && partner.location_long === 1);

  const initials = partner.name.slice(0, 2).toUpperCase();
  const typeLabel = PARTNER_TYPE_LABELS[partner.partner_type] ?? partner.partner_type;
  const overall = stats?.overall;
  const productsTotalPages = productsCount > 0 && products.length > 0 ? Math.ceil(productsCount / (products.length || 1)) : 1;

  const sectionDescription = activeSection === 'catalog' && productsStatus === 'ready'
    ? `Jami ${productsCount} ta mahsulot`
    : SECTION_META[activeSection].description;

  return (
    <div className="max-w-full mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shrink-0"
          onClick={() => navigate('/partners')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight truncate">
          <span className="text-primary">{partner.name}</span> tafsilotlari
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        <Card className="lg:sticky lg:top-4">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer',
                    activeSection === item.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{SECTION_META[activeSection].title}</CardTitle>
            <CardDescription>{sectionDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSection === 'info' && (
              <div className="space-y-4">
                {partner.banner && (
                  <div className="h-40 overflow-hidden rounded-xl bg-muted">
                    <img src={partner.banner} alt="" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 rounded-2xl border shrink-0">
                    <AvatarImage src={partner.logo ?? undefined} alt={partner.name} />
                    <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold truncate">{partner.name}</span>
                      <Badge variant="secondary">{typeLabel}</Badge>
                      <Badge variant={partner.is_open ? 'success' : 'destructive'}>
                        {partner.is_open ? 'Ochiq' : 'Yopiq'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {parseFloat(partner.rating).toFixed(2)} reyting
                    </div>
                  </div>
                </div>

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
                  <InfoField icon={Phone} label="Telefon">{partner.phone || '—'}</InfoField>
                  <InfoField icon={Mail} label="Email">{partner.email || '—'}</InfoField>

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
                    ) : '—'}
                  </InfoField>

                  <InfoField icon={Banknote} label="Minimal buyurtma">{formatSum(partner.min_order_amount) ?? '—'}</InfoField>
                  <InfoField icon={Banknote} label="Maksimal buyurtma">{formatSum(partner.max_order_amount) ?? '—'}</InfoField>
                  <InfoField icon={Truck} label="Yetkazib berish narxi">{formatSum(partner.delivery_fee) ?? '—'}</InfoField>
                  <InfoField icon={Gift} label="Bepul yetkazib berish chegarasi">{formatSum(partner.free_delivery_threshold) ?? '—'}</InfoField>
                </div>

                <Separator />
                <div className="text-xs text-muted-foreground font-mono break-all">UUID: {partner.uuid}</div>
              </div>
            )}

            {activeSection === 'stats' && (
              <SectionBody status={statsStatus}>
                {overall ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatTile label="Jami buyurtmalar" value={overall.total_orders ?? '—'} />
                    <StatTile label="Yetkazilgan" value={overall.delivered ?? '—'} />
                    <StatTile label="Bekor qilingan" value={overall.cancelled ?? '—'} />
                    <StatTile label="Jami daromad" value={formatSum(overall.total_revenue) ?? '—'} />
                    <StatTile label="Yetkazib berish yig'indisi" value={formatSum(overall.total_delivery_fees) ?? '—'} />
                    <StatTile label="Sof daromad" value={formatSum(overall.net_revenue) ?? '—'} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Inbox className="h-6 w-6" />
                    <span className="text-sm">Statistika ma'lumotlari topilmadi.</span>
                  </div>
                )}
              </SectionBody>
            )}

            {activeSection === 'staff' && (
              <SectionBody status={staffStatus}>
                {staff.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Inbox className="h-6 w-6" />
                    <span className="text-sm">Xodimlar topilmadi.</span>
                  </div>
                ) : (
                  <ul className="divide-y rounded-xl border">
                    {staff.map((member) => (
                      <li key={member.uuid} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="font-medium">{member.full_name || member.name || '—'}</span>
                        <div className="flex items-center gap-2">
                          {member.role && <Badge variant="secondary">{member.role}</Badge>}
                          <Badge variant={member.is_active ? 'success' : 'outline'}>
                            {member.is_active ? 'Faol' : 'Nofaol'}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionBody>
            )}

            {activeSection === 'filials' && (
              <SectionBody status={filialsStatus}>
                {filials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Inbox className="h-6 w-6" />
                    <span className="text-sm">Filiallar topilmadi.</span>
                  </div>
                ) : (
                  <ul className="divide-y rounded-xl border">
                    {filials.map((filial) => (
                      <li key={filial.uuid} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{filial.filial_name || '—'}</div>
                          {filial.address && <div className="text-xs text-muted-foreground truncate">{filial.address}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {filial.is_main && <Badge variant="secondary">Asosiy</Badge>}
                          <Badge variant={filial.filial_status === 'ACTIVE' ? 'success' : 'outline'}>
                            {filial.filial_status || '—'}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionBody>
            )}

            {activeSection === 'catalog' && (
              productsStatus === 'unavailable' ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Inbox className="h-6 w-6" />
                  <span className="text-sm">Bu bo'lim uchun hozircha ma'lumot mavjud emas.</span>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nomi</TableHead>
                          <TableHead>Narxi</TableHead>
                          <TableHead>Holati</TableHead>
                          <TableHead className="text-right">Mavjudligi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsStatus === 'loading' ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                              <TableCell className="text-right"><Skeleton className="h-5 w-16 rounded-md ml-auto" /></TableCell>
                            </TableRow>
                          ))
                        ) : products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                              Mahsulotlar topilmadi.
                            </TableCell>
                          </TableRow>
                        ) : (
                          products.map((product) => (
                            <TableRow key={product.uuid}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell className="font-mono text-xs">{formatSum(product.price) ?? '—'}</TableCell>
                              <TableCell>
                                <Badge variant={product.is_active ? 'success' : 'outline'}>
                                  {product.stock_status || (product.is_active ? 'Faol' : 'Nofaol')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={product.is_available ? 'success' : 'destructive'}>
                                  {product.is_available ? 'Mavjud' : "Mavjud emas"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {productsStatus === 'ready' && productsCount > products.length && (
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-sm text-muted-foreground">{productsPage}-sahifa</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
                          disabled={productsPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setProductsPage((p) => p + 1)}
                          disabled={productsPage >= productsTotalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerDetailPage;