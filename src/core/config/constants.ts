// Backend manzili: .env.development (lokal docker) / .env.production
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'https://mytizim.uz/';

export const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'superadmin_access_token',
  REFRESH_TOKEN: 'superadmin_refresh_token',
  ADMIN_DATA: 'superadmin_admin_data',
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/user/login/',
    REFRESH: 'api/token/refresh/',
    SEND_OTP: 'auth/user/send-otp/',
    VERIFY_OTP: 'auth/user/verify-otp/',
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
    // These mirror the partner-facing app's own endpoints, which are scoped
    // implicitly by the caller's Bearer token — there's no confirmed
    // admin-side equivalent yet, so we call them with a `partner` filter as
    // a best guess and degrade gracefully per-section if it 401/403/404s.
    STATISTICS: 'partner/statistics/',
    STAFF: 'partner/staff/',
    FILIALS: 'partner/filials/',
  },
  PRODUCTS: {
    BASE: 'products/',
  },
  /** Platforma administratori uchun alohida API (backend: api/superadmin) */
  ADMIN: {
    ME: 'superadmin/me/',
    DASHBOARD: 'superadmin/dashboard/',
    ORDERS: 'superadmin/orders/',
    USERS: 'superadmin/users/',
    COURIERS: 'superadmin/couriers/',
    PARTNERS: 'superadmin/partners/',
    FILIALS: 'superadmin/filials/',
    STAFF: 'superadmin/staff/',
    CUISINES: 'superadmin/cuisines/',
    TARIFFS: 'superadmin/tariffs/',
    CATEGORIES: 'superadmin/categories/',
    PRODUCTS: 'superadmin/products/',
    BANNERS: 'superadmin/banners/',
    PROMOTIONS: 'superadmin/promotions/',
    BROADCAST: 'superadmin/broadcast/',
    PAYMENTS: 'superadmin/payments/',
    MERCHANTS: 'superadmin/merchants/',
    REPORTS: 'superadmin/reports/',
    ADMINS: 'superadmin/admins/',
    AUDIT: 'superadmin/audit/',
    DISPATCH: 'superadmin/dispatch-config/',
    SMS_STATUS: 'superadmin/sms/status/',
    SMS_CONFIG: 'superadmin/sms/config/',
    SMS_TEST: 'superadmin/sms/test/',
    SMS_DEVICES: 'superadmin/sms/devices/',
    SMS_OUTBOX: 'superadmin/sms/outbox/',
    VERIFICATIONS: 'superadmin/verifications/',
    CUSTOMERS: 'superadmin/customers/',
  },
};
