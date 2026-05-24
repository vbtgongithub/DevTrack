// ============================================================================
// xpService.ts — XP API Service
// ============================================================================
// HTTP-only. Returns raw API types. No transformations.
// ============================================================================

import axiosClient from '../utils/axiosClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiXpState {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  levelName: string;
  levelTitle: string;
  lifetimeStats: {
    totalProblemsSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalContests: number;
    dailyStreaks: number;
    longestStreak: number;
    totalSyncs: number;
    totalXpEarned: number;
  };
}

export interface ApiXpHistoryEntry {
  date: string;
  xp: number;
  source: string;
}

export interface ApiXpTransaction {
  id: string;
  amount: number;
  source: string;
  reason: string;
  createdAt: string;
}

interface ApiXpResponse {
  success: boolean;
  data: ApiXpState;
}

interface ApiXpHistoryResponse {
  success: boolean;
  data: ApiXpHistoryEntry[];
}

interface ApiXpTransactionsResponse {
  success: boolean;
  data: ApiXpTransaction[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const xpService = {
  /**
   * GET /xp — current user's XP state (level, progress, lifetime stats).
   */
  getCurrent: async (): Promise<ApiXpState> => {
    const { data } = await axiosClient.get<ApiXpResponse>('/xp');
    if (!data.success) throw new Error('Failed to load XP data');
    return data.data;
  },

  /**
   * GET /xp/history — XP history over time
   */
  getHistory: async (): Promise<ApiXpHistoryEntry[]> => {
    const { data } = await axiosClient.get<ApiXpHistoryResponse>('/xp/history');
    if (!data.success) throw new Error('Failed to load XP history');
    return data.data;
  },

  /**
   * GET /xp/transactions — Recent XP transactions
   */
  getTransactions: async (limit = 10): Promise<ApiXpTransaction[]> => {
    const { data } = await axiosClient.get<ApiXpTransactionsResponse>('/xp/transactions', {
      params: { limit },
    });
    if (!data.success) throw new Error('Failed to load XP transactions');
    return data.data;
  },
};
