import { create } from 'zustand';
import { getSettings, updateSettings } from '../services/settingsApi';
import type { UserSettingsResponse, UpdateSettingsPayload } from '../services/settingsApi';
import type { ApiError } from '../types/api.types';

interface SettingsState {
  settings: UserSettingsResponse | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveSuccess: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (payload: UpdateSettingsPayload) => Promise<void>;
  resetSuccess: () => void;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as ApiError).message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,
  saveSuccess: false,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getSettings();
      set({ settings: data, isLoading: false });
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err, 'Failed to fetch settings'), isLoading: false });
    }
  },

  updateSettings: async (payload: UpdateSettingsPayload) => {
    set({ isSaving: true, error: null, saveSuccess: false });
    try {
      const data = await updateSettings(payload);
      set({ settings: data, isSaving: false, saveSuccess: true });
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err, 'Failed to update settings'), isSaving: false });
    }
  },

  resetSuccess: () => set({ saveSuccess: false }),
}));
