import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Store, LandPlot, ArrowRight, Star, CheckCircle2 } from 'lucide-react';
import { locationsApi } from '@/features/locations/services/locationsApi';
import { partnersApi } from '@/features/partners/services/partnersApi';
import type { Partner } from '@/features/partners/services/partnersApi';
import { neighborhoodsApi } from '@/features/neighborhoods/services/neighborhoodsApi';
import { PARTNER_TYPE_LABELS } from '@/features/partners/constants';
import { STORAGE_KEYS } from '@/core/config/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const QUICK_LINKS = [
  { to: '/locations', label: 'Joy manzillari', description: "Mijozlar uchun joy manzillari ro'yxati", icon: MapPin },
  { to: '/partners', label: 'Hamkorlar', description: "Tizimga ulangan hamkorlar ro'yxati", icon: Store },
  { to: '/neighborhoods', label: "Xizmat ko'rsatish hududi", description: "Xizmat ko'rsatiladigan mahallalar chegaralari", icon: LandPlot },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Xayrli tun';
  if (hour < 12) return 'Xayrli tong';
  if (hour < 18) return 'Xayrli kun';
  return 'Xayrli kech';
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; loading: boolean }> = ({
  icon: Icon, label, value, loading,
}) => (
  <Card>
    <CardContent className="flex items-center gap-4 pt-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        {loading ? <Skeleton className="h-7 w-16 mt-1" /> : <div className="text-2xl font-semibold">{value}</div>}
      </div>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const [admin] = useState<any>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  const [locationsCount, setLocationsCount] = useState<number | null>(null);
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [neighborhoodsCount, setNeighborhoodsCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    locationsApi.getLocations({ page: 1 })
      .then((result) => { if (!cancelled) setLocationsCount(result.count); })
      .catch(() => { if (!cancelled) setLocationsCount(null); });

    partnersApi.getPartners()
      .then((result) => { if (!cancelled) setPartners(result); })
      .catch(() => { if (!cancelled) setPartners([]); });

    neighborhoodsApi.getNeighborhoods()
      .then((result) => { if (!cancelled) setNeighborhoodsCount(result.count); })
      .catch(() => { if (!cancelled) setNeighborhoodsCount(null); });

    return () => { cancelled = true; };
  }, []);

  const openPartnersCount = partners?.filter((p) => p.is_open).length ?? null;
  const recentPartners = [...(partners ?? [])]
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    .slice(0, 5);

  const displayName = admin?.full_name || admin?.email || admin?.phone_number || 'Admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{getGreeting()}, {displayName}!</h1>
        <p className="text-muted-foreground">Boshqaruv paneliga xush kelibsiz — quyida tizim holatiga umumiy nazar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MapPin} label="Joy manzillari" value={locationsCount ?? '—'} loading={locationsCount === null} />
        <StatCard icon={Store} label="Hamkorlar" value={partners?.length ?? '—'} loading={partners === null} />
        <StatCard icon={CheckCircle2} label="Ochiq hamkorlar" value={openPartnersCount ?? '—'} loading={openPartnersCount === null} />
        <StatCard icon={LandPlot} label="Xizmat hududlari" value={neighborhoodsCount ?? '—'} loading={neighborhoodsCount === null} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{link.label}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardHeader>
            </Card>
          </NavLink>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eng yuqori reytingli hamkorlar</CardTitle>
          <CardDescription>Reyting bo'yicha eng yaxshi 5 ta hamkor</CardDescription>
        </CardHeader>
        <CardContent>
          {partners === null ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          ) : recentPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Hamkorlar topilmadi.</p>
          ) : (
            <ul className="divide-y">
              {recentPartners.map((partner) => (
                <li key={partner.uuid}>
                  <NavLink
                    to={`/partners/${partner.uuid}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 rounded-lg border">
                        <AvatarImage src={partner.logo ?? undefined} alt={partner.name} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                          {partner.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{partner.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {PARTNER_TYPE_LABELS[partner.partner_type] ?? partner.partner_type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {parseFloat(partner.rating).toFixed(2)}
                      </span>
                      <Badge variant={partner.is_open ? 'success' : 'destructive'}>
                        {partner.is_open ? 'Ochiq' : 'Yopiq'}
                      </Badge>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;