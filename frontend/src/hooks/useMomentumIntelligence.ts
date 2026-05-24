// ============================================================================
// useMomentumIntelligence.ts — Momentum Intelligence Hook
// ============================================================================
// React Query hook for fetching full momentum intelligence payload.
// Stale time: 5min, refetch on window focus.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { observationService, type MomentumIntelligence } from '../services/observationService';
import { useUserStore } from '../store/userStore';

export function useMomentumIntelligence() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const query = useQuery<MomentumIntelligence>({
    queryKey: ['momentumIntelligence'],
    queryFn: async () => {
      const response = await observationService.getMomentumIntelligence();
      if (!response.success) throw new Error('Failed to load momentum intelligence');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: isAuthenticated,
  });

  return {
    data: query.data ?? null,
    momentumScore: query.data?.momentumScore ?? null,
    trends: query.data?.trends ?? [],
    burnoutRisk: query.data?.burnoutRisk ?? null,
    peakWindows: query.data?.peakWindows ?? [],
    consistencyForecast: query.data?.consistencyForecast ?? null,
    recoverySuggestions: query.data?.recoverySuggestions ?? [],
    weakTopics: query.data?.weakTopics ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: () => query.refetch(),
  };
}
