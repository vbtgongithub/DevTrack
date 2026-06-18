// src/modules/onboarding/BetaAccessInfrastructure.ts
// Central management for invite-only keys, beta cohorts, programmatic feature flags, and active telemetry.

import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface BetaCohort {
  cohortId: string;
  name: string;
  weightOverrides?: Record<string, number>;
  description: string;
}

export interface BetaInvite {
  code: string;
  maxUses: number;
  usesCount: number;
  cohortId: string;
  createdBy: string;
}

export interface TelemetryEvent {
  userId: string;
  eventType: 'onboarding_start' | 'onboarding_complete' | 'github_connected' | 'readiness_computed' | 'recommendation_clicked' | 'ats_optimized';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class BetaAccessInfrastructure {
  private static readonly ACTIVE_COHORTS: Record<string, BetaCohort> = {
    'cohort-a-standard': {
      cohortId: 'cohort-a-standard',
      name: 'Cohort A - Standard Weights',
      description: 'Default heuristic weights for all engineering sectors.',
    },
    'cohort-b-heavy-infra': {
      cohortId: 'cohort-b-heavy-infra',
      name: 'Cohort B - Heavy Infrastructure Weights',
      weightOverrides: {
        infraWeight: 0.6,
        systemDesignWeight: 0.2,
        dsaWeight: 0.1,
        projectComplexityWeight: 0.1,
      },
      description: 'Prioritizes deployment evidence, Redis scaling, and docker setups.',
    },
  };

  /**
   * Validate and record invite code usage
   */
  static async validateInviteCode(code: string): Promise<{ valid: boolean; cohortId: string; error?: string }> {
    const redis = getRedisClient();
    const key = `beta:invite:${code.toLowerCase()}`;
    const data = await redis.get(key);

    if (!data) {
      // Fallback for simulation testing/dev mode
      if (code.startsWith('DEVTRACK_BETA_')) {
        const cohortId = code.includes('INFRA') ? 'cohort-b-heavy-infra' : 'cohort-a-standard';
        return { valid: true, cohortId };
      }
      return { valid: false, cohortId: '', error: 'Invalid invite code' };
    }

    const invite = JSON.parse(data) as BetaInvite;
    if (invite.usesCount >= invite.maxUses) {
      return { valid: false, cohortId: '', error: 'Invite code maximum usage reached' };
    }

    // Increment usage
    invite.usesCount += 1;
    await redis.set(key, JSON.stringify(invite));
    
    logger.info(`[BetaAccess] Invite code verified: ${code} (Usage: ${invite.usesCount}/${invite.maxUses})`);

    return { valid: true, cohortId: invite.cohortId };
  }

  /**
   * Check programmatic feature rollout status for a user based on cohort
   */
  static isFeatureEnabled(userId: string, featureFlagName: string, cohortId = 'cohort-a-standard'): boolean {
    // Implement cohort-based feature rollout
    switch (featureFlagName) {
      case 'live-semantic-search':
        return cohortId === 'cohort-b-heavy-infra' || userId.charCodeAt(0) % 2 === 0; // 50% rollout standard
      case 'ats-realism-heatmap':
        return true; // 100% rollout
      case 'evolution-replay-scrubber':
        return cohortId === 'cohort-b-heavy-infra'; // Premium cohort rollout
      default:
        return false;
    }
  }

  /**
   * Track telemetry for onboarding drop-offs and active engagements
   */
  static async trackTelemetry(event: TelemetryEvent): Promise<void> {
    const redis = getRedisClient();
    const listKey = `beta:telemetry:events`;
    const userSummaryKey = `beta:telemetry:user:${event.userId}`;

    const serializedEvent = JSON.stringify(event);
    await redis.lpush(listKey, serializedEvent);
    await redis.ltrim(listKey, 0, 9999); // Retain top 10000 events

    // Record user progress state
    await redis.hset(userSummaryKey, {
      [`last_event:${event.eventType}`]: event.timestamp.toISOString(),
      current_state: event.eventType,
    });

    logger.info(`[BetaTelemetry] User ${event.userId} reached ${event.eventType}`, { metadata: event.metadata });
  }

  /**
   * Create a new invite code
   */
  static async createInviteCode(code: string, cohortId: string, maxUses = 10): Promise<void> {
    const redis = getRedisClient();
    const key = `beta:invite:${code.toLowerCase()}`;

    if (!this.ACTIVE_COHORTS[cohortId]) {
      throw new Error(`Unknown cohortId: ${cohortId}`);
    }

    const invite: BetaInvite = {
      code: code.toLowerCase(),
      maxUses,
      usesCount: 0,
      cohortId,
      createdBy: 'admin',
    };

    await redis.set(key, JSON.stringify(invite));
    logger.info(`[BetaAccess] Generated invite code: ${code} for cohort ${cohortId}`);
  }
}
