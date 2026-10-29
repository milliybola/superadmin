import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { createResource } from '@/shared/api/resource';
import { createResourceHooks } from '@/shared/hooks/useResource';

export type SmsProvider = 'ESKIZ' | 'ANDROID';

export interface SmsStatus {
  enabled: boolean;
  sender: string;
  template: string;
  per_phone_daily: number;
  global_daily: number;
  balance: number | null;
  error: string;
  provider: SmsProvider;
  gateway_online: number;
}

export interface SmsConfig {
  provider: SmsProvider;
  fallback_to_eskiz: boolean;
  otp_template: string;
  default_template: string;
}

export interface SmsDevice {
  uuid: string;
  name: string;
  is_active: boolean;
  is_online: boolean;
  is_paired: boolean;
  pairing_code: string | null;
  pairing_expires_at: string | null;
  last_seen_at: string | null;
  app_version: string;
  battery: number | null;
  sim_info: string;
  sent_today: number;
  failed_today: number;
  created_at: string;
}

export type SmsStatusValue = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'EXPIRED';

export interface SmsMessage {
  id: number;
  phone: string;
  text: string;
  kind: 'OTP' | 'OTHER';
  status: SmsStatusValue;
  device_name: string | null;
  error: string;
  created_at: string;
  sent_at: string | null;
  expires_at: string;
}

export const getSmsStatus = async (): Promise<SmsStatus> => (await apiClient.get(ENDPOINTS.ADMIN.SMS_STATUS)).data;

export const smsConfigApi = {
  get: async (): Promise<SmsConfig> => (await apiClient.get(ENDPOINTS.ADMIN.SMS_CONFIG)).data,
  save: async (body: Partial<SmsConfig>): Promise<SmsConfig> => (await apiClient.patch(ENDPOINTS.ADMIN.SMS_CONFIG, body)).data,
};

export const sendTestSms = async (body: { phone: string; text: string }): Promise<{ provider: string; detail: string }> =>
  (await apiClient.post(ENDPOINTS.ADMIN.SMS_TEST, body)).data;

export const smsDevicesApi = createResource<SmsDevice>(ENDPOINTS.ADMIN.SMS_DEVICES);
export const smsOutboxApi = createResource<SmsMessage>(ENDPOINTS.ADMIN.SMS_OUTBOX);
export const smsDeviceHooks = createResourceHooks('sms-devices', smsDevicesApi);
export const smsOutboxHooks = createResourceHooks('sms-outbox', smsOutboxApi);
