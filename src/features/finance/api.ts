import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { createResource } from '@/shared/api/resource';
import { createResourceHooks } from '@/shared/hooks/useResource';
import type { ListQuery, Paginated } from '@/shared/api/types';

export type PaymentState = 'pending' | 'paid' | 'cancelled' | 'refunded';

/** Click muammosi: qaytarish (REQUIRED — jarayonda, FAILED — qo'lda ko'rish kerak) yoki fiskal chek xatosi */
export interface PaymentProblem {
  reversal: 'REQUIRED' | 'FAILED' | null;
  fiscal_failed: boolean;
  fiscal_error: string;
  can_retry: boolean;
  resolved: { by: string; at: string; note: string } | null;
}

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
  problem?: PaymentProblem | null;
}

export interface PaymentsSummary {
  date_from: string;
  date_to: string;
  payme: { paid_count: number; paid_total: number; refunded_count: number; pending_count: number };
  click: {
    paid_count: number; paid_total: number; refunded_count: number; pending_count: number;
    reversal_problems: number; fiscal_failed: number; open_problems: number;
  };
}

export interface Merchant {
  partner: { uuid: string; name: string };
  legal_name: string;
  tin: string;
  pinfl: string;
  is_payme_enabled: boolean;
  payme_test_mode: boolean;
  payme_merchant_id: string;
  /** Kalitning o'zi hech qachon qaytarilmaydi — faqat o'rnatilganmi */
  payme_key_set: boolean;
  is_payme_ready: boolean;
  is_click_enabled: boolean;
  click_service_id: number | null;
  click_merchant_id: number | null;
  click_merchant_user_id: number | null;
  click_secret_key_set: boolean;
  is_click_ready: boolean;
  delivery_mxik_code: string;
  delivery_package_code: string;
  delivery_vat_percent: number;
  updated_at: string | null;
  exists?: boolean;
}

export type MerchantInput = Partial<Omit<Merchant, 'partner' | 'payme_key_set' | 'click_secret_key_set' | 'is_payme_ready' | 'is_click_ready' | 'updated_at' | 'exists'>> & {
  payme_key?: string;
  click_secret_key?: string;
};

export interface ReportRow {
  key: string;
  label: string;
  orders: number;
  total: number;
  delivery_fees: number;
  items: number;
}

export interface RevenueReport {
  date_from: string;
  date_to: string;
  group: 'day' | 'partner';
  rows: ReportRow[];
  totals: { orders: number; total: number; delivery_fees: number; items: number };
  commission_note: string;
}

/** Q31: MilliyGo kutilayotgan daromadi (tarif oylik to'lovi + kvotadan ortgan buyurtma haqi), to'lov holatisiz */
export interface ExpectedRevenueRow {
  uuid: string;
  name: string;
  tariff: { code: string; name: string };
  subscription: number;
  orders: number;
  free_orders: number | null;
  orders_over: number;
  extra_order_fee: number;
  overage_fee: number;
  total: number;
}

export interface ExpectedRevenueTotals {
  partners: number;
  paying_partners: number;
  subscriptions: number;
  overage_fees: number;
  orders_over: number;
  total: number;
}

export interface ExpectedRevenue {
  month: string;
  note: string;
  totals: ExpectedRevenueTotals;
  rows: ExpectedRevenueRow[];
}

export const financeApi = {
  payments: async (query: ListQuery): Promise<Paginated<PaymentRow>> => (await apiClient.get(ENDPOINTS.ADMIN.PAYMENTS, { params: query })).data,
  summary: async (query: ListQuery): Promise<PaymentsSummary> => (await apiClient.get(`${ENDPOINTS.ADMIN.PAYMENTS}summary/`, { params: query })).data,
  revenue: async (query: ListQuery): Promise<RevenueReport> => (await apiClient.get(`${ENDPOINTS.ADMIN.REPORTS}revenue/`, { params: query })).data,
  expectedRevenue: async (query: ListQuery): Promise<ExpectedRevenue> =>
    (await apiClient.get(`${ENDPOINTS.ADMIN.REPORTS}expected-revenue/`, { params: query })).data,
  retryClick: async (uuid: string): Promise<PaymentRow> => (await apiClient.post(`${ENDPOINTS.ADMIN.PAYMENTS}click/${uuid}/retry/`, {})).data,
  resolveClick: async (uuid: string, note: string) => (await apiClient.post(`${ENDPOINTS.ADMIN.PAYMENTS}click/${uuid}/resolve/`, { note })).data,
  merchant: async (partnerUuid: string): Promise<Merchant> => (await apiClient.get(`${ENDPOINTS.ADMIN.MERCHANTS}partner/${partnerUuid}/`)).data,
  saveMerchant: async (partnerUuid: string, body: MerchantInput): Promise<Merchant> =>
    (await apiClient.put(`${ENDPOINTS.ADMIN.MERCHANTS}partner/${partnerUuid}/`, body)).data,
};

export const merchantsApi = createResource<Merchant>(ENDPOINTS.ADMIN.MERCHANTS);
export const merchantHooks = createResourceHooks('merchants', merchantsApi);

export const PAYMENT_STATES: Record<PaymentState, { label: string; tone: 'warning' | 'success' | 'muted' | 'info' }> = {
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  paid: { label: "To'langan", tone: 'success' },
  cancelled: { label: 'Bekor qilingan', tone: 'muted' },
  refunded: { label: 'Qaytarilgan', tone: 'info' },
};
