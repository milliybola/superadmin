import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';

export type VerificationStatus = 'UNVERIFIED' | 'TRUSTED' | 'BLOCKED';
export type AttemptOutcome = 'CONFIRMED' | 'REJECTED' | 'NO_ANSWER' | 'BUSY' | 'CALLBACK' | 'OTHER';
export type RiskCode = 'HIGH_CASH' | 'NO_POINT' | 'FAR' | 'NO_ADDRESS' | 'NIGHT' | 'BAD_HISTORY';

export interface VerificationAttempt {
  outcome: AttemptOutcome;
  note: string;
  admin_name: string;
  created_at: string;
}

export interface VerificationItem {
  uuid: string;
  order_number: string;
  status: string;
  created_at: string;
  waiting_seconds: number;
  expires_at: string;
  delivery_type: string;
  payment_method: string;
  total_price: number;
  delivery_fee: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  contact_phone: string;
  contact_name: string | null;
  partner: { uuid: string; name: string; type: string; phone: string; logo: string | null } | null;
  customer: {
    uuid: string | null;
    name: string;
    phone: string;
    registered: boolean;
    orders_total: number;
    delivered: number;
    cancelled: number;
    verification_status: VerificationStatus | null;
    verification_note?: string;
  };
  items: {
    uuid: string;
    product: { name: string; image: string | null };
    quantity: number;
    unit: 'PIECE' | 'KG';
    packaging_name: string;
    free_quantity: number;
    price_at_time_of_order: number;
    line_total: number;
    options: { group: string; name: string; price: number }[];
  }[];
  risk_flags: { code: RiskCode; label: string }[];
  attempts: VerificationAttempt[];
  reject_reason: string | null;
}

export interface CustomerVerification {
  user: { uuid: string; name: string; phone: string };
  status: VerificationStatus;
  trusted_at: string | null;
  trusted_via: string;
  revoked_at: string | null;
  note: string;
  reviewed_by: string;
  orders_total: number;
  delivered: number;
  cancelled: number;
}

export type CustomerAction = 'trust' | 'revoke' | 'block' | 'unblock';

const base = ENDPOINTS.ADMIN.VERIFICATIONS;
const customers = ENDPOINTS.ADMIN.CUSTOMERS;

export const verificationApi = {
  list: async (scope: 'pending' | 'history'): Promise<VerificationItem[]> =>
    (await apiClient.get(base, { params: { scope } })).data.results,

  approve: async (uuid: string, note?: string): Promise<VerificationItem> =>
    (await apiClient.post(`${base}${uuid}/approve/`, { note: note || undefined })).data,

  reject: async (uuid: string, body: { reason: string; block_customer: boolean }): Promise<VerificationItem> =>
    (await apiClient.post(`${base}${uuid}/reject/`, body)).data,

  attempt: async (uuid: string, body: { outcome: 'NO_ANSWER' | 'BUSY' | 'CALLBACK' | 'OTHER'; note?: string }): Promise<VerificationItem> =>
    (await apiClient.post(`${base}${uuid}/attempt/`, body)).data,

  customer: async (userUuid: string): Promise<CustomerVerification> =>
    (await apiClient.get(`${customers}${userUuid}/verification/`)).data,

  customerAction: async (userUuid: string, body: { action: CustomerAction; reason?: string }): Promise<CustomerVerification> =>
    (await apiClient.post(`${customers}${userUuid}/verification/`, body)).data,
};
