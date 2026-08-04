import apiClient from '../../../core/api/client';
import { ENDPOINTS } from '../../../core/config/constants';

export interface PartnerOpeningHours {
  uuid: string;
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
  from_hour: string;
  to_hour: string;
}

export interface Partner {
  uuid: string;
  id: number;
  name: string;
  description: string;
  address: string;
  logo: string | null;
  service_type: string;
  service_amount: string;
  slug: string;
  banner: string | null;
  phone: string;
  email: string | null;
  location_lat: number | null;
  location_long: number | null;
  rating: string;
  is_open: boolean;
  partner_type: string;
  distance: number | null;
  opening_hours: PartnerOpeningHours | null;
  min_order_amount: string | null;
  max_order_amount: string | null;
  free_delivery_threshold: string | null;
  delivery_fee: string | null;
}

export const partnersApi = {
  // GET /partner/ returns everything in one shot — no pagination params.
  getPartners: async (): Promise<Partner[]> => {
    const response = await apiClient.get(ENDPOINTS.PARTNERS.BASE);
    return response.data.data?.partners ?? response.data.partners ?? [];
  },

  getPartner: async (uuid: string): Promise<Partner> => {
    const response = await apiClient.get(ENDPOINTS.PARTNERS.DETAIL(uuid));
    return response.data.data ?? response.data;
  },
};
