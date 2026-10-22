import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { downloadFile } from '@/shared/api/resource';
import type { ListQuery, Paginated } from '@/shared/api/types';

const BASE = ENDPOINTS.ADMIN.COURIERS;

export interface Vehicle {
  type: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
  plate: string | null;
}

export interface Courier {
  uuid: string;
  full_name: string;
  phone: string;
  city: string;
  courier_type: 'PLATFORM' | 'PARTNER';
  partner: { uuid: string; name: string } | null;
  status: string;
  is_online: boolean;
  is_active: boolean;
  is_verified: boolean;
  review_status: 'pending' | 'approved' | 'rejected';
  is_blocked: boolean;
  rating: number;
  balance: number;
  telegram_id: string | null;
  vehicle: Vehicle | null;
  active_orders: number;
  delivered_total: number;
  docs_total: number;
  docs_approved: number;
  last_seen: string | null;
  created_at: string;
}

export interface CourierDocument {
  id: number;
  type: string;
  type_label: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  expires_at: string | null;
  expired: boolean;
  expiring_soon: boolean;
  verified_at: string | null;
  uploaded_at: string;
  file_name: string;
}

export interface PeriodStats {
  delivered: number;
  earned: number;
}

export interface CourierDetail extends Courier {
  review_note: string;
  reviewed_at: string | null;
  reviewed_by_name: string;
  block_reason: string;
  blocked_at: string | null;
  total_earnings: number;
  total_deliveries: number;
  service_types: string;
  last_location: { latitude: number; longitude: number; speed: number; updated_at: string } | null;
  documents: CourierDocument[];
  stats: {
    today: PeriodStats;
    week: PeriodStats;
    month: PeriodStats;
    delivered_total: number;
    cancelled_total: number;
    completion_rate: number | null;
    ratings_count: number;
    rating_avg: number;
    paid_out: number;
    active_session_since: string | null;
  };
  approval: { required: string[]; missing: string[]; unapproved: string[]; ready: boolean };
}

export interface CouriersSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  blocked: number;
  online: number;
  available: number;
  busy: number;
  new_week: number;
  balance_owed: number;
  docs_expiring: number;
  deliveries_today: number;
  unassigned_orders: number;
}

export interface Transaction {
  uuid: string;
  type: 'EARNING' | 'PAYOUT' | 'BONUS' | 'PENALTY' | 'ADJUSTMENT';
  type_label: string;
  amount: number;
  balance_after: number;
  order: { uuid: string; number: string | null } | null;
  note: string;
  created_by_name: string;
  created_at: string;
}

export interface RatingsPage extends Paginated<{
  score: number;
  comment: string;
  created_at: string;
  order: { uuid: string; number: string | null } | null;
  by: string | null;
}> {
  distribution: Record<string, number>;
}

export interface MapCourier {
  uuid: string;
  name: string;
  phone: string;
  status: string;
  transport: string | null;
  rating: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updated_at: string;
  order: { uuid: string; number: string | null; status: string; partner: string | null } | null;
}

export interface WaitingOrder {
  uuid: string;
  number: string | null;
  status: string;
  created_at: string;
  partner: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string;
}

export interface CouriersMap {
  couriers: MapCourier[];
  waiting_orders: WaitingOrder[];
  generated_at: string;
}

export const couriersApi = {
  list: async (query: ListQuery): Promise<Paginated<Courier>> => (await apiClient.get(BASE, { params: query })).data,
  get: async (uuid: string): Promise<CourierDetail> => (await apiClient.get(`${BASE}${uuid}/`)).data,
  summary: async (): Promise<CouriersSummary> => (await apiClient.get(`${BASE}summary/`)).data,
  map: async (): Promise<CouriersMap> => (await apiClient.get(`${BASE}map/`)).data,

  update: async (uuid: string, body: Partial<Pick<Courier, 'city' | 'courier_type'> & { first_name: string; last_name: string }>) =>
    (await apiClient.patch(`${BASE}${uuid}/`, body)).data as CourierDetail,

  approve: async (uuid: string, force = false): Promise<CourierDetail> =>
    (await apiClient.post(`${BASE}${uuid}/approve/`, { force })).data,
  reject: async (uuid: string, reason: string): Promise<CourierDetail> =>
    (await apiClient.post(`${BASE}${uuid}/reject/`, { reason })).data,
  block: async (uuid: string, reason: string): Promise<CourierDetail> =>
    (await apiClient.post(`${BASE}${uuid}/block/`, { reason })).data,
  unblock: async (uuid: string): Promise<CourierDetail> => (await apiClient.post(`${BASE}${uuid}/unblock/`)).data,

  reviewDocument: async (uuid: string, docId: number, body: { status: 'approved' | 'rejected' | 'pending'; note?: string; expires_at?: string | null }) =>
    (await apiClient.post(`${BASE}${uuid}/documents/${docId}/review/`, body)).data as CourierDetail,

  /** Hujjat fayli JWT bilan olinadi (oddiy <img src> token yubormaydi) — blob URL qaytariladi */
  documentBlob: async (uuid: string, docId: number): Promise<{ url: string; type: string }> => {
    const res = await apiClient.get(`${BASE}${uuid}/documents/${docId}/file/`, { responseType: 'blob' });
    return { url: URL.createObjectURL(res.data as Blob), type: (res.data as Blob).type };
  },

  transactions: async (uuid: string, query: ListQuery): Promise<Paginated<Transaction>> =>
    (await apiClient.get(`${BASE}${uuid}/transactions/`, { params: query })).data,
  addTransaction: async (uuid: string, body: { type: string; amount: number; note: string }): Promise<Transaction> =>
    (await apiClient.post(`${BASE}${uuid}/transactions/`, body)).data,

  ratings: async (uuid: string, query: ListQuery): Promise<RatingsPage> =>
    (await apiClient.get(`${BASE}${uuid}/ratings/`, { params: query })).data,

  exportCsv: (query: ListQuery) => downloadFile(BASE, { ...query, export: 'csv' }, 'kuryerlar.csv'),
};
