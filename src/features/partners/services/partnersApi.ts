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

// Shapes below aren't confirmed against a real admin-authorized response —
// they mirror what the partner-facing app expects from its own session.
// Fields are optional/defensive on purpose; UI must tolerate any of them
// being absent.
export interface PartnerStatistics {
  overall?: {
    total_orders?: number;
    delivered?: number;
    cancelled?: number;
    total_revenue?: number | string;
    total_delivery_fees?: number | string;
    net_revenue?: number | string;
  };
  today?: PartnerStatsPeriod;
  this_week?: PartnerStatsPeriod;
  this_month?: PartnerStatsPeriod;
  commission?: {
    type?: string;
    rate?: number | string;
    total_commission?: number | string;
    month_commission?: number | string;
  };
}

export interface PartnerStatsPeriod {
  orders_count?: number;
  delivered?: number;
  cancelled?: number;
  revenue?: number | string;
  delivery_fees?: number | string;
  cancelled_revenue?: number | string;
  net_revenue?: number | string;
  average_check?: number | string;
}

export interface PartnerStaffMember {
  uuid: string;
  full_name?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  phone?: string;
}

export interface PartnerFilial {
  uuid: string;
  filial_name?: string;
  filial_status?: string;
  address?: string;
  phone?: string;
  is_main?: boolean;
}

export interface Product {
  id: number;
  uuid: string;
  name: string;
  description: string;
  price: string;
  sale_price: string | null;
  is_available: boolean;
  is_active: boolean;
  stock_status: string;
}

export interface ProductsResult {
  count: number;
  products: Product[];
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

  // skipAuthRedirect: these are best-effort probes against endpoints whose
  // admin-scoped access isn't confirmed — a 401 here means "this section
  // isn't available to us", not "the admin's own session expired", so it
  // must not trigger the global logout-and-redirect-to-login behavior.
  getPartnerStatistics: async (uuid: string): Promise<PartnerStatistics> => {
    const response = await apiClient.get(ENDPOINTS.PARTNERS.STATISTICS, {
      params: { partner: uuid },
      skipAuthRedirect: true,
    });
    return response.data.data ?? response.data;
  },

  getPartnerStaff: async (uuid: string): Promise<PartnerStaffMember[]> => {
    const response = await apiClient.get(ENDPOINTS.PARTNERS.STAFF, {
      params: { partner: uuid },
      skipAuthRedirect: true,
    });
    const data = response.data.data ?? response.data;
    return Array.isArray(data) ? data : data?.results ?? data?.staff ?? [];
  },

  getPartnerFilials: async (uuid: string): Promise<PartnerFilial[]> => {
    const response = await apiClient.get(ENDPOINTS.PARTNERS.FILIALS, {
      params: { partner: uuid },
      skipAuthRedirect: true,
    });
    const data = response.data.data ?? response.data;
    return Array.isArray(data) ? data : data?.results ?? data?.filials ?? [];
  },

  // Confirmed working — /products/ is publicly filterable by partner uuid.
  getPartnerProducts: async (uuid: string, page = 1): Promise<ProductsResult> => {
    const response = await apiClient.get(ENDPOINTS.PRODUCTS.BASE, {
      params: { partner: uuid, page },
      skipAuthRedirect: true,
    });
    return {
      count: response.data.count ?? 0,
      products: response.data.results ?? [],
    };
  },
};