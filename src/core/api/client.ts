import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, ENDPOINTS, STORAGE_KEYS } from '../config/constants';

// Lets a specific request opt out of the global "401 -> log out" behavior
// below — for best-effort calls to endpoints that may legitimately reject
// the current session's scope (e.g. admin-probing a partner-only resource)
// without that meaning the admin's own session has actually expired.
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
    _retried?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
}

function redirectToLogin() {
  clearSession();
  if (!window.location.hash.includes('/login')) {
    window.location.hash = '#/login';
  }
}

// Request interceptor: attach JWT token if it exists and no Authorization header is already set
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Access token eskirganda (15-60 daqiqa) refresh token bilan jimgina yangilaymiz; bir vaqtdagi bir nechta
// so'rov bitta yangilash so'rovini kutadi. Yangilab bo'lmasa — kirish sahifasiga.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refresh) return null;
  try {
    // Alohida axios: interceptorlar (va ularning 401 mantiqi) aralashmasin
    const res = await axios.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, { refresh });
    const access: string | undefined = res.data?.access;
    if (!access) return null;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    if (res.data?.refresh) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.data.refresh);
    return access;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    if (error.response?.status !== 401 || !config || config.skipAuthRedirect) {
      return Promise.reject(error);
    }
    if (!config._retried) {
      config._retried = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const access = await refreshing;
      if (access) {
        config.headers.Authorization = `Bearer ${access}`;
        return apiClient(config);
      }
    }
    redirectToLogin();
    return Promise.reject(error);
  },
);

export default apiClient;
