// ============================================================================
// useStreakState.ts — Streak State Management Hook
// ============================================================================
// Provides access to streak data with SSE live updates.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { useGamificationStore } from '../../../store/gamificationStore';
import { streakService } from '../../../services/streakService';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const streakQueryKeys = {
  current: ['streak', 'current'] as const,
  history: ['streak', 'history'] as const,
  milestones: ['streak', 'milestones'] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseStreakStateReturn {
  // Server state
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastActivityDate: string | null;
  streakHistory: Array<{ date: string; count: number }>;
  nextMilestone: number;
  daysUntilMilestone: number;
  
  // Live state
  liveStreak: number;
  
  // Computed
  isAtRisk: boolean;
  hoursRemaining: number;
  
  // Query state
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to access streak state with live updates
 * 
 * @example
 * const { currentStreak, isActiveToday, isAtRisk } = useStreakState();
 */
export const useStreakState = (): UseStreakStateReturn => {
  // Server state from TanStack Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: streakQueryKeys.current,
    queryFn: streakService.getCurrent,
    staleTime: 30_000, // 30s — SSE keeps it fresh
    gcTime: 5 * 60_000, // 5min cache
  });

  // Live state from Zustand (optimistically updated by SSE)
  const liveStreak = useGamificationStore((s) => s.liveStreak);

  // Use live value if available, otherwise fall back to server data
  const effectiveStreak = liveStreak ?? data?.currentStreak ?? 0;

  // Compute if streak is at risk (not active today and has active streak)
  const isAtRisk = !data?.isActiveToday && effectiveStreak > 0;

  // Compute hours remaining in day
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const hoursRemaining = Math.ceil((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));

  // Compute next milestone
  const milestones = [7, 14, 30, 60, 100, 200, 365];
  const nextMilestone = milestones.find((m) => m > effectiveStreak) ?? 365;
  const daysUntilMilestone = nextMilestone - effectiveStreak;

  return {
    // Server state
    currentStreak: data?.currentStreak ?? 0,
    longestStreak: data?.longestStreak ?? 0,
    isActiveToday: data?.isActiveToday ?? false,
    lastActivityDate: data?.lastActiveDate ?? null,
    streakHistory: data?.streakHistory ?? [],
    nextMilestone,
    daysUntilMilestone,
    
    // Live state
    liveStreak: effectiveStreak,
    
    // Computed
    isAtRisk,
    hoursRemaining,
    
    // Query state
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to access streak history
 */
export const useStreakHistory = () => {
  return useQuery({
    queryKey: streakQueryKeys.history,
    queryFn: streakService.getHistory,
    staleTime: 60_000, // 1min
    gcTime: 10 * 60_000, // 10min cache
  });
};

/**
 * Hook to access streak milestones
 */
export const useStreakMilestones = () => {
  return useQuery({
    queryKey: streakQueryKeys.milestones,
    queryFn: streakService.getMilestones,
    staleTime: 5 * 60_000, // 5min
    gcTime: 30 * 60_000, // 30min cache
  });
};
