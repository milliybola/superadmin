import apiClient from '../../../core/api/client';
import { ENDPOINTS } from '../../../core/config/constants';

// GeoJSON-style polygon rings: an array of linear rings, each ring an array
// of [lng, lat] points with the first point repeated at the end to close it.
export type PolygonCoordinates = number[][][];

export interface Neighborhood {
  uuid: string;
  name: string;
  district: string;
  coordinates: PolygonCoordinates;
}

export interface NeighborhoodsResult {
  count: number;
  districts: string[];
  neighborhoods: Neighborhood[];
}

export interface NeighborhoodPayload {
  name: string;
  district: string;
  coordinates: PolygonCoordinates;
}

export const neighborhoodsApi = {
  getNeighborhoods: async (): Promise<NeighborhoodsResult> => {
    const response = await apiClient.get(ENDPOINTS.NEIGHBORHOODS.BASE);
    const data = response.data.data ?? response.data;
    return {
      count: data.count ?? 0,
      districts: data.districts ?? [],
      neighborhoods: data.neighborhoods ?? [],
    };
  },

  createNeighborhood: async (payload: NeighborhoodPayload): Promise<Neighborhood> => {
    const response = await apiClient.post(ENDPOINTS.NEIGHBORHOODS.BASE, payload);
    return response.data.data ?? response.data;
  },
};
