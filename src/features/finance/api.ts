import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { createResource } from '@/shared/api/resource';
import { createResourceHooks } from '@/shared/hooks/useResource';
import type { ListQuery, Paginated } from '@/shared/api/types';

export type PaymentState = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface PaymentRow {
  provider: 'payme' | 'click';
  id: string;
  external_id: string;
  amount: number;
  state: PaymentState;
  order: { uuid: string; number: string | null };
  partner: { uuid: string; name: string };
  fiscal_status: string | null;
  reversal_status: string | null;
  created_at: string;
}

export interface PaymentsSummary {
  date_from: string;
  date_to: string;
  payme: { paid_count: number; paid_total: number; refunded_count: number; pending_count: number };
  click: {
    paid_count: number; paid_total: number; refunded_count: number; pending_count: number;
    reversal_problems: number; fiscal_failed: number;
  };
}

export interface Merchant {
  partner: { uuid: string; name: string };
  legal_name: string;
  tin: string;
  is_payme_enabled: boolean;
  payme_test_mode: boolean;
  payme_merchant_id: string;
  is_click_enabled: boolean;
  click_service_id: number | null;
  click_merchant_id: number | null;
}

export interface ReportRow {
  key: string;
  label: string;
  orders: number;
  total: number;
  delivery_fees: number;
  items: number;
  commission: number | null;
}

export interface RevenueReport {
  date_from: string;
  date_to: string;
  group: 'day' | 'partner';
  rows: ReportRow[];
  totals: { orders: number; total: number; delivery_fees: number; items: number; commission: number | null };
}

export const financeApi = {
  payments: async (query: ListQuery): Promise<Paginated<PaymentRow>> => (await apiClient.get(ENDPOINTS.ADMIN.PAYMENTS, { params: query })).data,
  summary: async (query: ListQuery): Promise<PaymentsSummary> => (await apiClient.get(`${ENDPOINTS.ADMIN.PAYMENTS}summary/`, { params: query })).data,
  revenue: async (query: ListQuery): Promise<RevenueReport> => (await apiClient.get(`${ENDPOINTS.ADMIN.REPORTS}revenue/`, { params: query })).data,
};

export const merchantsApi = createResource<Merchant>(ENDPOINTS.ADMIN.MERCHANTS);
export const merchantHooks = createResourceHooks('merchants', merchantsApi);

export const PAYMENT_STATES: Record<PaymentState, { label: string; tone: 'warning' | 'success' | 'muted' | 'info' }> = {
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  paid: { label: "To'langan", tone: 'success' },
  cancelled: { label: 'Bekor qilingan', tone: 'muted' },
  refunded: { label: 'Qaytarilgan', tone: 'info' },
};
