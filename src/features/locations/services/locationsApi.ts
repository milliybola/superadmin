import apiClient from '../../../core/api/client';
import { ENDPOINTS } from '../../../core/config/constants';

export type LocationType =
  | 'GOVERNMENT'
  | 'MARKET'
  | 'HOSPITAL'
  | 'EDUCATION'
  | 'TRANSPORT'
  | 'SHOPPING'
  | 'LANDMARK'
  | 'RESIDENTIAL'
  | 'OTHER';

export interface Location {
  uuid: string;
  name: string;
  description?: string | null;
  location_type: LocationType;
  location_type_display: string;
  address: string;
  orientir?: string | null;
  latitude: string;
  longitude: string;
  order?: number;
}

export interface LocationTypeOption {
  value: LocationType;
  label: string;
}

export interface LocationPayload {
  name: string;
  description?: string;
  location_type: LocationType;
  address: string;
  orientir?: string;
  latitude: string;
  longitude: string;
  order?: number;
}

export interface LocationsQuery {
  location_type?: LocationType | '';
  search?: string;
  page?: number;
}

export interface LocationsResult {
  count: number;
  locations: Location[];
  hasNext: boolean;
}

export const locationsApi = {
  // The list endpoint returns Django REST Framework's standard pagination
  // shape directly ({count, next, previous, results}) — no {success, data}
  // envelope, unlike the detail/create/update endpoints.
  getLocations: async (query: LocationsQuery): Promise<LocationsResult> => {
    const params: Record<string, string | number> = {};
    if (query.location_type) params.location_type = query.location_type;
    if (query.search) params.search = query.search;
    if (query.page) params.page = query.page;

    const response = await apiClient.get(ENDPOINTS.LOCATIONS.BASE, { params });
    return {
      count: response.data.count,
      locations: response.data.results,
      hasNext: response.data.next !== null,
    };
  },

  getLocation: async (uuid: string): Promise<Location> => {
    const response = await apiClient.get(ENDPOINTS.LOCATIONS.DETAIL(uuid));
    return response.data.data ?? response.data;
  },

  getLocationTypes: async (): Promise<LocationTypeOption[]> => {
    const response = await apiClient.get(ENDPOINTS.LOCATIONS.TYPES);
    return response.data.data ?? response.data;
  },

  createLocation: async (payload: LocationPayload): Promise<Location> => {
    const response = await apiClient.post(ENDPOINTS.LOCATIONS.BASE, payload);
    return response.data.data ?? response.data;
  },

  updateLocation: async (uuid: string, payload: Partial<LocationPayload>): Promise<Location> => {
    const response = await apiClient.patch(ENDPOINTS.LOCATIONS.DETAIL(uuid), payload);
    return response.data.data ?? response.data;
  },

  // Walks every page of the paginated list endpoint to build a complete
  // set — used by the map overview, which needs every location plotted
  // at once rather than one page at a time.
  getAllLocations: async (): Promise<Location[]> => {
    const all: Location[] = [];
    let page = 1;

    while (page <= 50) {
      const result = await locationsApi.getLocations({ page });
      all.push(...result.locations);
      if (!result.hasNext) break;
      page += 1;
    }

    return all;
  },
};
