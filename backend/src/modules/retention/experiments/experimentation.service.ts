// src/modules/retention/experiments/experimentation.service.ts — Experimentation Framework
// Phase-C5: Cohort-based experimentation for retention tuning

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
export type ExperimentVariant = string;

export interface Experiment {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  variants: ExperimentVariant[];
  defaultVariant: ExperimentVariant;
  cohortSize: number; // Percentage of users (1-100)
  startDate: Date;
  endDate?: Date;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: ExperimentVariant;
  assignedAt: Date;
}

// Predefined experiments
export const EXPERIMENTS: Record<string, Experiment> = {
  xp_curve_accelerated: {
    id: 'xp_curve_accelerated',
    name: 'Accelerated XP Curve',
    description: 'Test if faster early progression increases retention',
    enabled: true,
    variants: ['control', 'accelerated'],
    defaultVariant: 'control',
    cohortSize: 20,
    startDate: new Date(),
  },
  goal_difficulty: {
    id: 'goal_difficulty',
    name: 'Adaptive Goal Difficulty',
    description: 'Test different goal difficulty algorithms',
    enabled: true,
    variants: ['control', 'harder', 'easier'],
    defaultVariant: 'control',
    cohortSize: 30,
    startDate: new Date(),
  },
  notification_timing: {
    id: 'notification_timing',
    name: 'Notification Timing',
    description: 'Test optimal notification delivery times',
    enabled: true,
    variants: ['control', 'morning', 'evening'],
    defaultVariant: 'control',
    cohortSize: 25,
    startDate: new Date(),
  },
  challenge_frequency: {
    id: 'challenge_frequency',
    name: 'Challenge Frequency',
    description: 'Test daily vs weekly challenge frequency',
    enabled: true,
    variants: ['control', 'daily', 'weekly'],
    defaultVariant: 'control',
    cohortSize: 20,
    startDate: new Date(),
  },
};

// Redis keys
const EXPERIMENT_KEYS = {
  cohort: (userId: string, experimentId: string) => `experiment:cohort:${userId}:${experimentId}`,
  allCohorts: (userId: string) => `experiment:cohorts:${userId}`,
};

// Hash function for deterministic cohort assignment
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const experimentationService = {
  // ─── Assign user to experiment cohort ───────────────────────────────────
  async assignCohort(userId: string, experimentId: string): Promise<ExperimentVariant> {
    const experiment = EXPERIMENTS[experimentId];
    if (!experiment || !experiment.enabled) {
      return experiment?.defaultVariant ?? 'control';
    }

    // Check if already assigned
    const existing = await this.getCohort(userId, experimentId);
    if (existing) return existing;

    // Deterministic assignment based on user ID hash
    const userHash = hashString(`${userId}:${experimentId}`);
    const cohortIndex = userHash % 100;

    // Check if user is in experiment cohort
    if (cohortIndex >= experiment.cohortSize) {
      return experiment.defaultVariant;
    }

    // Assign variant based on hash
    const variantIndex = userHash % experiment.variants.length;
    const variant = experiment.variants[variantIndex];

    // Store assignment
    const redis = getRedisClient();
    const assignment: ExperimentAssignment = {
      experimentId,
      variant,
      assignedAt: new Date(),
    };

    await redis.hset(
      EXPERIMENT_KEYS.allCohorts(userId),
      experimentId,
      JSON.stringify(assignment)
    );

    logger.info('[experiments] Cohort assigned', {
      userId,
      experimentId,
      variant,
      cohortIndex,
    });

    return variant;
  },

  // ─── Get user's assigned cohort ─────────────────────────────────────────
  async getCohort(userId: string, experimentId: string): Promise<ExperimentVariant | null> {
    const redis = getRedisClient();
    const assignmentJson = await redis.hget(EXPERIMENT_KEYS.allCohorts(userId), experimentId);

    if (!assignmentJson) return null;

    const assignment = JSON.parse(assignmentJson) as ExperimentAssignment;
    return assignment.variant;
  },

  // ─── Get all experiment variants for user ───────────────────────────────
  async getExperimentVariants(userId: string): Promise<Record<string, ExperimentVariant>> {
    const variants: Record<string, ExperimentVariant> = {};

    for (const experimentId of Object.keys(EXPERIMENTS)) {
      const variant = await this.assignCohort(userId, experimentId);
      variants[experimentId] = variant;
    }

    return variants;
  },

  // ─── Get active experiments ─────────────────────────────────────────────
  getActiveExperiments(): Experiment[] {
    return Object.values(EXPERIMENTS).filter((e) => e.enabled);
  },

  // ─── Track experiment metric ────────────────────────────────────────────
  async trackMetric(
    userId: string,
    experimentId: string,
    metric: string,
    value: number
  ): Promise<void> {
    const variant = await this.getCohort(userId, experimentId);
    if (!variant) return;

    // Store metric for later analysis
    const redis = getRedisClient();
    const key = `experiment:metrics:${experimentId}:${variant}`;
    await redis.zadd(key, Date.now(), `${metric}:${value}`);
    await redis.expire(key, 60 * 60 * 24 * 90); // 90 days

    logger.debug('[experiments] Metric tracked', { userId, experimentId, variant, metric, value });
  },

  // ─── Get experiment results (summary) ───────────────────────────────────
  async getExperimentResults(experimentId: string): Promise<{
    experimentId: string;
    variants: Record<ExperimentVariant, { users: number; metrics: Record<string, number> }>;
  }> {
    const experiment = EXPERIMENTS[experimentId];
    if (!experiment) {
      return { experimentId, variants: {} as any };
    }

    const results: Record<ExperimentVariant, { users: number; metrics: Record<string, number> }> = {
      control: { users: 0, metrics: {} },
      a: { users: 0, metrics: {} },
      b: { users: 0, metrics: {} },
      c: { users: 0, metrics: {} },
    };

    const redis = getRedisClient();

    for (const variant of experiment.variants) {
      const key = `experiment:metrics:${experimentId}:${variant}`;

      // Get user count from cohort assignments
      const allCohorts = await redis.hgetall(EXPERIMENT_KEYS.allCohorts('*'));
      const variantUsers = Object.values(allCohorts).filter(
        (a) => JSON.parse(a).experimentId === experimentId && JSON.parse(a).variant === variant
      ).length;

      results[variant] = {
        users: variantUsers,
        metrics: {},
      };
    }

    return { experimentId, variants: results };
  },

  // ─── Check if user is in experiment group ───────────────────────────────
  async isInExperimentGroup(
    userId: string,
    experimentId: string,
    variant: ExperimentVariant
  ): Promise<boolean> {
    const userVariant = await this.getCohort(userId, experimentId);
    return userVariant === variant;
  },
};

export default experimentationService;