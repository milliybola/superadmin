import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { createResource } from '@/shared/api/resource';
import { createResourceHooks } from '@/shared/hooks/useResource';

export interface AdminAccount {
  uuid: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  is_active: boolean;
  is_blocked: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
}

export interface AuditEntry {
  id: number;
  admin_uuid: string | null;
  admin_name: string;
  method: string;
  path: string;
  action: string;
  object_uuid: string;
  status_code: number;
  ip_address: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DispatchConfig {
  courier_group_id: string;
  operator_chat_id: string | null;
  dispatch_timeout_minutes: number;
  is_active: boolean;
  has_bot_token: boolean;
}

export const adminsApi = createResource<AdminAccount>(ENDPOINTS.ADMIN.ADMINS);
export const auditApi = createResource<AuditEntry>(ENDPOINTS.ADMIN.AUDIT);
export const adminHooks = createResourceHooks('admins', adminsApi);
export const auditHooks = createResourceHooks('audit', auditApi);

export interface SmsStatus {
  enabled: boolean;
  sender: string;
  template: string;
  per_phone_daily: number;
  global_daily: number;
  balance: number | null;
  error: string;
}

export const getSmsStatus = async (): Promise<SmsStatus> => (await apiClient.get(ENDPOINTS.ADMIN.SMS_STATUS)).data;

export const dispatchApi = {
  get: async (): Promise<DispatchConfig> => (await apiClient.get(ENDPOINTS.ADMIN.DISPATCH)).data,
  save: async (body: Partial<DispatchConfig> & { bot_token?: string }): Promise<DispatchConfig> =>
    (await apiClient.patch(ENDPOINTS.ADMIN.DISPATCH, body)).data,
};
