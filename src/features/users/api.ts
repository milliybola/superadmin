import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import type { ListQuery, Paginated } from '@/shared/api/types';
import type { OrderListItem } from '@/features/orders/api';

export interface AdminUser {
  uuid: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  role: string;
  status: string;
  is_active: boolean;
  is_blocked: boolean;
  is_verified: boolean;
  avatar: string | null;
  telegram_id: string | null;
  date_joined: string;
  last_login: string | null;
  orders_count: number;
  delivered_count: number;
  total_spent: number;
  last_order_at: string | null;
}

export interface UserAddress {
  uuid: string;
  label: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

export interface AdminUserDetail extends AdminUser {
  addresses: UserAddress[];
  recent_orders: OrderListItem[];
  devices: { device_type: string; is_active: boolean; created_at: string }[];
  unread_notifications: number;
}

export interface UserUpdate {
  full_name?: string;
  email?: string | null;
  is_blocked?: boolean;
  is_active?: boolean;
}

export const usersApi = {
  list: async (query: ListQuery): Promise<Paginated<AdminUser>> =>
    (await apiClient.get(ENDPOINTS.ADMIN.USERS, { params: query })).data,

  get: async (uuid: string): Promise<AdminUserDetail> => (await apiClient.get(`${ENDPOINTS.ADMIN.USERS}${uuid}/`)).data,

  update: async (uuid: string, body: UserUpdate): Promise<AdminUserDetail> =>
    (await apiClient.patch(`${ENDPOINTS.ADMIN.USERS}${uuid}/`, body)).data,

  block: async (uuid: string, blocked: boolean): Promise<AdminUserDetail> =>
    (await apiClient.post(`${ENDPOINTS.ADMIN.USERS}${uuid}/${blocked ? 'block' : 'unblock'}/`)).data,
};
