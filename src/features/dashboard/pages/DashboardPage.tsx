import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Banknote, Bike, ShoppingBag, Store, UserPlus, Users, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { ErrorState } from '@/shared/components/State';
import { Pill } from '@/shared/components/Pill';
import { deltaPercent, formatCompact, formatMoney, formatNumber, formatTime } from '@/shared/lib/format';
import { ORDER_STATUSES, ACTIVE_STATUSES, PAYMENT_METHODS, DELIVERY_TYPES } from '@/features/orders/constants';
import { PARTNER_TYPE_LABELS } from '@/features/partners/constants';
import { STORAGE_KEYS } from '@/core/config/constants';
import { useStage } from '@/app/stage';
import { dashboardApi } from '../api';

const PERIODS = [
  { value: '7', label: 'Oxirgi 7 kun' },
  { value: '14', label: 'Oxirgi 14 kun' },
  { value: '30', label: 'Oxirgi 30 kun' },
  { value: '90', label: 'Oxirgi 90 kun' },
];

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#14b8a6', '#64748b'];

const num = (v: string | number) => Number(v) || 0;
const shortDate = (iso: string) => iso.slice(8, 10) + '.' + iso.slice(5, 7);

const greeting = () => {
  const h = new Date().getHours();
  return h < 6 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech';
};

const tooltipStyle = {
  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))',
};

function ChartCard({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { stage } = useStage();
  const [days, setDays] = useState('14');
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard', days],
    queryFn: () => dashboardApi.get(Number(days)),
    refetchInterval: 30_000,
  });

  const adminName = useMemo(() => {
    try {
      const a = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_DATA) ?? 'null');
      return a?.full_name || a?.email || a?.phone_number || 'Admin';
    } catch {
      return 'Admin';
    }
  }, []);

  const series = useMemo(() => data?.series.map((s) => ({ ...s, label: shortDate(s.date), revenue: num(s.revenue) })) ?? [], [data]);
  const statusData = useMemo(
    () => Object.entries(data?.status_breakdown ?? {}).map(([k, v]) => ({ name: ORDER_STATUSES[k]?.label ?? k, value: v })).sort((a, b) => b.value - a.value),
    [data],
  );
  const paymentData = useMemo(
    () => data?.payment_methods.map((p) => ({ name: PAYMENT_METHODS[p.method] ?? p.method, value: num(p.revenue) })) ?? [],
    [data],
  );

  if (error && !data) return <ErrorState onRetry={refetch} />;

  const t = data?.today;
  const y = data?.yesterday;
  const live = data?.live;
  const activeRows = ACTIVE_STATUSES.filter((s) => s !== 'NEW' && (live?.active_by_status[s] ?? 0) > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${adminName}!`}
        description={dataUpdatedAt ? `Yangilangan: ${formatTime(new Date(dataUpdatedAt))} · avtomatik yangilanadi` : 'Yuklanmoqda...'}
        actions={
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>{PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Bugungi buyurtmalar" loading={isLoading} value={formatNumber(t?.orders)}
          delta={t && y ? deltaPercent(t.orders, y.orders) : undefined} hint="kechaga nisbatan" />
        <StatCard icon={Banknote} tone="success" label="Bugungi tushum" loading={isLoading} value={formatMoney(t?.revenue)}
          delta={t && y ? deltaPercent(num(t.revenue), num(y.revenue)) : undefined} hint="kechaga nisbatan" />
        <StatCard icon={XCircle} tone="danger" label="Bekor qilingan" loading={isLoading} value={formatNumber(t?.cancelled)}
          delta={t && y ? deltaPercent(t.cancelled, y.cancelled) : undefined} invertDelta hint="kechaga nisbatan" />
        <StatCard icon={UserPlus} tone="info" label="Yangi mijozlar" loading={isLoading} value={formatNumber(t?.new_users)}
          delta={t && y ? deltaPercent(t.new_users, y.new_users) : undefined} hint="kechaga nisbatan" />
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${stage === 1 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
        <StatCard icon={Activity} tone="warning" label="Faol buyurtmalar" loading={isLoading} value={formatNumber(live?.active_orders)}
          hint={live?.awaiting_payment ? `${live.awaiting_payment} ta to'lov kutmoqda` : undefined} />
        {stage >= 2 && (
          <StatCard icon={Bike} label="Kuryerlar (onlayn)" loading={isLoading} value={`${live?.couriers.online ?? 0} / ${live?.couriers.total ?? 0}`}
            hint={`${live?.couriers.available ?? 0} ta bo'sh`} />
        )}
        <StatCard icon={Store} tone="success" label="Ochiq hamkorlar" loading={isLoading} value={`${live?.partners.open ?? 0} / ${live?.partners.total ?? 0}`} />
        <StatCard icon={Users} tone="info" label="Mijozlar" loading={isLoading} value={formatNumber(live?.customers_total)}
          hint={`o'rtacha chek: ${formatMoney(t?.avg_check)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Tushum dinamikasi" description="Yetkazilgan buyurtmalar summasi" className="lg:col-span-2">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={formatCompact} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatMoney(Number(v)), 'Tushum']} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Hozirgi faol buyurtmalar" description="Holatlar bo'yicha">
          {activeRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Hozir faol buyurtma yo'q.</p>
          ) : (
            <ul className="space-y-2">
              {activeRows.map((s) => (
                <li key={s}>
                  <Link to={`/orders?status=${s}`} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-accent">
                    <Pill tone={ORDER_STATUSES[s]?.tone} dot>{ORDER_STATUSES[s]?.label ?? s}</Pill>
                    <span className="font-semibold tabular-nums">{live?.active_by_status[s]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Buyurtmalar" description="Kunlar bo'yicha: yetkazilgan va bekor qilingan" className="lg:col-span-2">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--accent))' }} />
                <Bar dataKey="delivered" name="Yetkazilgan" stackId="a" fill="#10b981" />
                <Bar dataKey="cancelled" name="Bekor qilingan" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Holatlar ulushi" description={`Oxirgi ${days} kun`}>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {statusData.map((s, i) => (
              <li key={s.name} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="truncate text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-medium tabular-nums">{s.value}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Soatlar bo'yicha yuklama" description="Qaysi vaqtda ko'p buyurtma tushadi" className="lg:col-span-2">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.hours ?? []} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--accent))' }} labelFormatter={(h) => `${h}:00`} formatter={(v) => [v, 'Buyurtma']} />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="To'lov usullari" description="Tushum bo'yicha">
          {paymentData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Ma'lumot yo'q.</p>
          ) : (
            <ul className="space-y-3">
              {paymentData.map((p, i) => {
                const total = paymentData.reduce((a, b) => a + b.value, 0) || 1;
                return (
                  <li key={p.name} className="text-sm">
                    <div className="mb-1 flex justify-between"><span>{p.name}</span><span className="font-medium tabular-nums">{formatMoney(p.value)}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(p.value / total) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {data && Object.keys(data.delivery_types).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
              {Object.entries(data.delivery_types).map(([k, v]) => <Pill key={k}>{DELIVERY_TYPES[k] ?? k}: {v}</Pill>)}
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Eng yaxshi hamkorlar" description={`Tushum bo'yicha, oxirgi ${days} kun`}>
        {data?.top_partners.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Yetkazilgan buyurtmalar hali yo'q.</p>}
        <ul className="divide-y">
          {data?.top_partners.map((p, i) => (
            <li key={p.uuid}>
              <Link to={`/partners/${p.uuid}`} className="flex items-center gap-3 py-3 hover:bg-accent/50">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{PARTNER_TYPE_LABELS[p.type] ?? p.type} · {p.orders} ta buyurtma</div>
                </div>
                <span className="font-semibold tabular-nums">{formatMoney(p.revenue)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}
