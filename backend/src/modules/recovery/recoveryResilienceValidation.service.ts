// src/modules/recovery/recoveryResilienceValidation.service.ts — Recovery + Resilience UX Validation Service
// Phase-K: Recovery + Resilience UX Validation - Broken streak recovery, inactive-user return behavior, comeback completion, recovery confidence, emotional resilience

import { logger } from '../../shared/logger.js';

export interface RecoveryResilienceMetrics {
  brokenStreakRecoveryRate: number;
  inactiveUserReturnRate: number;
  comebackCompletionRate: number;
  recoveryConfidenceScore: number; // 0-100
  emotionalResilienceScore: number; // 0-100
  averageTimeToRecovery: number;
  recommendations: string[];
}

export const recoveryResilienceValidation = {
  // ─── Get Recovery Resilience Metrics ─────────────────────────────────────────────
  async getRecoveryResilienceMetrics(dateRange: { start: Date; end: Date }): Promise<RecoveryResilienceMetrics> {
    // In a real implementation, this would query actual user data
    const brokenStreakRecoveryRate = 65; // 65% of users recover broken streaks
    const inactiveUserReturnRate = 35; // 35% of inactive users return
    const comebackCompletionRate = 50; // 50% of comeback attempts complete
    const recoveryConfidenceScore = 70;
    const emotionalResilienceScore = 75;
    const averageTimeToRecovery = 2.5; // days

    const recommendations = this.generateResilienceRecommendations(
      brokenStreakRecoveryRate,
      inactiveUserReturnRate,
      comebackCompletionRate,
      recoveryConfidenceScore,
      emotionalResilienceScore
    );

    return {
      brokenStreakRecoveryRate,
      inactiveUserReturnRate,
      comebackCompletionRate,
      recoveryConfidenceScore,
      emotionalResilienceScore,
      averageTimeToRecovery,
      recommendations,
    };
  },

  // ─── Generate Resilience Recommendations ────────────────────────────────────────────
  generateResilienceRecommendations(
    brokenStreakRecoveryRate: number,
    inactiveUserReturnRate: number,
    comebackCompletionRate: number,
    recoveryConfidenceScore: number,
    emotionalResilienceScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (brokenStreakRecoveryRate < 50) {
      recommendations.push('Low broken streak recovery - improve recovery messaging and reduce shame');
    }

    if (inactiveUserReturnRate < 30) {
      recommendations.push('Low inactive user return - improve re-engagement strategy');
    }

    if (comebackCompletionRate < 50) {
      recommendations.push('Low comeback completion - simplify comeback flow');
    }

    if (recoveryConfidenceScore < 60) {
      recommendations.push('Low recovery confidence - normalize breaks and reduce pressure');
    }

    if (emotionalResilienceScore < 60) {
      recommendations.push('Low emotional resilience - improve emotional safety and support');
    }

    if (recommendations.length === 0) {
      recommendations.push('Recovery and resilience metrics are healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Track Broken Streak Recovery ───────────────────────────────────────────────
  async trackBrokenStreakRecovery(userId: string, previousStreak: number, recovered: boolean): Promise<void> {
    logger.info('[recovery] Broken streak recovery tracked', { userId, previousStreak, recovered });
  },

  // ─── Track Inactive User Return ────────────────────────────────────────────────
  async trackInactiveUserReturn(userId: string, inactiveDays: number, returned: boolean): Promise<void> {
    logger.info('[recovery] Inactive user return tracked', { userId, inactiveDays, returned });
  },

  // ─── Track Comeback Completion ────────────────────────────────────────────────
  async trackComebackCompletion(userId: string, completed: boolean, timeToComplete: number): Promise<void> {
    logger.info('[recovery] Comeback completion tracked', { userId, completed, timeToComplete });
  },

  // ─── Analyze Recovery Patterns ────────────────────────────────────────────────
  async analyzeRecoveryPatterns(dateRange: { start: Date; end: Date }): Promise<{
    mostEffectiveRecoveryMessages: Array<{ message: string; recoveryRate: number }>;
    commonRecoveryBarriers: Array<{ barrier: string; count: number }>;
    recommendations: string[];
  }> {
    // In a real implementation, this would analyze actual data
    return {
      mostEffectiveRecoveryMessages: [
        { message: 'streak_restoration_bonus', recoveryRate: 75 },
        { message: 'gentle_reminder', recoveryRate: 65 },
        { message: 'we_miss_you', recoveryRate: 55 },
      ],
      commonRecoveryBarriers: [
        { barrier: 'shame', count: 30 },
        { barrier: 'overwhelm', count: 25 },
        { barrier: 'lost_momentum', count: 20 },
      ],
      recommendations: [
        'Focus on shame-free recovery messaging',
        'Reduce overwhelm in comeback flows',
        'Provide momentum restoration options',
      ],
    };
  },
};

export default recoveryResilienceValidation;
