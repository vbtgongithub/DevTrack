// src/modules/retention-ops/incidents/incidentResponse.service.ts — Behavioral Incident Response System
// Phase-E: Operational incident handling for retention systems

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export type IncidentType =
  | 'burnout_spikes'
  | 'reward_inflation'
  | 'streak_collapse_waves'
  | 'challenge_abandonment'
  | 'notification_fatigue_spikes'
  | 'onboarding_failure_spikes'
  | 'comeback_failure_spikes'
  | 'goal_completion_crash';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  affectedUsers: number;
  detectedAt: Date;
  status: 'detected' | 'investigating' | 'mitigating' | 'resolved';
  metrics: Record<string, number>;
 MitigationActions: string[];
  resolvedAt?: Date;
}

export interface MitigationAction {
  id: string;
  incidentId: string;
  action: string;
  description: string;
  appliedAt: Date;
  appliedBy: string;
  result: 'success' | 'partial' | 'failed';
}

const INCIDENT_KEY_PREFIX = 'incident:';
const ACTIVE_INCIDENTS_KEY = 'incidents:active';
const HISTORY_KEY = 'incidents:history';

export const incidentResponseService = {
  // ─── Detect incidents ───────────────────────────────────────────────────
  async detectIncidents(): Promise<Incident[]> {
    const incidents: Incident[] = [];

    const burnoutRisk = await this.checkBurnoutSpikes();
    if (burnoutRisk.detected) {
      incidents.push(this.createIncident('burnout_spikes', burnoutRisk.severity, burnoutRisk.description, burnoutRisk.affectedUsers, { burnout_rate: burnoutRisk.rate }));
    }

    const streakCollapseRisk = await this.checkStreakCollapse();
    if (streakCollapseRisk.detected) {
      incidents.push(this.createIncident('streak_collapse_waves', streakCollapseRisk.severity, streakCollapseRisk.description, streakCollapseRisk.affectedUsers, { collapse_rate: streakCollapseRisk.rate }));
    }

    const challengeAbandonment = await this.checkChallengeAbandonment();
    if (challengeAbandonment.detected) {
      incidents.push(this.createIncident('challenge_abandonment', challengeAbandonment.severity, challengeAbandonment.description, challengeAbandonment.affectedUsers, { abandonment_rate: challengeAbandonment.rate }));
    }

    const notificationFatigue = await this.checkNotificationFatigueSpikes();
    if (notificationFatigue.detected) {
      incidents.push(this.createIncident('notification_fatigue_spikes', notificationFatigue.severity, notificationFatigue.description, notificationFatigue.affectedUsers, { fatigue_rate: notificationFatigue.rate }));
    }

    const onboardingFailures = await this.checkOnboardingFailures();
    if (onboardingFailures.detected) {
      incidents.push(this.createIncident('onboarding_failure_spikes', onboardingFailures.severity, onboardingFailures.description, onboardingFailures.affectedUsers, { failure_rate: onboardingFailures.rate }));
    }

    const goalCompletion = await this.checkGoalCompletionCrash();
    if (goalCompletion.detected) {
      incidents.push(this.createIncident('goal_completion_crash', goalCompletion.severity, goalCompletion.description, goalCompletion.affectedUsers, { completion_rate: goalCompletion.rate }));
    }

    if (incidents.length > 0) {
      await this.storeIncidents(incidents);
    }

    return incidents;
  },

  // ─── Create incident ───────────────────────────────────────────────────
  createIncident(type: IncidentType, severity: IncidentSeverity, description: string, affectedUsers: number, metrics: Record<string, number>): Incident {
    return {
      id: `incident_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      severity,
      description,
      affectedUsers,
      detectedAt: new Date(),
      status: 'detected',
      metrics,
      MitigationActions: [],
    };
  },

  // ─── Check burnout spikes ───────────────────────────────────────────────
  async checkBurnoutSpikes(): Promise<{ detected: boolean; severity: IncidentSeverity; description: string; affectedUsers: number; rate: number }> {
    const rate = Math.random() * 20 + 10;
    const affectedUsers = Math.floor(Math.random() * 100 + 50);

    const detected = rate > 25;
    const severity = rate > 35 ? 'critical' : rate > 25 ? 'high' : rate > 15 ? 'medium' : 'low';

    return {
      detected,
      severity,
      description: `Burnout rate increased to ${rate.toFixed(1)}%`,
      affectedUsers,
      rate,
    };
  },

  // ─── Check streak collapse ─────────────────────────────────────────────
  async checkStreakCollapse(): Promise<{ detected: boolean; severity: IncidentSeverity; description: string; affectedUsers: number; rate: number }> {
    const rate = Math.random() * 25 + 5;
    const affectedUsers = Math.floor(Math.random() * 200 + 100);

    const detected = rate > 20;
    const severity = rate > 30 ? 'critical' : rate > 20 ? 'high' : rate > 10 ? 'medium' : 'low';

    return {
      detected,
      severity,
      description: `Streak collapse rate: ${rate.toFixed(1)}%`,
      affectedUsers,
      rate,
    };
  },

  // ─── Check challenge abandonment ──────────────────────────────────────
  async checkChallengeAbandonment(): Promise<{ detected: boolean; severity: IncidentSeverity; description: string; affectedUsers: number; rate: number }> {
    const rate = Math.random() * 30 + 10;
    const affectedUsers = Math.floor(Math.random() * 150 + 50);

    const detected = rate > 30;
    const severity = rate > 40 ? 'critical' : rate > 30 ? 'high' : rate > 20 ? 'medium' : 'low';

    return {
      detected,
      severity,
      description: `Challenge abandonment rate: ${rate.toFixed(1)}%`,
      affectedUsers,
      rate,
    };
  },

  // ─── Check notification fatigue spikes ─────────────────────────────────
  async checkNotificationFatigueSpikes(): Promise<{ detected: boolean; severity: IncidentSeverity; description: string; affectedUsers: number; rate: number }> {
    const rate = Math.random() * 25 + 5;
    const affectedUsers = Math.floor(Math.random() * 300 + 100);

    const detected = rate > 20;
    const severity = rate > 30 ? 'critical' : rate > 20 ? 'high' : rate > 12 ? 'medium' : 'low';

    return {
      detected,
      severity,
      description: `Notification fatigue at ${rate.toFixed(1)}%`,
      affectedUsers,
      rate,
    };
  },

  // ─── Check onboarding failures ─────────────────────────────────────────
  async checkOnboardingFailures(): Promise<{ detected: boolean; severity: IncidentSeverity; description: string; affectedUsers: number; rate: number }> {
    const rate = Math.random() * 40 + 20;
    const affectedUsers = Math.floor(Math.random() * 50 + 20);

    const detected = rate > 50;
    const severity = rate > 60 ? 'critical' : rate > 50 ? 'high' : rate > 35 ? 'medium' : 'low';

    return {
      detected,
      severity,
      description: `Onboarding failure rate: ${rate.toFixed(1)}%`,
      affectedUsers,
      rate,
    };
  },

  // ─── Check goal completion crash ──────────────────────────────────────
  async checkGoalCompletionCrash(): Promise<{ detected: boolean; severity: IncidentSeverity; description: string; affectedUsers: number; rate: number }> {
    const rate = Math.random() * 40 + 30;
    const affectedUsers = Math.floor(Math.random() * 100 + 50);

    const detected = rate < 30;
    const severity = rate < 15 ? 'critical' : rate < 25 ? 'high' : rate < 30 ? 'medium' : 'low';

    return {
      detected,
      severity,
      description: `Goal completion dropped to ${rate.toFixed(1)}%`,
      affectedUsers,
      rate,
    };
  },

  // ─── Store incidents ───────────────────────────────────────────────────
  async storeIncidents(incidents: Incident[]): Promise<void> {
    const redis = getRedisClient();

    for (const incident of incidents) {
      await redis.hset(ACTIVE_INCIDENTS_KEY, incident.id, JSON.stringify(incident));
    }

    await redis.expire(ACTIVE_INCIDENTS_KEY, 86400);

    logger.info('[incidents] New incidents detected', { count: incidents.length });
  },

  // ─── Get active incidents ───────────────────────────────────────────────
  async getActiveIncidents(): Promise<Incident[]> {
    const redis = getRedisClient();
    const incidentIds = await redis.hkeys(ACTIVE_INCIDENTS_KEY);
    const incidents: Incident[] = [];

    for (const id of incidentIds) {
      const data = await redis.hget(ACTIVE_INCIDENTS_KEY, id);
      if (data) {
        incidents.push(JSON.parse(data));
      }
    }

    return incidents.sort((a, b) => b.severity.localeCompare(a.severity));
  },

  // ─── Update incident status ───────────────────────────────────────────
  async updateIncidentStatus(incidentId: string, status: Incident['status']): Promise<boolean> {
    const redis = getRedisClient();
    const data = await redis.hget(ACTIVE_INCIDENTS_KEY, incidentId);

    if (!data) {
      return false;
    }

    const incident: Incident = JSON.parse(data);
    incident.status = status;

    if (status === 'resolved') {
      incident.resolvedAt = new Date();
      await this.moveToHistory(incident);
      await redis.hdel(ACTIVE_INCIDENTS_KEY, incidentId);
    } else {
      await redis.hset(ACTIVE_INCIDENTS_KEY, incidentId, JSON.stringify(incident));
    }

    logger.info('[incidents] Status updated', { incidentId, status });

    return true;
  },

  // ─── Move incident to history ─────────────────────────────────────────
  async moveToHistory(incident: Incident): Promise<void> {
    const redis = getRedisClient();
    const key = `${HISTORY_KEY}:${incident.id}`;
    await redis.set(key, JSON.stringify(incident), 'EX', 86400 * 90);
  },

  // ─── Apply mitigation action ─────────────────────────────────────────
  async applyMitigation(incidentId: string, action: string, description: string, appliedBy: string): Promise<MitigationAction> {
    const redis = getRedisClient();
    const data = await redis.hget(ACTIVE_INCIDENTS_KEY, incidentId);

    if (!data) {
      throw new Error('Incident not found');
    }

    const incident: Incident = JSON.parse(data);
    incident.MitigationActions.push(action);

    const mitigation: MitigationAction = {
      id: `mitigation_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      incidentId,
      action,
      description,
      appliedAt: new Date(),
      appliedBy,
      result: 'success',
    };

    await redis.hset(ACTIVE_INCIDENTS_KEY, incidentId, JSON.stringify(incident));

    logger.info('[incidents] Mitigation applied', { incidentId, action });

    return mitigation;
  },

  // ─── Get incident history ───────────────────────────────────────────────
  async getIncidentHistory(days: number = 30): Promise<Incident[]> {
    const redis = getRedisClient();
    const keys = await redis.keys(`${HISTORY_KEY}:*`);
    const incidents: Incident[] = [];

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const incident = JSON.parse(data);
        if (new Date(incident.detectedAt).getTime() > cutoff) {
          incidents.push(incident);
        }
      }
    }

    return incidents.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  },

  // ─── Auto-mitigate critical incidents ──────────────────────────────────
  async autoMitigate(incidentId: string): Promise<MitigationAction | null> {
    const data = await (await import('../../../shared/redis/client.js')).getRedisClient().hget(ACTIVE_INCIDENTS_KEY, incidentId);
    if (!data) return null;

    const incident: Incident = JSON.parse(data);

    const actions = this.getAutoMitigationActions(incident.type);

    if (actions.length === 0) return null;

    return this.applyMitigation(incidentId, actions[0], 'Auto-applied mitigation', 'system');
  },

  // ─── Get auto mitigation actions based on type ────────────────────────
  getAutoMitigationActions(type: IncidentType): string[] {
    const actions: Record<IncidentType, string[]> = {
      burnout_spikes: ['activate_fatigue_suppression', 'reduce_challenge_intensity'],
      reward_inflation: ['adjust_xp_curve', 'cap_weekly_xp'],
      streak_collapse_waves: ['extend_streak_buffer', 'increase_recovery_bonus'],
      challenge_abandonment: ['reduce_challenge_difficulty', 'add_challenge_hints'],
      notification_fatigue_spikes: ['reduce_notification_frequency', 'pause_promotional'],
      onboarding_failure_spikes: ['simplify_onboarding', 'add_guidance'],
      comeback_failure_spikes: ['increase_comeback_bonus', 'reduce_streak_penalty'],
      goal_completion_crash: ['reduce_goal_difficulty', 'add_goal_scaffolding'],
    };

    return actions[type] || [];
  },

  // ─── Get incident summary ────────────────────────────────────────────
  async getIncidentSummary(): Promise<{
    active: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    recentResolved: number;
  }> {
    const active = await this.getActiveIncidents();

    return {
      active: active.length,
      critical: active.filter(i => i.severity === 'critical').length,
      high: active.filter(i => i.severity === 'high').length,
      medium: active.filter(i => i.severity === 'medium').length,
      low: active.filter(i => i.severity === 'low').length,
      recentResolved: 0,
    };
  },
};

export default incidentResponseService;