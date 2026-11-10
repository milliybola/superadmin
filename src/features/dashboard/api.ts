import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import type { ExpectedRevenueRow, ExpectedRevenueTotals } from '@/features/finance/api';

interface PeriodStats {
  orders: number;
  delivered: number;
  cancelled: number;
  revenue: string | number;
  avg_check: string | number;
  new_users: number;
}

export interface DashboardData {
  generated_at: string;
  days: number;
  today: PeriodStats;
  yesterday: PeriodStats;
  live: {
    active_orders: number;
    active_by_status: Record<string, number>;
    awaiting_payment: number;
    awaiting_verification?: number;
    couriers: { total: number; online: number; available: number };
    partners: { total: number; open: number };
    customers_total: number;
  };
  series: { date: string; orders: number; delivered: number; cancelled: number; revenue: string | number }[];
  status_breakdown: Record<string, number>;
  payment_methods: { method: string; orders: number; revenue: string | number }[];
  delivery_types: Record<string, number>;
  hours: { hour: number; orders: number }[];
  top_partners: { uuid: string; name: string; type: string; orders: number; revenue: string | number }[];
}

export const dashboardApi = {
  get: async (days: number): Promise<DashboardData> =>
    (await apiClient.get(ENDPOINTS.ADMIN.DASHBOARD, { params: { days } })).data,
};

// ── Platforma raqamlari (S2): ilova va kassa savdosi alohida ─────────────────

export type StatsPeriod = 'today' | 'week' | 'month';

export interface SourceStats {
  orders: number;
  /** Yetkazilgan va to'langan */
  sold: number;
  /** Yetkazilgan, lekin to'lanmagan — savdoga kirmaydi (nazorat raqami) */
  unpaid_completed: number;
  cancelled: number;
  cancel_rate: number;
  /** total_price − delivery_fee */
  sales: number;
  avg_check: number;
  delivery_fees: number;
  service_charge: number;
}

export interface SourceWithPrev extends SourceStats {
  prev: SourceStats;
  delta: Record<'orders' | 'sold' | 'sales' | 'avg_check', number | null>;
}

export interface BreakdownRow {
  uuid: string | null;
  name: string;
  app_sold: number;
  app_sales: number;
  pos_sold: number;
  pos_sales: number;
  sales: number;
  prev_sales: number;
  delta: number | null;
  delivery_fees: number;
  orders: number;
  cancelled: number;
  unpaid_completed: number;
}

interface PromoStats { amount: number; free_qty: number; orders: number }
interface OnlineProvider { paid_count: number; paid_total: number; refunded_count: number; refunded_total: number }

export interface PlatformStats {
  generated_at: string;
  period: StatsPeriod;
  scope: { partner: { uuid: string; name: string } | null; filial: { uuid: string; name: string } | null };
  sources: { app: SourceWithPrev; pos: SourceWithPrev; total: SourceWithPrev };
  promo: { app: PromoStats; pos: PromoStats; total: PromoStats };
  customers: { active: number; new: number; returning: number; returning_rate: number };
  timing: { avg_prep_minutes: number | null; prep_orders: number; avg_delivery_minutes: number | null; delivery_orders: number };
  online: OnlineProvider & { payme: OnlineProvider; click: OnlineProvider; problems: number };
  partners: {
    total: number; new: number; active: number; active_app: number;
    no_app_orders_days: number; no_app_orders_count: number; no_app_orders: { uuid: string; name: string }[];
    by_tariff: { code: string; name: string; partners: number }[];
  };
  quota: {
    month_start: string; partners_over: number; orders_over: number;
    near_or_over: { uuid: string; name: string; tariff: string; used: number; free: number; over: number }[];
  };
  /** Q31: joriy oy kutilayotgan daromadi (tarif + kvotadan ortgan), komissiyasiz (Q28) */
  expected_revenue: {
    month: string; note: string;
    totals: ExpectedRevenueTotals;
    top: ExpectedRevenueRow[];
  };
  breakdown: { by: 'partner' | 'filial'; rows: BreakdownRow[]; total_rows: number };
}

export const platformStatsApi = {
  get: async (params: { period: StatsPeriod; partner?: string; filial?: string }): Promise<PlatformStats> =>
    (await apiClient.get(ENDPOINTS.ADMIN.PLATFORM_STATS, { params })).data,
};
