// src/modules/ml/training/MLTrainingPipeline.ts
// Feature ingestion, dataset versioning, training orchestration, validation splits.

import { logger } from '../../../shared/logger.js';
import type { TrainingConfig, TrainingRun, TrainingDataset, TrainingSample, EvaluationMetrics } from '../types.js';

/**
 * MLTrainingPipeline
 *
 * Production-grade training pipeline supporting:
 * - Feature ingestion from multiple sources
 * - Dataset versioning with integrity hashing
 * - Training orchestration with validation splits
 * - Cross-validation support
 * - Checkpoint persistence
 */
export class MLTrainingPipeline {
  private datasets: Map<string, TrainingDataset> = new Map();
  private runs: Map<string, TrainingRun> = new Map();

  constructor() {
    logger.info('[MLTrainingPipeline] Initialized');
  }

  /**
   * Ingest features and create a versioned dataset.
   */
  createDataset(
    name: string,
    samples: TrainingSample[],
    featureNames: string[],
  ): TrainingDataset {
    const datasetId = `ds-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const hash = this.computeDatasetHash(samples);

    const dataset: TrainingDataset = {
      datasetId,
      name,
      version: '1.0.0',
      featureNames,
      numSamples: samples.length,
      numFeatures: featureNames.length,
      createdAt: new Date().toISOString(),
      splits: this.computeSplitSizes(samples.length),
      hash,
    };

    this.datasets.set(datasetId, dataset);
    logger.info(`[MLTrainingPipeline] Created dataset ${datasetId}: ${samples.length} samples, ${featureNames.length} features`);

    return dataset;
  }

  /**
   * Split dataset into train/validation/test sets.
   */
  splitDataset(
    samples: TrainingSample[],
    validationRatio: number = 0.15,
    testRatio: number = 0.15,
    seed: number = 42,
  ): { train: TrainingSample[]; validation: TrainingSample[]; test: TrainingSample[] } {
    // Deterministic shuffle using seed
    const shuffled = [...samples];
    let s = seed;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const valSize = Math.floor(samples.length * validationRatio);
    const testSize = Math.floor(samples.length * testRatio);
    const trainSize = samples.length - valSize - testSize;

    return {
      train: shuffled.slice(0, trainSize),
      validation: shuffled.slice(trainSize, trainSize + valSize),
      test: shuffled.slice(trainSize + valSize),
    };
  }

  /**
   * Orchestrate a training run.
   */
  async startTrainingRun(
    config: TrainingConfig,
    trainFn: (samples: TrainingSample[], config: TrainingConfig) => Promise<EvaluationMetrics>,
    samples: TrainingSample[],
  ): Promise<TrainingRun> {
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const run: TrainingRun = {
      runId,
      experimentId: config.datasetId,
      modelId: `model-${runId}`,
      config,
      metrics: {},
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      checkpoints: [],
    };

    this.runs.set(runId, run);
    logger.info(`[MLTrainingPipeline] Starting run ${runId}`);

    try {
      // Split data
      const { train, validation } = this.splitDataset(samples, config.validationSplit);

      // Execute training
      const metrics = await trainFn(train, config);

      // Update run
      run.metrics = metrics;
      run.status = 'completed';
      run.completedAt = new Date().toISOString();

      logger.info(`[MLTrainingPipeline] Run ${runId} completed`, { metrics });
    } catch (error) {
      run.status = 'failed';
      run.completedAt = new Date().toISOString();
      logger.error(`[MLTrainingPipeline] Run ${runId} failed`, error);
    }

    return run;
  }

  /**
   * K-fold cross-validation.
   */
  async crossValidate(
    samples: TrainingSample[],
    k: number,
    trainFn: (train: TrainingSample[], val: TrainingSample[]) => Promise<EvaluationMetrics>,
  ): Promise<{ foldMetrics: EvaluationMetrics[]; averageMetrics: EvaluationMetrics }> {
    logger.info(`[MLTrainingPipeline] ${k}-fold cross-validation with ${samples.length} samples`);

    const foldSize = Math.floor(samples.length / k);
    const foldMetrics: EvaluationMetrics[] = [];

    for (let fold = 0; fold < k; fold++) {
      const valStart = fold * foldSize;
      const valEnd = fold === k - 1 ? samples.length : (fold + 1) * foldSize;

      const val = samples.slice(valStart, valEnd);
      const train = [...samples.slice(0, valStart), ...samples.slice(valEnd)];

      const metrics = await trainFn(train, val);
      foldMetrics.push(metrics);
    }

    const averageMetrics = this.averageMetrics(foldMetrics);

    logger.info(`[MLTrainingPipeline] Cross-validation complete`, { averageMetrics });
    return { foldMetrics, averageMetrics };
  }

  /**
   * Get all runs.
   */
  getRuns(): TrainingRun[] {
    return Array.from(this.runs.values());
  }

  /**
   * Get all datasets.
   */
  getDatasets(): TrainingDataset[] {
    return Array.from(this.datasets.values());
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private computeDatasetHash(samples: TrainingSample[]): string {
    // Simple hash of dataset structure
    let hash = 0;
    for (const sample of samples) {
      for (const v of sample.features) {
        hash = ((hash << 5) - hash + Math.floor(v * 1000)) | 0;
      }
      hash = ((hash << 5) - hash + Math.floor(sample.label * 1000)) | 0;
    }
    return `hash-${Math.abs(hash).toString(16)}`;
  }

  private computeSplitSizes(total: number): { train: number; validation: number; test: number } {
    const val = Math.floor(total * 0.15);
    const test = Math.floor(total * 0.15);
    return { train: total - val - test, validation: val, test };
  }

  private averageMetrics(metrics: EvaluationMetrics[]): EvaluationMetrics {
    const result: EvaluationMetrics = {};
    const keys: (keyof EvaluationMetrics)[] = ['ndcg', 'mrr', 'f1', 'accuracy', 'auc', 'logloss', 'mae', 'rmse'];

    for (const key of keys) {
      const values = metrics.map(m => m[key]).filter((v): v is number => v !== undefined);
      if (values.length > 0) {
        (result as Record<string, number>)[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }

    return result;
  }
}
