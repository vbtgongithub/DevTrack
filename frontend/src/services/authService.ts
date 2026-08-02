import axiosClient from '../utils/axiosClient';
import type { ApiResponse, ApiLoginResponse, ApiRegisterResponse, ApiUser } from '../types/api.types';

export async function login(emailOrUsername: string, password: string): Promise<ApiLoginResponse> {
  const { data } = await axiosClient.post<ApiResponse<ApiLoginResponse>>('/auth/login', {
    emailOrUsername,
    password,
  });
  return data.data;
}

export async function register(
  email: string,
  username: string,
  displayName: string,
  password: string,
  inviteCode?: string
): Promise<ApiRegisterResponse> {
  const { data } = await axiosClient.post<ApiResponse<ApiRegisterResponse>>('/auth/register', {
    email,
    username,
    displayName,
    password,
    inviteCode,
  });
  return data.data;
}

export async function fetchMe(): Promise<ApiUser> {
  const { data } = await axiosClient.get<ApiResponse<ApiUser>>('/auth/me');
  return data.data;
}

export async function logout(_refreshToken?: string): Promise<void> {
  clearTokens();
  await axiosClient.post('/auth/logout', {}, {
    _skipToast: true,
  } as never);
}

export function storeTokens(_accessToken?: string, _refreshToken?: string): void {
  // Tokens are now stored securely in HttpOnly cookies by the backend.
  // Clean up legacy localStorage entries if present.
  localStorage.removeItem('devtrack_access_token');
  localStorage.removeItem('devtrack_refresh_token');
}

export function clearTokens(): void {
  localStorage.removeItem('devtrack_access_token');
  localStorage.removeItem('devtrack_refresh_token');
}

export function getAccessToken(): string | null {
  // Tokens are managed in HttpOnly cookies
  return null;
}

export function getRefreshToken(): string | null {
  // Tokens are managed in HttpOnly cookies
  return null;
}

export async function getSSEHandshakeTicket(): Promise<string> {
  const { data } = await axiosClient.post<ApiResponse<{ ticket: string }>>(
    '/auth/sse-handshake',
    {}
  );
  return data.data.ticket;
}
