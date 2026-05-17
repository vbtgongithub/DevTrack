// ============================================================================
// axiosClient.ts — Centralized HTTP Client
// ============================================================================
// Single axios instance with interceptors for auth, error normalization,
// and request/response logging.
// ============================================================================

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError } from '../types/api.types';
import { envConfig } from './envCheck';
import { useUIStore } from '../store/uiStore';

const BASE_URL = envConfig.VITE_API_BASE_URL;
const TIMEOUT = 15_000; // 15 seconds

type AuthInvalidHandler = (() => void) | null;

let onAuthInvalid: AuthInvalidHandler = null;

export function setOnAuthInvalid(handler: AuthInvalidHandler) {
  onAuthInvalid = handler;
}

// ---------------------------------------------------------------------------
// Refresh coordination — prevents concurrent refresh race condition
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshQueue: Array<(token?: string) => void> = [];

function onRefreshSuccess(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
  isRefreshing = false;
}

function onRefreshFailure() {
  refreshQueue.forEach((cb) => cb(undefined));
  refreshQueue = [];
  isRefreshing = false;
}

function waitForRefresh(): Promise<string | undefined> {
  return new Promise((resolve) => {
    refreshQueue.push((token?: string) => {
      resolve(token);
    });
  });
}

// ---------------------------------------------------------------------------
// Multi-tab sync — broadcast channel for logout/session events
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'devtrack_access_token' && e.newValue === null) {
      // Token cleared in another tab — invalidate this tab's session
      try {
        onAuthInvalid?.();
      } catch {
        // ignore if handler throws
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Create Axios Instance
// ---------------------------------------------------------------------------

const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor — Attach Auth Token
// ---------------------------------------------------------------------------

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('devtrack_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — Normalize Errors + Coordinated Refresh
// ---------------------------------------------------------------------------

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _skipToast?: boolean;
    };

    // Handle 401 — attempt coordinated token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If a refresh is already in-flight, wait for it instead of firing another
      if (isRefreshing) {
        try {
          const newToken = await waitForRefresh();
          if (!newToken) {
            window.location.href = '/login';
            return Promise.reject(error);
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return axiosClient(originalRequest);
        } catch {
          return Promise.reject(error);
        }
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('devtrack_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken: string = data.data.accessToken;
        const newRefreshToken: string = data.data.refreshToken;

        localStorage.setItem('devtrack_access_token', newAccessToken);
        localStorage.setItem('devtrack_refresh_token', newRefreshToken);

        onRefreshSuccess(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return axiosClient(originalRequest);
      } catch (refreshError: any) {
        onRefreshFailure();

        const status = refreshError.response?.status;

        // ONLY clear credentials and redirect if the server explicitly tells us the refresh token is invalid (4xx)
        // If it's a network error (no status) or server error (5xx), do NOT log the user out!
        if (status && status >= 400 && status < 500) {
          localStorage.removeItem('devtrack_access_token');
          localStorage.removeItem('devtrack_refresh_token');

          try {
            onAuthInvalid?.();
          } catch {
            // ignore — redirect should still happen
          }
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    }

    // Normalize error for consumers
    const normalized: ApiError = {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      statusCode: error.response?.status || 500,
      timestamp: new Date().toISOString(),
      details: error.response?.data?.details,
    };

    // Global Toast Notification (skip for 401 and requests marked to skip toast)
    if (normalized.statusCode !== 401 && !originalRequest._skipToast) {
      const { addToast } = useUIStore.getState();
      addToast({
        type: 'error',
        title: 'System Connectivity Issue',
        message: normalized.message,
        duration: 6000,
      });
    }

    return Promise.reject(normalized);
  }
);

export default axiosClient;
