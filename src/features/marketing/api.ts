import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { createResource } from '@/shared/api/resource';
import { createResourceHooks } from '@/shared/hooks/useResource';

export interface Banner {
  id: number;
  title: string;
  description: string;
  partner: string;
  partner_name: string;
  image: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

export interface Promotion {
  uuid: string;
  partner: { uuid: string; name: string };
  label: string;
  buy_quantity: number;
  get_quantity: number;
  products: string[];
  same_product: boolean;
  is_active: boolean;
  is_live: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface Audience {
  value: string;
  label: string;
  recipients: number;
}

export interface BroadcastBody {
  audience: string;
  title: string;
  body: string;
  push: boolean;
  type: 'PROMO' | 'SYSTEM';
}

export const bannersApi = createResource<Banner>(ENDPOINTS.ADMIN.BANNERS);
export const promotionsApi = createResource<Promotion>(ENDPOINTS.ADMIN.PROMOTIONS);
export const bannerHooks = createResourceHooks('banners', bannersApi);
export const promotionHooks = createResourceHooks('promotions', promotionsApi);

export const broadcastApi = {
  audiences: async (): Promise<Audience[]> => (await apiClient.get(ENDPOINTS.ADMIN.BROADCAST)).data,
  preview: async (body: BroadcastBody): Promise<{ recipients: number }> =>
    (await apiClient.post(`${ENDPOINTS.ADMIN.BROADCAST}preview/`, body)).data,
  send: async (body: BroadcastBody): Promise<{ recipients: number }> =>
    (await apiClient.post(`${ENDPOINTS.ADMIN.BROADCAST}send/`, body)).data,
};
