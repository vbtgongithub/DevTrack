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

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const TIMEOUT = 15_000; // 15 seconds

let onAuthInvalid: (() => void) | null = null;

export function setOnAuthInvalid(handler: (() => void) | null) {
  onAuthInvalid = handler;
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
// Response Interceptor — Normalize Errors + Refresh on 401
// ---------------------------------------------------------------------------

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 — attempt token refresh (with queue to prevent thundering herd)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If another request is already refreshing, queue this one
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return axiosClient(originalRequest);
        });
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

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear tokens + zustand store
        localStorage.removeItem('devtrack_access_token');
        localStorage.removeItem('devtrack_refresh_token');
        onAuthInvalid?.();
        // Don't hard-redirect — the React auth gate will handle it
        const normalized: ApiError = {
          success: false,
          message: 'Session expired. Please sign in again.',
          code: 'AUTH_REFRESH_FAILED',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        };

        return Promise.reject(normalized);
      } finally {
        isRefreshing = false;
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

    return Promise.reject(normalized);
  }
);

export default axiosClient;
