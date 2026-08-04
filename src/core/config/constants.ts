export const API_BASE_URL = 'https://mytizim.uz/';

export const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'superadmin_access_token',
  REFRESH_TOKEN: 'superadmin_refresh_token',
  ADMIN_DATA: 'superadmin_admin_data',
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/user/login/',
  },
  LOCATIONS: {
    BASE: 'locations/',
    DETAIL: (uuid: string) => `locations/${uuid}/`,
    TYPES: 'locations/types/',
  },
  NEIGHBORHOODS: {
    BASE: 'locations/neighborhoods/',
  },
  PARTNERS: {
    BASE: 'partner/',
    DETAIL: (uuid: string) => `partner/${uuid}/`,
  },
};
