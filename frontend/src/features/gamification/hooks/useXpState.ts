// ============================================================================
// useXpState.ts — XP State Management Hook
// ============================================================================
// Provides access to XP data with SSE live updates.
// Combines TanStack Query (server state) + Zustand (optimistic UI state).
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { useGamificationStore } from '../../../store/gamificationStore';
import { xpService } from '../../../services/xpService';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const xpQueryKeys = {
  current: ['xp', 'current'] as const,
  history: ['xp', 'history'] as const,
  transactions: (limit?: number) => ['xp', 'transactions', limit] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseXpStateReturn {
  // Server state (from API)
  totalXp: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  levelName: string;
  levelTitle: string;
  
  // Live state (from SSE + Zustand)
  liveXp: number;
  liveLevel: number;
  pendingXpGain: number | null;
  
  // Query state
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to access XP state with live updates
 * 
 * @example
 * const { totalXp, currentLevel, liveXp, pendingXpGain } = useXpState();
 */
export const useXpState = (): UseXpStateReturn => {
  // Server state from TanStack Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: xpQueryKeys.current,
    queryFn: xpService.getCurrent,
    staleTime: 30_000, // 30s — SSE keeps it fresh
    gcTime: 5 * 60_000, // 5min cache
  });

  // Live state from Zustand (optimistically updated by SSE)
  const liveXp = useGamificationStore((s) => s.liveXp);
  const liveLevel = useGamificationStore((s) => s.liveLevel);
  const pendingXpGain = useGamificationStore((s) => s.pendingXpGain);

  // Use live values if available, otherwise fall back to server data
  const effectiveXp = liveXp ?? data?.totalXp ?? 0;
  const effectiveLevel = liveLevel ?? data?.currentLevel ?? 1;

  return {
    // Server state
    totalXp: data?.totalXp ?? 0,
    currentLevel: data?.currentLevel ?? 1,
    xpInCurrentLevel: data?.xpInCurrentLevel ?? 0,
    xpForNextLevel: data?.xpForNextLevel ?? 100,
    progressPercent: data?.progressPercent ?? 0,
    levelName: data?.levelName ?? 'Newcomer',
    levelTitle: data?.levelTitle ?? 'Just getting started',
    
    // Live state (optimistic)
    liveXp: effectiveXp,
    liveLevel: effectiveLevel,
    pendingXpGain,
    
    // Query state
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to access XP history
 */
export const useXpHistory = () => {
  return useQuery({
    queryKey: xpQueryKeys.history,
    queryFn: xpService.getHistory,
    staleTime: 60_000, // 1min
    gcTime: 10 * 60_000, // 10min cache
  });
};

/**
 * Hook to access recent XP transactions
 */
export const useXpTransactions = (limit = 10) => {
  return useQuery({
    queryKey: xpQueryKeys.transactions(limit),
    queryFn: () => xpService.getTransactions(limit),
    staleTime: 30_000, // 30s
    gcTime: 5 * 60_000, // 5min cache
  });
};
