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
  location_type: LocationType;
  location_type_display: string;
  address: string;
  latitude: string;
  longitude: string;
}

export interface LocationsQuery {
  location_type?: LocationType | '';
  search?: string;
  page?: number;
}

export interface LocationsResult {
  count: number;
  locations: Location[];
}

export const locationsApi = {
  getLocations: async (query: LocationsQuery): Promise<LocationsResult> => {
    const params: Record<string, string | number> = {};
    if (query.location_type) params.location_type = query.location_type;
    if (query.search) params.search = query.search;
    if (query.page) params.page = query.page;

    const response = await apiClient.get(ENDPOINTS.LOCATIONS.BASE, { params });
    return response.data.data;
  },

  getLocation: async (uuid: string): Promise<Location> => {
    const response = await apiClient.get(ENDPOINTS.LOCATIONS.DETAIL(uuid));
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
      if (result.locations.length === 0 || all.length >= result.count) break;
      page += 1;
    }

    return all;
  },
};
