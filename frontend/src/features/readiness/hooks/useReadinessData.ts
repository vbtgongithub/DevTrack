import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readinessService, type ReadinessSnapshot, type CareerIntentInput } from '../../../services/readinessService';

export function useReadinessData() {
  const query = useQuery<ReadinessSnapshot>({
    queryKey: ['readinessData'],
    queryFn: async ({ signal }) => {
      const res = await readinessService.getSnapshot({ signal });
      if (!res.success) throw new Error('Failed to load readiness snapshot');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : (query.error as any)?.message || null,
    refetch: () => query.refetch(),
  };
}

export function useReadinessDomain(domain: string) {
  const query = useQuery<any>({
    queryKey: ['readinessDomain', domain],
    queryFn: async ({ signal }) => {
      const res = await readinessService.getDomainIntelligence(domain, { signal });
      if (!res.success) throw new Error(`Failed to load ${domain} intelligence`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    enabled: !!domain,
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : (query.error as any)?.message || null,
    refetch: () => query.refetch(),
  };
}

export function useSetCareerIntent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (intent: CareerIntentInput) => readinessService.setIntent(intent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readinessData'] });
    },
  });
}
