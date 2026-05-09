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
  password: string
): Promise<ApiRegisterResponse> {
  const { data } = await axiosClient.post<ApiResponse<ApiRegisterResponse>>('/auth/register', {
    email,
    username,
    displayName,
    password,
  });
  return data.data;
}

export async function fetchMe(): Promise<ApiUser> {
  const { data } = await axiosClient.get<ApiResponse<ApiUser>>('/auth/me');
  return data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await axiosClient.post('/auth/logout', { refreshToken });
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('devtrack_access_token', accessToken);
  localStorage.setItem('devtrack_refresh_token', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('devtrack_access_token');
  localStorage.removeItem('devtrack_refresh_token');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('devtrack_access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('devtrack_refresh_token');
}
