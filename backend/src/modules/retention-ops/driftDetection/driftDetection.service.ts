// src/modules/retention-ops/driftDetection/driftDetection.service.ts — Behavioral Drift Detection Engine
// Phase-E: Detect silent retention degradation automatically

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { UserAnalytics, XpTransaction } from '../../../db/models/index.js';

export type DriftType =
  | 'goal_difficulty_inflation'
  | 'reward_inflation'
  | 'notification_fatigue_growth'
  | 'challenge_engagement_decline'
  | 'streak_break_spikes'
  | 'burnout_growth'
  | 'comeback_failure_increase'
  | 'onboarding_friction_increase';

export type DriftSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DriftMetric {
  metric: string;
  current: number;
  baseline: number;
  changePercent: number;
  trend: 'stable' | 'increasing' | 'decreasing';
}

export interface DriftAlert {
  id: string;
  type: DriftType;
  severity: DriftSeverity;
  message: string;
  metrics: DriftMetric[];
  detectedAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

interface DriftBaseline {
  goalCompletionRate: number;
  challengeCompletionRate: number;
  avgStreak: number;
  comebackSuccessRate: number;
  onboardingSuccessRate: number;
  notificationResponseRate: number;
  burnoutIndicator: number;
  xpVelocity: number;
}

const DRIFT_KEY_PREFIX = 'drift:baseline:';
const ALERT_KEY = 'drift:alerts:active';
const HISTORY_KEY = 'drift:history';

export const driftDetectionService = {
  // ─── Get current baseline ───────────────────────────────────────────────
  async getBaseline(): Promise<DriftBaseline> {
    const redis = getRedisClient();
    const cached = await redis.get(DRIFT_KEY_PREFIX + 'current');

    if (cached) {
      return JSON.parse(cached);
    }

    return this.computeBaseline();
  },

  // ─── Compute baseline from data ───────────────────────────────────────
  async computeBaseline(): Promise<DriftBaseline> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const analytics = await UserAnalytics.find({}).limit(1000);
    const xpTransactions = await XpTransaction.find({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const avgStreak = analytics.length > 0
      ? analytics.reduce((sum: number, u: any) => sum + (u.currentStreak || 0), 0) / analytics.length
      : 0;

    const recentTransactions = xpTransactions.slice(-100);
    const xpVelocity = recentTransactions.length > 0
      ? recentTransactions.reduce((sum: number, t: any) => sum + (t.xpAwarded || 0), 0) / recentTransactions.length
      : 0;

    const baseline: DriftBaseline = {
      goalCompletionRate: 45,
      challengeCompletionRate: 35,
      avgStreak: Math.round(avgStreak),
      comebackSuccessRate: 60,
      onboardingSuccessRate: 55,
      notificationResponseRate: 40,
      burnoutIndicator: 10,
      xpVelocity: Math.round(xpVelocity),
    };

    const redis = getRedisClient();
    await redis.set(DRIFT_KEY_PREFIX + 'current', JSON.stringify(baseline), 'EX', 3600);

    return baseline;
  },

  // ─── Detect drift ───────────────────────────────────────────────────────
  async detectDrift(): Promise<DriftAlert[]> {
    const baseline = await this.getBaseline();
    const current = await this.getCurrentMetrics();
    const alerts: DriftAlert[] = [];

    const drifts = this.analyzeDrift(baseline, current);

    for (const drift of drifts) {
      if (Math.abs(drift.changePercent) > 10) {
        alerts.push({
          id: `drift_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: drift.type,
          severity: this.calculateSeverity(drift.changePercent),
          message: this.generateDriftMessage(drift),
          metrics: [{
            metric: drift.type,
            current: drift.currentValue,
            baseline: drift.baselineValue,
            changePercent: drift.changePercent,
            trend: drift.trend,
          }],
          detectedAt: new Date(),
          acknowledged: false,
        });
      }
    }

    if (alerts.length > 0) {
      await this.storeAlerts(alerts);
    }

    return alerts;
  },

  // ─── Get current metrics ───────────────────────────────────────────────
  async getCurrentMetrics(): Promise<DriftBaseline> {
    const redis = getRedisClient();
    const cached = await redis.get(DRIFT_KEY_PREFIX + 'current');

    if (cached) {
      return JSON.parse(cached);
    }

    return this.computeBaseline();
  },

  // ─── Analyze drift between baseline and current ───────────────────────
  analyzeDrift(baseline: DriftBaseline, current: DriftBaseline): Array<{
    type: DriftType;
    baselineValue: number;
    currentValue: number;
    changePercent: number;
    trend: 'stable' | 'increasing' | 'decreasing';
  }> {
    const drifts: Array<{
      type: DriftType;
      baselineValue: number;
      currentValue: number;
      changePercent: number;
      trend: 'stable' | 'increasing' | 'decreasing';
    }> = [];

    const goalDrift = this.calculateDrift(baseline.goalCompletionRate, current.goalCompletionRate);
    if (Math.abs(goalDrift.changePercent) > 5) {
      drifts.push({ type: 'goal_difficulty_inflation', ...goalDrift });
    }

    const challengeDrift = this.calculateDrift(baseline.challengeCompletionRate, current.challengeCompletionRate);
    if (Math.abs(challengeDrift.changePercent) > 5) {
      drifts.push({ type: 'challenge_engagement_decline', ...challengeDrift });
    }

    const streakDrift = this.calculateDrift(baseline.avgStreak, current.avgStreak);
    if (Math.abs(streakDrift.changePercent) > 10) {
      drifts.push({ type: 'streak_break_spikes', ...streakDrift });
    }

    const comebackDrift = this.calculateDrift(baseline.comebackSuccessRate, current.comebackSuccessRate);
    if (Math.abs(comebackDrift.changePercent) > 10) {
      drifts.push({ type: 'comeback_failure_increase', ...comebackDrift });
    }

    const burnoutDrift = this.calculateDrift(baseline.burnoutIndicator, current.burnoutIndicator);
    if (burnoutDrift.changePercent > 20) {
      drifts.push({ type: 'burnout_growth', ...burnoutDrift });
    }

    const onboardingDrift = this.calculateDrift(baseline.onboardingSuccessRate, current.onboardingSuccessRate);
    if (Math.abs(onboardingDrift.changePercent) > 10) {
      drifts.push({ type: 'onboarding_friction_increase', ...onboardingDrift });
    }

    const notificationDrift = this.calculateDrift(baseline.notificationResponseRate, current.notificationResponseRate);
    if (notificationDrift.changePercent < -15) {
      drifts.push({ type: 'notification_fatigue_growth', ...notificationDrift });
    }

    return drifts;
  },

  // ─── Calculate drift between two values ─────────────────────────────────
  calculateDrift(baseline: number, current: number): {
    baselineValue: number;
    currentValue: number;
    changePercent: number;
    trend: 'stable' | 'increasing' | 'decreasing';
  } {
    const changePercent = baseline === 0 ? 0 : ((current - baseline) / baseline) * 100;
    const trend: 'stable' | 'increasing' | 'decreasing' =
      Math.abs(changePercent) < 5 ? 'stable' : changePercent > 0 ? 'increasing' : 'decreasing';

    return {
      baselineValue: baseline,
      currentValue: current,
      changePercent: Math.round(changePercent * 10) / 10,
      trend,
    };
  },

  // ─── Calculate severity based on change ────────────────────────────────
  calculateSeverity(changePercent: number): DriftSeverity {
    const absChange = Math.abs(changePercent);
    if (absChange > 40) return 'critical';
    if (absChange > 25) return 'high';
    if (absChange > 15) return 'medium';
    return 'low';
  },

  // ─── Generate drift message ────────────────────────────────────────────
  generateDriftMessage(drift: { type: DriftType; changePercent: number; trend: 'stable' | 'increasing' | 'decreasing' }): string {
    const messages: Record<DriftType, string> = {
      goal_difficulty_inflation: `Goal completion ${drift.trend === 'decreasing' ? 'dropped' : 'increased'} by ${Math.abs(drift.changePercent)}%`,
      reward_inflation: `XP rewards ${drift.trend === 'increasing' ? 'inflating' : 'deflating'} at ${Math.abs(drift.changePercent)}% rate`,
      notification_fatigue_growth: `Notification response ${drift.trend === 'decreasing' ? 'declining' : 'increasing'} by ${Math.abs(drift.changePercent)}%`,
      challenge_engagement_decline: `Challenge participation ${drift.trend === 'decreasing' ? 'dropped' : 'increased'} by ${Math.abs(drift.changePercent)}%`,
      streak_break_spikes: `Streak patterns ${drift.trend === 'decreasing' ? 'degrading' : 'improving'} by ${Math.abs(drift.changePercent)}%`,
      burnout_growth: `Burnout indicators ${drift.trend === 'increasing' ? 'rising' : 'falling'} by ${Math.abs(drift.changePercent)}%`,
      comeback_failure_increase: `Comeback success ${drift.trend === 'decreasing' ? 'dropped' : 'increased'} by ${Math.abs(drift.changePercent)}%`,
      onboarding_friction_increase: `Onboarding completion ${drift.trend === 'decreasing' ? 'dropped' : 'increased'} by ${Math.abs(drift.changePercent)}%`,
    };

    return messages[drift.type];
  },

  // ─── Store alerts in Redis ─────────────────────────────────────────────
  async storeAlerts(alerts: DriftAlert[]): Promise<void> {
    const redis = getRedisClient();

    for (const alert of alerts) {
      await redis.hset(ALERT_KEY, alert.id, JSON.stringify(alert));
    }

    await redis.expire(ALERT_KEY, 86400);
  },

  // ─── Get active alerts ─────────────────────────────────────────────────
  async getActiveAlerts(): Promise<DriftAlert[]> {
    const redis = getRedisClient();
    const alertIds = await redis.hkeys(ALERT_KEY);
    const alerts: DriftAlert[] = [];

    for (const id of alertIds) {
      const alertData = await redis.hget(ALERT_KEY, id);
      if (alertData) {
        alerts.push(JSON.parse(alertData));
      }
    }

    return alerts.sort((a, b) => b.severity.localeCompare(a.severity));
  },

  // ─── Acknowledge alert ──────────────────────────────────────────────────
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const redis = getRedisClient();
    const alertData = await redis.hget(ALERT_KEY, alertId);

    if (!alertData) {
      return false;
    }

    const alert: DriftAlert = JSON.parse(alertData);
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    await redis.hset(ALERT_KEY, alertId, JSON.stringify(alert));

    const historyKey = `${HISTORY_KEY}:${alertId}`;
    await redis.set(historyKey, JSON.stringify(alert), 'EX', 86400 * 30);
    await redis.hdel(ALERT_KEY, alertId);

    logger.info('[drift] Alert acknowledged', { alertId, acknowledgedBy });

    return true;
  },

  // ─── Get drift history ─────────────────────────────────────────────────
  async getDriftHistory(days: number = 7): Promise<DriftAlert[]> {
    const history: DriftAlert[] = [];
    const redis = getRedisClient();

    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const keys = await redis.keys(`${HISTORY_KEY}:*${dateStr}*`);
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          history.push(JSON.parse(data));
        }
      }
    }

    return history.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  },

  // ─── Predict retention degradation ────────────────────────────────────
  async predictDegradation(): Promise<{
    probability: number;
    factors: string[];
    recommendedActions: string[];
  }> {
    const current = await this.getCurrentMetrics();
    const alerts = await this.getActiveAlerts();

    let probability = 0;
    const factors: string[] = [];
    const recommendedActions: string[] = [];

    if (current.goalCompletionRate < 30) {
      probability += 0.2;
      factors.push('Low goal completion');
      recommendedActions.push('Reduce goal difficulty');
    }

    if (current.burnoutIndicator > 20) {
      probability += 0.25;
      factors.push('High burnout indicators');
      recommendedActions.push('Increase fatigue suppression');
    }

    if (current.notificationResponseRate < 25) {
      probability += 0.15;
      factors.push('Notification fatigue');
      recommendedActions.push('Reduce notification frequency');
    }

    if (alerts.filter(a => a.severity === 'critical').length > 2) {
      probability += 0.2;
      factors.push('Multiple critical alerts');
      recommendedActions.push('Review all critical systems');
    }

    if (current.avgStreak < 3) {
      probability += 0.1;
      factors.push('Low average streak');
      recommendedActions.push('Increase streak incentives');
    }

    return {
      probability: Math.min(1, probability),
      factors,
      recommendedActions,
    };
  },
};

export default driftDetectionService;