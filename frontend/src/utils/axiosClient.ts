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

const BASE_URL = envConfig.VITE_API_BASE_URL;
const TIMEOUT = 15_000; // 15 seconds

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
// Response Interceptor — Normalize Errors
// ---------------------------------------------------------------------------

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

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

        return axiosClient(originalRequest);
      } catch {
        // Refresh failed — clear tokens and redirect
        localStorage.removeItem('devtrack_access_token');
        localStorage.removeItem('devtrack_refresh_token');
        window.location.href = '/login';
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

    return Promise.reject(normalized);
  }
);

export default axiosClient;
