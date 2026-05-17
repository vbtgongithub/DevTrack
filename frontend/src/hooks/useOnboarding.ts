// Onboarding flow integration with progress tracking
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { telemetry } from '../lib/telemetry/analytics';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  skipped: boolean;
}

interface OnboardingProgress {
  isCompleted: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startedAt: string | null;
  completedAt: string | null;
}

const onboardingApi = {
  getProgress: async (): Promise<OnboardingProgress> => {
    const response = await fetch('/api/onboarding/progress');
    if (!response.ok) throw new Error('Failed to fetch onboarding progress');
    return response.json();
  },

  completeStep: async (stepId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/onboarding/step/${stepId}/complete`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to complete onboarding step');
    return response.json();
  },

  skipStep: async (stepId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/onboarding/step/${stepId}/skip`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to skip onboarding step');
    return response.json();
  },

  completeOnboarding: async (): Promise<{ success: boolean }> => {
    const response = await fetch('/api/onboarding/complete', {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to complete onboarding');
    return response.json();
  },
};

export function useOnboarding() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['onboarding'],
    queryFn: onboardingApi.getProgress,
    staleTime: 5 * 60 * 1000,
  });

  const completeStepMutation = useMutation({
    mutationFn: (stepId: string) => onboardingApi.completeStep(stepId),
    onMutate: async (stepId) => {
      await queryClient.cancelQueries({ queryKey: ['onboarding'] });

      const previousProgress = queryClient.getQueryData<OnboardingProgress>(['onboarding']);

      queryClient.setQueryData<OnboardingProgress>(['onboarding'], (old) => {
        if (!old) return old;
        const stepIndex = old.steps.findIndex((s) => s.id === stepId);
        return {
          ...old,
          steps: old.steps.map((s) =>
            s.id === stepId ? { ...s, completed: true } : s
          ),
          currentStep: stepIndex + 1 < old.steps.length ? stepIndex + 1 : old.currentStep,
        };
      });

      // Track telemetry
      telemetry.track('onboarding_step_complete', {
        stepId,
        stepNumber: query.data?.currentStep,
      });

      return { previousProgress };
    },
    onError: (_err, _stepId, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['onboarding'], context.previousProgress);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const skipStepMutation = useMutation({
    mutationFn: (stepId: string) => onboardingApi.skipStep(stepId),
    onMutate: async (stepId) => {
      await queryClient.cancelQueries({ queryKey: ['onboarding'] });

      const previousProgress = queryClient.getQueryData<OnboardingProgress>(['onboarding']);

      queryClient.setQueryData<OnboardingProgress>(['onboarding'], (old) => {
        if (!old) return old;
        const stepIndex = old.steps.findIndex((s) => s.id === stepId);
        return {
          ...old,
          steps: old.steps.map((s) =>
            s.id === stepId ? { ...s, skipped: true } : s
          ),
          currentStep: stepIndex + 1 < old.steps.length ? stepIndex + 1 : old.currentStep,
        };
      });

      telemetry.track('onboarding_step_skip', {
        stepId,
        stepNumber: query.data?.currentStep,
      });

      return { previousProgress };
    },
    onError: (_err, _stepId, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['onboarding'], context.previousProgress);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: () => onboardingApi.completeOnboarding(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['onboarding'] });

      const previousProgress = queryClient.getQueryData<OnboardingProgress>(['onboarding']);

      queryClient.setQueryData<OnboardingProgress>(['onboarding'], (old) => {
        if (!old) return old;
        return {
          ...old,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      });

      telemetry.track('onboarding_complete', {
        duration: query.data?.startedAt ? Date.now() - new Date(query.data.startedAt).getTime() : 0,
      });

      return { previousProgress };
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  return {
    progress: query.data,
    isLoading: query.isLoading,
    error: query.error,
    completeStep: completeStepMutation.mutate,
    skipStep: skipStepMutation.mutate,
    completeOnboarding: completeOnboardingMutation.mutate,
    isCompletingStep: completeStepMutation.isPending,
    isSkippingStep: skipStepMutation.isPending,
    isCompletingOnboarding: completeOnboardingMutation.isPending,
  };
}
