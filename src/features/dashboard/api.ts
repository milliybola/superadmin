import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';

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
