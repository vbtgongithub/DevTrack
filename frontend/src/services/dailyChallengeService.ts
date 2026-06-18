// ============================================================================
// dailyChallengeService.ts — Daily Challenge API Integration
// ============================================================================
// Service layer for daily challenge operations.
// Uses TanStack Query for caching and automatic refetching.
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyChallengeData {
  id: string;
  _id?: string;
  date: string; // ISO date
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  platform: 'leetcode' | 'codeforces' | 'codechef';
  problemUrl: string;
  xpReward: number;
  completionCount: number;
  userCompleted?: boolean;
  expiresAt: string; // ISO timestamp
}

export interface DailyChallengeResponse {
  success: boolean;
  data: {
    challenge: DailyChallengeData | null;
    userCompleted: boolean;
  };
  message?: string;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Fetches the daily challenge for the current user.
 */
export async function getTodayChallenge() {
  return await axiosClient.get<DailyChallengeResponse>('/daily-challenge/today');
}

export async function markChallengeComplete(challengeId: string): Promise<void> {
  await axiosClient.post(`/daily-challenge/${challengeId}/complete`);
}

// ---------------------------------------------------------------------------
// React Query Hooks
// ---------------------------------------------------------------------------

export function useMarkChallengeComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markChallengeComplete,
    onSuccess: () => {
      // Invalidate and refetch daily challenge
      queryClient.invalidateQueries({ queryKey: ['dailyChallenge'] });
    },
  });
}
