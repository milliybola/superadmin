import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { createResource } from '@/shared/api/resource';
import { createResourceHooks } from '@/shared/hooks/useResource';

export interface Cuisine {
  uuid: string;
  name: string;
  order?: number;
  is_active?: boolean;
  partners_count?: number;
}

export interface Commission {
  commission_type: 'percentage' | 'fixed';
  percentage: number | null;
  fixed_amount: number | null;
}

export interface PartnerListItem {
  uuid: string;
  name: string;
  partner_type: 'RESTAURANT' | 'SHOP';
  phone: string;
  address: string;
  logo: string | null;
  rating: number;
  is_active: boolean;
  is_open: boolean;
  is_blocked: boolean;
  cuisines: Cuisine[];
  filials_count: number;
  orders_count: number;
  revenue: number;
  delivery_time_minutes: number;
  service_type: string;
  tariff: { uuid: string; code: string; name: string } | null;
  service_amount: string;
  created_at: string;
}

export interface FilialBrief {
  uuid: string;
  filial_name: string;
  filial_status: string;
  address: string;
  phone: string;
  is_main: boolean;
}

export interface PartnerDetail extends PartnerListItem {
  description: string;
  email: string | null;
  slug: string;
  banner: string | null;
  location_lat: number;
  location_long: number;
  min_order_amount: number;
  max_order_amount: number | null;
  free_delivery_threshold: number | null;
  delivery_fee: number;
  telegram_group_id: string | null;
  owner: { uuid: string; full_name: string; phone: string } | null;
  commission: Commission | null;
  filials: FilialBrief[];
  staff_count: number;
  stats: { orders: number; delivered: number; cancelled: number; revenue: number };
  tariff_info: TariffUsage;
}

export interface Filial {
  uuid: string;
  partner: string;
  partner_name: string;
  filial_name: string;
  filial_status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  address: string;
  phone: string;
  location_lat: number | null;
  location_long: number | null;
  manager: string | null;
  manager_name: string | null;
  is_main: boolean;
}

export interface OpeningHours {
  mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean;
  from_hour: string;
  to_hour: string;
}

export interface Staff {
  uuid: string;
  partner: string;
  partner_name: string;
  role: 'manager' | 'waiter';
  name: string;
  phone: string;
  is_active: boolean;
  home_filial: string | null;
  home_filial_name: string | null;
  created_at: string;
}

export interface Tariff {
  uuid: string;
  code: string;
  name: string;
  description: string;
  price_monthly: number;
  allow_pickup: boolean;
  allow_dine_in: boolean;
  /** null — cheksiz */
  max_tables: number | null;
  max_filials: number | null;
  is_default: boolean;
  is_active: boolean;
  order: number;
  partners_count: number;
}

/** Hamkorning joriy tarifi va foydalanishi (filial/stol soni) */
export interface TariffUsage {
  code: string;
  name: string;
  restricted: boolean;
  allow_pickup: boolean;
  allow_dine_in: boolean;
  max_tables: number | null;
  max_filials: number | null;
  usage: { tables: number; filials: number };
}

export const tariffsApi = createResource<Tariff>(ENDPOINTS.ADMIN.TARIFFS);
export const tariffHooks = createResourceHooks('tariffs', tariffsApi);

export const partnersApi = createResource<PartnerListItem, PartnerDetail>(ENDPOINTS.ADMIN.PARTNERS);
export const filialsApi = createResource<Filial>(ENDPOINTS.ADMIN.FILIALS);
export const staffApi = createResource<Staff>(ENDPOINTS.ADMIN.STAFF);
export const cuisinesApi = createResource<Cuisine>(ENDPOINTS.ADMIN.CUISINES);

export const getCommission = async (uuid: string): Promise<Commission | null> =>
  (await apiClient.get(`${ENDPOINTS.ADMIN.PARTNERS}${uuid}/commission/`)).data;

export const getOpeningHours = async (filial: string): Promise<OpeningHours> =>
  (await apiClient.get(`${ENDPOINTS.ADMIN.FILIALS}${filial}/opening-hours/`)).data;

export const partnerHooks = createResourceHooks('partners', partnersApi);
export const filialHooks = createResourceHooks('filials', filialsApi);
export const staffHooks = createResourceHooks('staff', staffApi);
export const cuisineHooks = createResourceHooks('cuisines', cuisinesApi);
