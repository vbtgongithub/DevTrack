// src/services/observationService.ts — AI Insights & Telemetry API Service
import axiosClient from '../utils/axiosClient';
import type { ApiResponse } from '../types/api.types';

export interface HeuristicInsight {
  type: 'momentum' | 'weakness' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Momentum Intelligence Types
// ---------------------------------------------------------------------------

export interface MomentumScore {
  overall: number;
  breakdown: {
    activityFrequency: number;
    xpVelocity: number;
    streakHealth: number;
    focusConsistency: number;
    problemDiversity: number;
  };
  trend: 'surging' | 'rising' | 'stable' | 'declining' | 'critical';
  message: string;
  lastCalculatedAt: string;
}

export interface ProductivityTrend {
  metric: string;
  current: number;
  previous: number;
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
  period: '7d' | '14d' | '30d';
}

export interface ConsistencyForecast {
  streakSurvivalProbability: number;
  projectedStreakDays: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: string;
}

export interface BurnoutRiskAssessment {
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  score: number;
  indicators: string[];
  suggestion: string;
}

export interface PeakProductivityWindow {
  startHour: number;
  endHour: number;
  activityCount: number;
  confidence: number;
  label: string;
}

export interface RecoverySuggestion {
  id: string;
  title: string;
  description: string;
  actionType: 'solve_problem' | 'focus_session' | 'review_topic' | 'take_break';
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

export interface WeakTopicCluster {
  topic: string;
  solveRate: number;
  totalProblems: number;
  solvedCount: number;
  trendDirection: 'improving' | 'stagnant' | 'declining';
  suggestedDifficulty: string;
}

export interface MomentumIntelligence {
  momentumScore: MomentumScore;
  trends: ProductivityTrend[];
  consistencyForecast: ConsistencyForecast;
  burnoutRisk: BurnoutRiskAssessment;
  peakWindows: PeakProductivityWindow[];
  recoverySuggestions: RecoverySuggestion[];
  weakTopics: WeakTopicCluster[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Retention Context Types
// ---------------------------------------------------------------------------

export interface StreakPressure {
  level: 'none' | 'gentle' | 'moderate' | 'urgent' | 'critical';
  currentStreak: number;
  hoursRemaining: number;
  message: string;
  emoji: string;
}

export interface RecoveryMission {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  expiresInHours: number;
  type: 'solve_problems' | 'focus_session' | 'commit_code';
}

export interface ComebackReward {
  eligible: boolean;
  inactiveDays: number;
  bonusXp: number;
  message: string;
}

export interface MilestoneAnticipation {
  type: 'problems' | 'streak' | 'level' | 'commits' | 'projects';
  current: number;
  target: number;
  remaining: number;
  progressPercent: number;
  message: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface NearLevelUp {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  message: string;
}

export interface MotivationalMessage {
  tone: 'encouraging' | 'celebratory' | 'gentle-nudge' | 'supportive' | 'calm';
  text: string;
  subtext?: string;
  emoji: string;
}

export interface RetentionContext {
  userState: 'new' | 'active' | 'at_risk' | 'returning' | 'dormant';
  streakPressure: StreakPressure | null;
  recoveryMission: RecoveryMission | null;
  comebackReward: ComebackReward | null;
  milestoneAnticipation: MilestoneAnticipation[];
  nearLevelUp: NearLevelUp | null;
  motivationalMessage: MotivationalMessage;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const observationService = {
  /**
   * Retrieves heuristic AI insights for the user.
   */
  async getInsights(): Promise<ApiResponse<HeuristicInsight[]>> {
    const { data } = await axiosClient.get<ApiResponse<HeuristicInsight[]>>('/observation/insights');
    return data;
  },

  /**
   * Retrieves full momentum intelligence payload.
   */
  async getMomentumIntelligence(): Promise<ApiResponse<MomentumIntelligence>> {
    const { data } = await axiosClient.get<ApiResponse<MomentumIntelligence>>('/observation/momentum');
    return data;
  },

  /**
   * Retrieves retention context (streak pressure, recovery, milestones).
   */
  async getRetentionContext(): Promise<ApiResponse<RetentionContext>> {
    const { data } = await axiosClient.get<ApiResponse<RetentionContext>>('/observation/retention');
    return data;
  },

  /**
   * Records telemetry events.
   */
  async recordEvents(sessionId: string, events: any[]): Promise<ApiResponse<void>> {
    const { data } = await axiosClient.post<ApiResponse<void>>('/observation/events', { sessionId, events });
    return data;
  },
};

export default observationService;

