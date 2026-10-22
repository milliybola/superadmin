import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import type { ListQuery, Paginated } from '@/shared/api/types';

export interface PartnerBrief {
  uuid: string;
  name: string;
  type: string;
  phone: string;
  logo: string | null;
}

export interface CustomerBrief {
  uuid: string | null;
  name: string;
  phone: string;
  registered: boolean;
}

export interface CourierBrief {
  uuid: string;
  name: string;
  phone: string;
  status: string;
}

export interface OrderListItem {
  uuid: string;
  order_number: string;
  status: string;
  delivery_type: string;
  order_source: string;
  payment_method: string;
  is_paid: boolean;
  total_price: number;
  delivery_fee: number;
  items_count: number;
  partner: PartnerBrief | null;
  customer: CustomerBrief;
  courier: CourierBrief | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  uuid: string;
  product: { uuid: string | null; name: string; image: string | null };
  quantity: number;
  unit: 'PIECE' | 'KG';
  packaging_name: string;
  price_at_time_of_order: number;
  free_quantity: number;
  discount_amount: number;
  promotion_label: string;
  line_total: number;
  options: { group: string; name: string; price: number }[];
}

export interface OrderHistoryEntry {
  from_status: string;
  to_status: string;
  actor_type: string;
  actor_name: string;
  note: string;
  created_at: string;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItem[];
  status_history: OrderHistoryEntry[];
  dispatch_log: { action: string; success: boolean; courier: CourierBrief | null; created_at: string }[];
  filial_name: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  reject_reason: string | null;
  table_number: string | null;
  evaluation: boolean;
  no_couriers_nearby: boolean;
  subtotal: number;
  discount_amount: number;
}

export interface OrderMeta {
  statuses: { value: string; label: string }[];
  delivery_types: { value: string; label: string }[];
  payment_methods: { value: string; label: string }[];
  sources: { value: string; label: string }[];
  terminal_statuses: string[];
}

export const ordersApi = {
  list: async (query: ListQuery): Promise<Paginated<OrderListItem>> =>
    (await apiClient.get(ENDPOINTS.ADMIN.ORDERS, { params: query })).data,

  get: async (uuid: string): Promise<OrderDetail> => (await apiClient.get(`${ENDPOINTS.ADMIN.ORDERS}${uuid}/`)).data,

  meta: async (): Promise<OrderMeta> => (await apiClient.get(`${ENDPOINTS.ADMIN.ORDERS}meta/`)).data,

  changeStatus: async (uuid: string, body: { status: string; note?: string; force?: boolean }): Promise<OrderDetail> =>
    (await apiClient.post(`${ENDPOINTS.ADMIN.ORDERS}${uuid}/change-status/`, body)).data,

  assignCourier: async (uuid: string, courier: string | null): Promise<OrderDetail> =>
    (await apiClient.post(`${ENDPOINTS.ADMIN.ORDERS}${uuid}/assign-courier/`, { courier })).data,
};
