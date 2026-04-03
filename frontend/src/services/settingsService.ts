// ============================================================================
// settingsService.ts — Settings API Service
// ============================================================================
// HTTP-only. Returns raw API types. No transformations.
// ============================================================================

import axiosClient from '../utils/axiosClient';
import type {
  ApiResponse,
  ApiSettingsResponse,
  ApiUserProfile,
  ApiConnectedPlatform,
  ApiNotificationPreferences,
  ApiAppearanceSettings,
  ApiPrivacySettings,
  ApiProfileUpdatePayload,
  ApiPasswordChangePayload,
  ApiPlatformConnectPayload,
  ApiNotificationUpdatePayload,
  ApiAppearanceUpdatePayload,
  ApiPrivacyUpdatePayload,
  ApiMutationResponse,
} from '../types/api.types';

const SETTINGS_BASE = '/settings';

/**
 * Fetch the full settings payload.
 */
export async function fetchSettings(): Promise<ApiResponse<ApiSettingsResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiSettingsResponse>>(
    `${SETTINGS_BASE}`
  );
  return data;
}

/**
 * Fetch user profile.
 */
export async function fetchProfile(): Promise<ApiResponse<ApiUserProfile>> {
  const { data } = await axiosClient.get<ApiResponse<ApiUserProfile>>(
    `${SETTINGS_BASE}/profile`
  );
  return data;
}

/**
 * Update user profile.
 */
export async function updateProfile(
  payload: ApiProfileUpdatePayload
): Promise<ApiResponse<ApiUserProfile>> {
  const { data } = await axiosClient.patch<ApiResponse<ApiUserProfile>>(
    `${SETTINGS_BASE}/profile`,
    payload
  );
  return data;
}

/**
 * Update user avatar.
 */
export async function updateAvatar(
  file: File
): Promise<ApiResponse<{ avatarUrl: string }>> {
  const formData = new FormData();
  formData.append('avatar', file);

  const { data } = await axiosClient.post<ApiResponse<{ avatarUrl: string }>>(
    `${SETTINGS_BASE}/profile/avatar`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

/**
 * Change password.
 */
export async function changePassword(
  payload: ApiPasswordChangePayload
): Promise<ApiMutationResponse> {
  const { data } = await axiosClient.post<ApiMutationResponse>(
    `${SETTINGS_BASE}/password`,
    payload
  );
  return data;
}

/**
 * Fetch connected platforms.
 */
export async function fetchConnectedPlatforms(): Promise<
  ApiResponse<ApiConnectedPlatform[]>
> {
  const { data } = await axiosClient.get<ApiResponse<ApiConnectedPlatform[]>>(
    `${SETTINGS_BASE}/platforms`
  );
  return data;
}

/**
 * Connect a new platform.
 */
export async function connectPlatform(
  payload: ApiPlatformConnectPayload
): Promise<ApiResponse<ApiConnectedPlatform>> {
  const { data } = await axiosClient.post<ApiResponse<ApiConnectedPlatform>>(
    `${SETTINGS_BASE}/platforms/connect`,
    payload
  );
  return data;
}

/**
 * Disconnect a platform.
 */
export async function disconnectPlatform(
  platformId: string
): Promise<ApiMutationResponse> {
  const { data } = await axiosClient.post<ApiMutationResponse>(
    `${SETTINGS_BASE}/platforms/${platformId}/disconnect`
  );
  return data;
}

/**
 * Trigger platform sync.
 */
export async function syncPlatform(
  platformId: string
): Promise<ApiMutationResponse> {
  const { data } = await axiosClient.post<ApiMutationResponse>(
    `${SETTINGS_BASE}/platforms/${platformId}/sync`
  );
  return data;
}

/**
 * Update notification preferences.
 */
export async function updateNotifications(
  payload: ApiNotificationUpdatePayload
): Promise<ApiResponse<ApiNotificationPreferences>> {
  const { data } = await axiosClient.patch<ApiResponse<ApiNotificationPreferences>>(
    `${SETTINGS_BASE}/notifications`,
    payload
  );
  return data;
}

/**
 * Update appearance settings.
 */
export async function updateAppearance(
  payload: ApiAppearanceUpdatePayload
): Promise<ApiResponse<ApiAppearanceSettings>> {
  const { data } = await axiosClient.patch<ApiResponse<ApiAppearanceSettings>>(
    `${SETTINGS_BASE}/appearance`,
    payload
  );
  return data;
}

/**
 * Update privacy settings.
 */
export async function updatePrivacy(
  payload: ApiPrivacyUpdatePayload
): Promise<ApiResponse<ApiPrivacySettings>> {
  const { data } = await axiosClient.patch<ApiResponse<ApiPrivacySettings>>(
    `${SETTINGS_BASE}/privacy`,
    payload
  );
  return data;
}

/**
 * Delete user account.
 */
export async function deleteAccount(
  password: string
): Promise<ApiMutationResponse> {
  const { data } = await axiosClient.post<ApiMutationResponse>(
    `${SETTINGS_BASE}/account/delete`,
    { password }
  );
  return data;
}

/**
 * Export user data.
 */
export async function exportUserData(): Promise<Blob> {
  const { data } = await axiosClient.get(`${SETTINGS_BASE}/export`, {
    responseType: 'blob',
  });
  return data;
}
