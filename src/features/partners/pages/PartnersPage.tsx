import React, { useEffect, useMemo, useState } from 'react';
import { Store, Search, Star, Eye, Inbox } from 'lucide-react';
import { partnersApi } from '../services/partnersApi';
import type { Partner } from '../services/partnersApi';
import { PARTNER_TYPE_LABELS } from '../constants';
import PartnerDetailDialog from '../components/PartnerDetailDialog';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Partner | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    partnersApi.getPartners()
      .then((result) => {
        if (!cancelled) setPartners(result);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Hamkorlarni yuklashda xatolik yuz berdi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q)
    );
  }, [partners, search]);

  const handleViewDetail = (partner: Partner) => {
    setSelected(partner);
    setDetailOpen(true);
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Store className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hamkorlar</h1>
          <p className="text-sm text-muted-foreground">Tizimga ulangan hamkorlar (restoran, do'kon) ro'yxati</p>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardDescription>Jami {partners.length} ta hamkor topildi</CardDescription>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, manzil yoki telefon bo'yicha qidirish"
                className="pl-9 sm:w-80"
              />
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
                  <TableHead>Hamkor</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Reyting</TableHead>
                  <TableHead>Holati</TableHead>
                  <TableHead>Manzil</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-lg" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Inbox className="h-8 w-8" />
                        <span>Hech qanday hamkor topilmadi.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((partner) => (
                    <TableRow key={partner.uuid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-lg border">
                            <AvatarImage src={partner.logo ?? undefined} alt={partner.name} />
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                              {partner.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{partner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{PARTNER_TYPE_LABELS[partner.partner_type] ?? partner.partner_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {parseFloat(partner.rating).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={partner.is_open ? 'success' : 'destructive'}>
                          {partner.is_open ? 'Ochiq' : 'Yopiq'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{partner.address}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{partner.phone}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetail(partner)}>
                          <Eye className="h-3.5 w-3.5" />
                          Batafsil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PartnerDetailDialog partner={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
};

export default PartnersPage;
