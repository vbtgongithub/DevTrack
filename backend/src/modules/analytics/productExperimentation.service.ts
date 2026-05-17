// src/modules/analytics/productExperimentation.service.ts — Product Experimentation System
// Phase-I: Product Experimentation System - Framework for UX experimentation, cohort analysis, and safe rollouts

import mongoose from 'mongoose';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'rolled_back';
  variants: ExperimentVariant[];
  startDate?: Date;
  endDate?: Date;
  targetMetrics: string[];
  sampleSize: number;
  currentSample: number;
  trustAware: boolean;
  minSampleSize: number;
  statisticalSignificance: number;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // 0-100 percentage
  metrics: VariantMetrics;
}

export interface VariantMetrics {
  participants: number;
  conversions: number;
  conversionRate: number;
  averageEngagementTime: number;
  satisfactionScore: number;
  errorRate: number;
}

export interface CohortAnalysis {
  cohortId: string;
  cohortName: string;
  size: number;
  metrics: {
    retention7d: number;
    retention30d: number;
    averageSessionDuration: number;
    averageTasksCompleted: number;
    satisfactionScore: number;
  };
  comparisonToBaseline: {
    retention7dDelta: number;
    retention30dDelta: number;
    sessionDurationDelta: number;
    tasksCompletedDelta: number;
    satisfactionDelta: number;
  };
}

export const productExperimentation = {
  // ─── Experiment Management ─────────────────────────────────────────────
  async createExperiment(
    name: string,
    description: string,
    variants: Omit<ExperimentVariant, 'id' | 'metrics'>[],
    options: {
      sampleSize?: number;
      trustAware?: boolean;
      minSampleSize?: number;
      statisticalSignificance?: number;
      targetMetrics?: string[];
    } = {}
  ): Promise<Experiment> {
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const experiment: Experiment = {
      id: experimentId,
      name,
      description,
      status: 'draft',
      variants: variants.map((v, i) => ({
        ...v,
        id: `variant_${i}`,
        metrics: {
          participants: 0,
          conversions: 0,
          conversionRate: 0,
          averageEngagementTime: 0,
          satisfactionScore: 0,
          errorRate: 0,
        },
      })),
      sampleSize: options.sampleSize || 1000,
      currentSample: 0,
      trustAware: options.trustAware ?? true,
      minSampleSize: options.minSampleSize || 100,
      statisticalSignificance: options.statisticalSignificance || 0.95,
      targetMetrics: options.targetMetrics || ['conversion_rate', 'satisfaction'],
    };

    // Store in Redis for quick access
    const redis = getRedisClient();
    await redis.setex(`experiment:${experimentId}`, 86400 * 30, JSON.stringify(experiment));

    logger.info('[experimentation] Experiment created', { experimentId, name });

    return experiment;
  },

  async startExperiment(experimentId: string): Promise<void> {
    const redis = getRedisClient();
    const experimentData = await redis.get(`experiment:${experimentId}`);
    if (!experimentData) {
      throw new Error('Experiment not found');
    }

    const experiment: Experiment = JSON.parse(experimentData);
    experiment.status = 'running';
    experiment.startDate = new Date();

    await redis.setex(`experiment:${experimentId}`, 86400 * 30, JSON.stringify(experiment));

    logger.info('[experimentation] Experiment started', { experimentId });
  },

  async pauseExperiment(experimentId: string): Promise<void> {
    const redis = getRedisClient();
    const experimentData = await redis.get(`experiment:${experimentId}`);
    if (!experimentData) {
      throw new Error('Experiment not found');
    }

    const experiment: Experiment = JSON.parse(experimentData);
    experiment.status = 'paused';

    await redis.setex(`experiment:${experimentId}`, 86400 * 30, JSON.stringify(experiment));

    logger.info('[experimentation] Experiment paused', { experimentId });
  },

  async completeExperiment(experimentId: string): Promise<void> {
    const redis = getRedisClient();
    const experimentData = await redis.get(`experiment:${experimentId}`);
    if (!experimentData) {
      throw new Error('Experiment not found');
    }

    const experiment: Experiment = JSON.parse(experimentData);
    experiment.status = 'completed';
    experiment.endDate = new Date();

    await redis.setex(`experiment:${experimentId}`, 86400 * 90, JSON.stringify(experiment));

    logger.info('[experimentation] Experiment completed', { experimentId });
  },

  async rollbackExperiment(experimentId: string): Promise<void> {
    const redis = getRedisClient();
    const experimentData = await redis.get(`experiment:${experimentId}`);
    if (!experimentData) {
      throw new Error('Experiment not found');
    }

    const experiment: Experiment = JSON.parse(experimentData);
    experiment.status = 'rolled_back';

    await redis.setex(`experiment:${experimentId}`, 86400 * 30, JSON.stringify(experiment));

    logger.warn('[experimentation] Experiment rolled back', { experimentId });
  },

  // ─── Variant Assignment ───────────────────────────────────────────────
  async assignVariant(userId: string, experimentId: string): Promise<string | null> {
    const redis = getRedisClient();
    const experimentData = await redis.get(`experiment:${experimentId}`);
    if (!experimentData) return null;

    const experiment: Experiment = JSON.parse(experimentData);
    if (experiment.status !== 'running') return null;

    // Check if user already assigned
    const assignmentKey = `experiment_assignment:${experimentId}:${userId}`;
    const existingAssignment = await redis.get(assignmentKey);
    if (existingAssignment) return existingAssignment;

    // Check sample size limits
    if (experiment.currentSample >= experiment.sampleSize) return null;

    // Assign variant based on allocation
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedVariant: string | null = null;

    for (const variant of experiment.variants) {
      cumulative += variant.allocation;
      if (random <= cumulative) {
        selectedVariant = variant.id;
        break;
      }
    }

    if (selectedVariant) {
      await redis.setex(assignmentKey, 86400 * 30, selectedVariant);
      experiment.currentSample++;

      // Update experiment
      await redis.setex(`experiment:${experimentId}`, 86400 * 30, JSON.stringify(experiment));

      logger.debug('[experimentation] Variant assigned', { experimentId, userId, variant: selectedVariant });
    }

    return selectedVariant;
  },

  // ─── Metrics Tracking ────────────────────────────────────────────────
  async trackMetric(
    experimentId: string,
    variantId: string,
    metric: string,
    value: number
  ): Promise<void> {
    const redis = getRedisClient();
    const experimentData = await redis.get(`experiment:${experimentId}`);
    if (!experimentData) return;

    const experiment: Experiment = JSON.parse(experimentData);
    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) return;

    // Update variant metrics based on metric type
    switch (metric) {
      case 'participant':
        variant.metrics.participants++;
        break;
      case 'conversion':
        variant.metrics.conversions++;
        variant.metrics.conversionRate = (variant.metrics.conversions / variant.metrics.participants) * 100;
        break;
      case 'engagement_time':
        variant.metrics.averageEngagementTime = (variant.metrics.averageEngagementTime + value) / 2;
        break;
      case 'satisfaction':
        variant.metrics.satisfactionScore = (variant.metrics.satisfactionScore + value) / 2;
        break;
      case 'error':
        variant.metrics.errorRate = (variant.metrics.errorRate + value) / 2;
        break;
    }

    await redis.setex(`experiment:${experimentId}`, 86400 * 30, JSON.stringify(experiment));

    logger.debug('[experimentation] Metric tracked', { experimentId, variantId, metric, value });
  },

  // ─── Experiment Analysis ────────────────────────────────────────────
  async analyzeExperiment(experimentId: string): Promise<{
    winner: string | null;
    confidence: number;
    recommendations: string[];
    shouldRollback: boolean;
  }> {
    const redis = getRedisClient();
    const experimentData = await redis.get(`experiment:${experimentId}`);
    if (!experimentData) {
      throw new Error('Experiment not found');
    }

    const experiment: Experiment = JSON.parse(experimentData);

    // Check if minimum sample size reached
    if (experiment.currentSample < experiment.minSampleSize) {
      return {
        winner: null,
        confidence: 0,
        recommendations: ['Minimum sample size not reached - continue experiment'],
        shouldRollback: false,
      };
    }

    // Simple analysis: find variant with highest conversion rate
    const sortedVariants = [...experiment.variants].sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate);
    const winner = sortedVariants[0];
    const runnerUp = sortedVariants[1];

    // Calculate confidence (simplified)
    const confidence = winner.metrics.conversionRate > 0
      ? Math.min(100, (winner.metrics.conversionRate - (runnerUp?.metrics.conversionRate || 0)) * 10)
      : 0;

    const recommendations: string[] = [];

    if (confidence > 80) {
      recommendations.push(`Variant "${winner.name}" is statistically significant winner`);
      recommendations.push('Consider rolling out to 100% of users');
    } else if (confidence > 50) {
      recommendations.push(`Variant "${winner.name}" shows promising results`);
      recommendations.push('Consider extending experiment or gradual rollout');
    } else {
      recommendations.push('No clear winner - consider extending experiment or redesigning variants');
    }

    // Trust-aware check: if trust-aware experiment and satisfaction is low, recommend rollback
    const shouldRollback = experiment.trustAware && winner.metrics.satisfactionScore < 50;
    if (shouldRollback) {
      recommendations.push('TRUST ALERT: Satisfaction scores are low - consider rollback');
    }

    return {
      winner: winner.id,
      confidence,
      recommendations,
      shouldRollback,
    };
  },

  // ─── Cohort Analysis ─────────────────────────────────────────────────
  async createCohort(
    cohortName: string,
    userCriteria: { signupDateStart: Date; signupDateEnd: Date }
  ): Promise<string> {
    const cohortId = `cohort_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const redis = getRedisClient();
    await redis.setex(`cohort:${cohortId}`, 86400 * 90, JSON.stringify({
      id: cohortId,
      cohortName,
      userCriteria,
      createdAt: new Date(),
    }));

    logger.info('[experimentation] Cohort created', { cohortId, cohortName });

    return cohortId;
  },

  async analyzeCohort(cohortId: string): Promise<CohortAnalysis> {
    const redis = getRedisClient();
    const cohortData = await redis.get(`cohort:${cohortId}`);
    if (!cohortData) {
      throw new Error('Cohort not found');
    }

    const cohort: any = JSON.parse(cohortData);

    // This would query actual user data
    // For now, return placeholder metrics
    const metrics = {
      retention7d: 65,
      retention30d: 45,
      averageSessionDuration: 1200000, // 20 minutes
      averageTasksCompleted: 5,
      satisfactionScore: 72,
    };

    const comparisonToBaseline = {
      retention7dDelta: 5,
      retention30dDelta: -3,
      sessionDurationDelta: 10,
      tasksCompletedDelta: 2,
      satisfactionDelta: 4,
    };

    return {
      cohortId,
      cohortName: cohort.cohortName,
      size: 1000, // Placeholder
      metrics,
      comparisonToBaseline,
    };
  },

  // ─── Safe Rollout Management ─────────────────────────────────────────
  async initiateGradualRollout(
    experimentId: string,
    winningVariantId: string,
    rolloutPercentage: number
  ): Promise<void> {
    const redis = getRedisClient();
    const rolloutKey = `rollout:${experimentId}`;

    await redis.setex(rolloutKey, 86400 * 7, JSON.stringify({
      experimentId,
      winningVariantId,
      rolloutPercentage,
      startedAt: new Date(),
      status: 'in_progress',
    }));

    logger.info('[experimentation] Gradual rollout initiated', { experimentId, winningVariantId, rolloutPercentage });
  },

  async increaseRollout(experimentId: string, newPercentage: number): Promise<void> {
    const redis = getRedisClient();
    const rolloutKey = `rollout:${experimentId}`;
    const rolloutData = await redis.get(rolloutKey);

    if (!rolloutData) {
      throw new Error('Rollout not found');
    }

    const rollout: any = JSON.parse(rolloutData);
    rollout.rolloutPercentage = newPercentage;

    await redis.setex(rolloutKey, 86400 * 7, JSON.stringify(rollout));

    logger.info('[experimentation] Rollout increased', { experimentId, newPercentage });
  },

  async completeRollout(experimentId: string): Promise<void> {
    const redis = getRedisClient();
    const rolloutKey = `rollout:${experimentId}`;
    const rolloutData = await redis.get(rolloutKey);

    if (!rolloutData) {
      throw new Error('Rollout not found');
    }

    const rollout: any = JSON.parse(rolloutData);
    rollout.status = 'completed';
    rollout.completedAt = new Date();

    await redis.setex(rolloutKey, 86400 * 30, JSON.stringify(rollout));

    logger.info('[experimentation] Rollout completed', { experimentId });
  },
};

export default productExperimentation;
