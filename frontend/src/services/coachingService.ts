import axiosClient from '../utils/axiosClient';

export interface FocusAnalytics {
  effectivenessScore: number;
  interruptionRate: number;
  deepWorkConsistency: number;
  bestSessionDuration: number;
  mostConsistentTimeOfDay: string;
  distractionTrend: 'improving' | 'worsening' | 'stable';
  coachingInsights: string[];
}

export interface CoachingInsightsResponse {
  insights: string[];
  emotionalState: 'burnout_risk' | 'streak_risk' | 'high_momentum' | 'calm';
}

export interface ReflectionResponse {
  period: 'weekly';
  summaries: string[];
  totalFocusMinutes: number;
  completedChallenges: number;
  averageFocusQuality: number;
}

export interface MomentumIntelligence {
  momentumScore: {
    overall: number;
    trend: 'surging' | 'rising' | 'stable' | 'declining' | 'critical';
    message: string;
    breakdown: {
      activityFrequency: number;
      xpVelocity: number;
      streakHealth: number;
      focusConsistency: number;
      problemDiversity: number;
    };
  };
  burnoutRisk: {
    riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
    score: number;
    suggestion: string;
  };
  recoverySuggestions: Array<{
    title: string;
    description: string;
  }>;
}

export const coachingService = {
  getInsights: () => axiosClient.get<{ data: CoachingInsightsResponse }>('/coaching/insights').then(res => res.data.data),
  getReflections: () => axiosClient.get<{ data: ReflectionResponse }>('/coaching/reflections').then(res => res.data.data),
  getMomentum: () => axiosClient.get<{ data: MomentumIntelligence }>('/coaching/momentum').then(res => res.data.data),
  getFocusAnalytics: () => axiosClient.get<{ data: FocusAnalytics }>('/coaching/focus').then(res => res.data.data),
};
