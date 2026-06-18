// src/modules/ml/training/ExperimentTracker.ts
// Tracks ML experiments: hyperparameters, metrics, artifacts, comparisons.

import { logger } from '../../../shared/logger.js';
import type { ExperimentRecord, TrainingRun, EvaluationMetrics } from '../types.js';

/**
 * ExperimentTracker
 *
 * Tracks and compares ML experiments:
 * - Hyperparameter configurations
 * - Training metrics over time
 * - Run comparisons
 * - Best model selection
 */
export class ExperimentTracker {
  private experiments: Map<string, ExperimentRecord> = new Map();

  constructor() {
    logger.info('[ExperimentTracker] Initialized');
  }

  /**
   * Create a new experiment.
   */
  createExperiment(name: string, description: string): ExperimentRecord {
    const experimentId = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: ExperimentRecord = {
      experimentId,
      name,
      description,
      runs: [],
      bestRunId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.experiments.set(experimentId, record);
    logger.info(`[ExperimentTracker] Created experiment ${experimentId}: ${name}`);
    return record;
  }

  /**
   * Log a training run to an experiment.
   */
  logRun(experimentId: string, run: TrainingRun): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      logger.warn(`[ExperimentTracker] Experiment ${experimentId} not found`);
      return;
    }

    experiment.runs.push(run);
    experiment.updatedAt = new Date().toISOString();

    // Update best run
    if (run.status === 'completed') {
      this.updateBestRun(experiment);
    }

    logger.info(`[ExperimentTracker] Logged run ${run.runId} to experiment ${experimentId}`);
  }

  /**
   * Compare runs within an experiment.
   */
  compareRuns(experimentId: string, metricName: keyof EvaluationMetrics): {
    runId: string;
    value: number;
    rank: number;
    config: Record<string, number | string | boolean>;
  }[] {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return [];

    const completedRuns = experiment.runs.filter(r => r.status === 'completed');
    const values = completedRuns
      .map(run => ({
        runId: run.runId,
        value: (run.metrics[metricName] as number) ?? 0,
        config: run.config.hyperparameters,
      }))
      .sort((a, b) => b.value - a.value);

    return values.map((v, i) => ({ ...v, rank: i + 1 }));
  }

  /**
   * Get the best run for an experiment.
   */
  getBestRun(experimentId: string): TrainingRun | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.bestRunId) return null;
    return experiment.runs.find(r => r.runId === experiment.bestRunId) ?? null;
  }

  /**
   * Get experiment details.
   */
  getExperiment(experimentId: string): ExperimentRecord | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * List all experiments.
   */
  listExperiments(): ExperimentRecord[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get summary statistics for an experiment.
   */
  getSummary(experimentId: string): {
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    bestMetrics: EvaluationMetrics | null;
    metricProgression: { runId: string; metrics: EvaluationMetrics }[];
  } | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const completed = experiment.runs.filter(r => r.status === 'completed');
    const failed = experiment.runs.filter(r => r.status === 'failed');
    const bestRun = this.getBestRun(experimentId);

    return {
      totalRuns: experiment.runs.length,
      completedRuns: completed.length,
      failedRuns: failed.length,
      bestMetrics: bestRun?.metrics ?? null,
      metricProgression: completed.map(r => ({ runId: r.runId, metrics: r.metrics })),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private updateBestRun(experiment: ExperimentRecord): void {
    const completed = experiment.runs.filter(r => r.status === 'completed');
    if (completed.length === 0) return;

    // Select best by primary metric (NDCG > F1 > accuracy)
    let bestRun = completed[0];
    let bestScore = this.primaryMetric(bestRun.metrics);

    for (const run of completed.slice(1)) {
      const score = this.primaryMetric(run.metrics);
      if (score > bestScore) {
        bestScore = score;
        bestRun = run;
      }
    }

    experiment.bestRunId = bestRun.runId;
  }

  private primaryMetric(metrics: EvaluationMetrics): number {
    return metrics.ndcg ?? metrics.f1 ?? metrics.accuracy ?? metrics.auc ?? 0;
  }
}
