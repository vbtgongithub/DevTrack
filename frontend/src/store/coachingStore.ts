import { create } from 'zustand';
import type { CoachingInsightsResponse, ReflectionResponse, MomentumIntelligence, FocusAnalytics } from '../services/coachingService';
import { coachingService } from '../services/coachingService';

interface CoachingState {
  insights: CoachingInsightsResponse | null;
  reflection: ReflectionResponse | null;
  momentum: MomentumIntelligence | null;
  focusAnalytics: FocusAnalytics | null;
  isLoading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
}

export const useCoachingStore = create<CoachingState>((set) => ({
  insights: null,
  reflection: null,
  momentum: null,
  focusAnalytics: null,
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [insights, reflection, momentum, focusAnalytics] = await Promise.all([
        coachingService.getInsights(),
        coachingService.getReflections(),
        coachingService.getMomentum(),
        coachingService.getFocusAnalytics(),
      ]);

      set({ insights, reflection, momentum, focusAnalytics, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch coaching data', isLoading: false });
    }
  },
}));
