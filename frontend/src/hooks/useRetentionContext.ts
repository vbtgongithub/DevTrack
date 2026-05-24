// ============================================================================
// useRetentionContext.ts — Retention Context Hook
// ============================================================================
// React Query hook for fetching retention context (streak pressure,
// recovery missions, comeback rewards, milestones, motivational messages).
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { observationService, type RetentionContext } from '../services/observationService';
import { useUserStore } from '../store/userStore';

export function useRetentionContext() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const query = useQuery<RetentionContext>({
    queryKey: ['retentionContext'],
    queryFn: async () => {
      const response = await observationService.getRetentionContext();
      if (!response.success) throw new Error('Failed to load retention context');
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: isAuthenticated,
  });

  return {
    data: query.data ?? null,
    userState: query.data?.userState ?? 'active',
    streakPressure: query.data?.streakPressure ?? null,
    recoveryMission: query.data?.recoveryMission ?? null,
    comebackReward: query.data?.comebackReward ?? null,
    milestoneAnticipation: query.data?.milestoneAnticipation ?? [],
    nearLevelUp: query.data?.nearLevelUp ?? null,
    motivationalMessage: query.data?.motivationalMessage ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: () => query.refetch(),
  };
}
