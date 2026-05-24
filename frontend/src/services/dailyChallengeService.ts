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

// ---------------------------------------------------------------------------
// Mock Data (for development/demo)
// ---------------------------------------------------------------------------

export function getMockDailyChallenge(): DailyChallengeData {
  const today = new Date();
  const expiresAt = new Date(today);
  expiresAt.setHours(23, 59, 59, 999);

  return {
    id: `challenge-${today.toISOString().split('T')[0]}`,
    date: today.toISOString(),
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'easy',
    platform: 'leetcode',
    problemUrl: 'https://leetcode.com/problems/two-sum/',
    xpReward: 25,
    completionCount: 1247,
    userCompleted: false,
    expiresAt: expiresAt.toISOString(),
  };
}
