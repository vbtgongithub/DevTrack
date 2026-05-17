// src/modules/retention-v2/safety/retentionSafety.service.ts — Retention Safety Layer
// Phase-D: Prevent psychologically harmful engagement patterns

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { retentionProfileService } from '../profile/retentionProfile.service.js';

export interface SafetyViolation {
  type: 'addiction_risk' | 'burnout_pressure' | 'manipulative_urgency' | 'unhealthy_grinding';
  severity: 'warning' | 'violation';
  message: string;
  recommendedAction: string;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  warnings: SafetyViolation[];
  safeScore: number; // 0-100
}

// Safety thresholds
const SAFETY_THRESHOLDS = {
  maxDailyActivityHours: 6,
  maxContinuousStreakDays: 60,
  minRestHoursBetweenSessions: 2,
  maxNotificationsPerDay: 15,
  minGoalDifficultyEase: 0.3,
};

const SAFETY_KEYS = {
  violationLog: (userId: string) => `safety:violations:${userId}`,
  gracePeriod: (userId: string) => `safety:grace:${userId}`,
};

export const retentionSafetyService = {
  // ─── Check for safety violations ───────────────────────────────────────
  async checkSafety(userId: string): Promise<SafetyCheckResult> {
    const profile = await retentionProfileService.getProfile(userId);
    const warnings: SafetyViolation[] = [];

    if (!profile) {
      return { isSafe: true, warnings: [], safeScore: 100 };
    }

    let safeScore = 100;

    // Check 1: Addiction risk indicators
    if (profile.state === 'high_momentum' && profile.streakResilience > 90) {
      const days = profile.stateDuration || 0;
      if (days > 168) { // 7 days of high momentum
        warnings.push({
          type: 'addiction_risk',
          severity: 'warning',
          message: 'Extended high-momentum state detected',
          recommendedAction: 'Consider encouraging breaks',
        });
        safeScore -= 20;
      }
    }

    // Check 2: Burnout pressure
    if (profile.burnoutProbability > 70) {
      warnings.push({
        type: 'burnout_pressure',
        severity: 'violation',
        message: 'High burnout probability detected',
        recommendedAction: 'Immediately reduce engagement pressure',
      });
      safeScore -= 30;
    }

    // Check 3: Streak anxiety patterns
    if (profile.state === 'streak_risk' && profile.streakResilience < 30) {
      warnings.push({
        type: 'manipulative_urgency',
        severity: 'warning',
        message: 'Streak anxiety patterns detected',
        recommendedAction: 'Remove streak pressure, offer streak freeze',
      });
      safeScore -= 15;
    }

    // Check 4: Unhealthy grinding
    if (profile.engagementQuality < 30 && profile.fatigueScore > 60) {
      warnings.push({
        type: 'unhealthy_grinding',
        severity: 'warning',
        message: 'Low engagement quality with high fatigue',
        recommendedAction: 'Recommend rest period',
      });
      safeScore -= 20;
    }

    // Check 5: Excessive notifications
    const notifHealth = await import('../notifications/notificationFatigue.service.js')
      .then((m) => m.notificationFatigueService.getNotificationHealth(userId));

    if (notifHealth && notifHealth.sentToday > SAFETY_THRESHOLDS.maxNotificationsPerDay) {
      warnings.push({
        type: 'burnout_pressure',
        severity: 'warning',
        message: 'Too many notifications sent',
        recommendedAction: 'Reduce notification volume',
      });
      safeScore -= 10;
    }

    // Check 6: Healthy streak length cap
    if (profile.streakResilience >= 95) {
      warnings.push({
        type: 'addiction_risk',
        severity: 'warning',
        message: 'Very long streak may create unhealthy dependence',
        recommendedAction: 'Offer streak protection without pressure',
      });
      safeScore -= 10;
    }

    return {
      isSafe: safeScore >= 50,
      warnings,
      safeScore: Math.max(0, safeScore),
    };
  },

  // ─── Apply safety interventions ────────────────────────────────────────
  async applyInterventions(userId: string): Promise<void> {
    const safety = await this.checkSafety(userId);
    const redis = getRedisClient();

    if (!safety.isSafe) {
      // Log violation
      await redis.lpush(
        SAFETY_KEYS.violationLog(userId),
        JSON.stringify({
          warnings: safety.warnings,
          safeScore: safety.safeScore,
          timestamp: new Date().toISOString(),
        })
      );
      await redis.expire(SAFETY_KEYS.violationLog(userId), 60 * 60 * 24 * 30);

      // Apply interventions based on violations
      for (const warning of safety.warnings) {
        await this.applyWarningAction(userId, warning);
      }
    }
  },

  // ─── Apply specific warning action ────────────────────────────────────
  async applyWarningAction(userId: string, warning: SafetyViolation): Promise<void> {
    switch (warning.type) {
      case 'addiction_risk':
        // Offer streak freeze without pressure
        logger.warn('[safety] Addiction risk detected', { userId, warning: warning.message });
        break;

      case 'burnout_pressure':
        // Reduce all engagement pressure
        logger.warn('[safety] Burnout pressure detected', { userId, warning: warning.message });
        break;

      case 'manipulative_urgency':
        // Remove urgency from communications
        logger.warn('[safety] Manipulative urgency detected', { userId, warning: warning.message });
        break;

      case 'unhealthy_grinding':
        // Recommend rest
        logger.warn('[safety] Unhealthy grinding detected', { userId, warning: warning.message });
        break;
    }
  },

  // ─── Get safety grace period (prevent double warnings) ────────────────
  async hasGracePeriod(userId: string, warningType: string): Promise<boolean> {
    const redis = getRedisClient();
    const graceKey = SAFETY_KEYS.gracePeriod(userId);
    return (await redis.exists(graceKey)) > 0;
  },

  // ─── Set grace period after warning ────────────────────────────────────
  async setGracePeriod(userId: string, hours: number = 24): Promise<void> {
    const redis = getRedisClient();
    const graceKey = SAFETY_KEYS.gracePeriod(userId);
    await redis.set(graceKey, '1', 'EX', hours * 3600);
  },

  // ─── Get safety history ────────────────────────────────────────────────
  async getSafetyHistory(userId: string, limit: number = 10): Promise<Array<{
    warnings: SafetyViolation[];
    safeScore: number;
    timestamp: string;
  }>> {
    const redis = getRedisClient();
    const logs = await redis.lrange(SAFETY_KEYS.violationLog(userId), 0, limit - 1);
    return logs.map((l) => JSON.parse(l));
  },

  // ─── Calculate ethical engagement score ────────────────────────────────
  async calculateEthicalScore(userId: string): Promise<number> {
    const safety = await this.checkSafety(userId);
    return safety.safeScore;
  },

  // ─── Get safety recommendations ───────────────────────────────────────
  async getRecommendations(userId: string): Promise<string[]> {
    const safety = await this.checkSafety(userId);
    const profile = await retentionProfileService.getProfile(userId);
    const recommendations: string[] = [];

    if (!profile) return recommendations;

    // Based on state
    switch (profile.state) {
      case 'high_momentum':
        if (profile.stateDuration && profile.stateDuration > 168) {
          recommendations.push('Consider suggesting a break to prevent burnout');
        }
        break;

      case 'fatigued':
        recommendations.push('Reduce notification frequency');
        recommendations.push('Suggest easier goals');
        recommendations.push('Offer streak protection');
        break;

      case 'burnout_risk':
        recommendations.push('Immediate: pause all non-critical notifications');
        recommendations.push('Suggest rest period');
        recommendations.push('Offer recovery bonuses for return');
        break;

      case 'streak_risk':
        if (profile.streakResilience < 40) {
          recommendations.push('Remove streak pressure from messaging');
          recommendations.push('Offer free streak freeze');
        }
        break;

      default:
        if (safety.safeScore > 80) {
          recommendations.push('Engagement is healthy');
        }
    }

    return recommendations;
  },
};

export default retentionSafetyService;