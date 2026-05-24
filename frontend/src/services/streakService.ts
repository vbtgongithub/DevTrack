// ============================================================================
// streakService.ts — Streak API Service
// ============================================================================
// HTTP-only. Returns raw API types. No transformations.
// ============================================================================

import axiosClient from '../utils/axiosClient';
import type { ApiStreakData } from '../types/api.types';

interface ApiStreakResponse {
  success: boolean;
  data: ApiStreakData;
}

// ---------------------------------------------------------------------------
// Additional Types
// ---------------------------------------------------------------------------

export interface ApiStreakHistoryEntry {
  date: string;
  count: number;
  active: boolean;
}

export interface ApiStreakMilestone {
  days: number;
  name: string;
  reached: boolean;
  reachedAt?: string;
}

interface ApiStreakHistoryResponse {
  success: boolean;
  data: ApiStreakHistoryEntry[];
}

interface ApiStreakMilestonesResponse {
  success: boolean;
  data: ApiStreakMilestone[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const streakService = {
  /**
   * GET /streak — unified streak status (current, longest, history).
   */
  getCurrent: async (): Promise<ApiStreakData> => {
    const { data } = await axiosClient.get<ApiStreakResponse>('/streak');
    if (!data.success) throw new Error('Failed to load streak data');
    return data.data;
  },

  /**
   * GET /streak/:type — streak for a specific type (dsa | github | unified).
   */
  getByType: async (type: 'dsa' | 'github' | 'unified'): Promise<ApiStreakData> => {
    const { data } = await axiosClient.get<ApiStreakResponse>(`/streak/${type}`);
    if (!data.success) throw new Error(`Failed to load ${type} streak data`);
    return data.data;
  },

  /**
   * GET /streak/history — Detailed streak history
   */
  getHistory: async (): Promise<ApiStreakHistoryEntry[]> => {
    const { data } = await axiosClient.get<ApiStreakHistoryResponse>('/streak/history');
    if (!data.success) throw new Error('Failed to load streak history');
    return data.data;
  },

  /**
   * GET /streak/milestones — Streak milestones
   */
  getMilestones: async (): Promise<ApiStreakMilestone[]> => {
    const { data } = await axiosClient.get<ApiStreakMilestonesResponse>('/streak/milestones');
    if (!data.success) throw new Error('Failed to load streak milestones');
    return data.data;
  },
};
