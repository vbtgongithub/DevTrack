// src/modules/ml/training/TrainingDatasetCompiler.ts
// Compiles training datasets from raw signals with feature engineering.

import { logger } from '../../../shared/logger.js';
import type { TrainingSample, FeatureVector } from '../types.js';

interface RawSignal {
  source: string;
  features: Record<string, number | boolean | string>;
  label?: number;
  weight?: number;
  queryId?: string;
}

interface FeatureTransform {
  name: string;
  type: 'numeric' | 'log' | 'binary' | 'normalize' | 'interaction' | 'polynomial';
  sourceFeatures: string[];
  params?: Record<string, number>;
}

/**
 * TrainingDatasetCompiler
 *
 * Compiles training datasets from raw signals with:
 * - Feature extraction from heterogeneous sources
 * - Feature engineering (log transforms, interactions, polynomials)
 * - Normalization (min-max, z-score)
 * - Missing value imputation
 * - Feature selection based on variance
 */
export class TrainingDatasetCompiler {
  private transforms: FeatureTransform[] = [];
  private featureStats: Map<string, { min: number; max: number; mean: number; std: number }> = new Map();

  constructor() {
    logger.info('[TrainingDatasetCompiler] Initialized');
  }

  /**
   * Register a feature transform.
   */
  addTransform(transform: FeatureTransform): void {
    this.transforms.push(transform);
  }

  /**
   * Compile raw signals into training samples.
   */
  compile(signals: RawSignal[]): { samples: TrainingSample[]; featureNames: string[] } {
    logger.info(`[TrainingDatasetCompiler] Compiling ${signals.length} signals`);

    // 1. Extract base features
    const allFeatureNames = new Set<string>();
    for (const signal of signals) {
      for (const key of Object.keys(signal.features)) {
        allFeatureNames.add(key);
      }
    }

    const baseFeatureNames = Array.from(allFeatureNames).sort();

    // 2. Build raw feature vectors
    const rawVectors: number[][] = signals.map(signal =>
      baseFeatureNames.map(name => this.toNumeric(signal.features[name])),
    );

    // 3. Compute feature statistics for normalization
    this.computeStats(baseFeatureNames, rawVectors);

    // 4. Apply transforms and build final feature vectors
    const transformedFeatureNames = [...baseFeatureNames];
    const transformedVectors = rawVectors.map(v => [...v]);

    for (const transform of this.transforms) {
      this.applyTransform(transform, baseFeatureNames, transformedVectors, transformedFeatureNames);
    }

    // 5. Normalize features
    const normalized = this.normalizeFeatures(transformedFeatureNames, transformedVectors);

    // 6. Remove low-variance features
    const { features: finalFeatures, names: finalNames } = this.removeZeroVariance(transformedFeatureNames, normalized);

    // 7. Convert to training samples
    const samples: TrainingSample[] = signals.map((signal, i) => ({
      features: finalFeatures[i],
      label: signal.label ?? 0,
      weight: signal.weight,
      queryId: signal.queryId,
    }));

    logger.info(`[TrainingDatasetCompiler] Compiled ${samples.length} samples with ${finalNames.length} features`);

    return { samples, featureNames: finalNames };
  }

  /**
   * Transform a single raw signal into a feature vector (for inference).
   */
  transformSingle(signal: RawSignal, featureNames: string[]): FeatureVector {
    const values = featureNames.map(name => {
      const raw = this.toNumeric(signal.features[name]);
      const stats = this.featureStats.get(name);
      if (stats && stats.max !== stats.min) {
        return (raw - stats.min) / (stats.max - stats.min);
      }
      return raw;
    });

    return { values, names: featureNames };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private toNumeric(value: number | boolean | string | undefined): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private computeStats(names: string[], vectors: number[][]): void {
    for (let f = 0; f < names.length; f++) {
      const values = vectors.map(v => v[f]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length);
      this.featureStats.set(names[f], { min, max, mean, std });
    }
  }

  private applyTransform(
    transform: FeatureTransform,
    baseNames: string[],
    vectors: number[][],
    names: string[],
  ): void {
    switch (transform.type) {
      case 'log': {
        const idx = baseNames.indexOf(transform.sourceFeatures[0]);
        if (idx >= 0) {
          const newName = `${transform.name}_log`;
          names.push(newName);
          for (const v of vectors) {
            v.push(Math.log1p(Math.max(0, v[idx])));
          }
        }
        break;
      }
      case 'interaction': {
        const idx1 = baseNames.indexOf(transform.sourceFeatures[0]);
        const idx2 = baseNames.indexOf(transform.sourceFeatures[1]);
        if (idx1 >= 0 && idx2 >= 0) {
          names.push(transform.name);
          for (const v of vectors) {
            v.push(v[idx1] * v[idx2]);
          }
        }
        break;
      }
      case 'polynomial': {
        const idx = baseNames.indexOf(transform.sourceFeatures[0]);
        const degree = transform.params?.degree ?? 2;
        if (idx >= 0) {
          names.push(`${transform.name}_poly${degree}`);
          for (const v of vectors) {
            v.push(v[idx] ** degree);
          }
        }
        break;
      }
    }
  }

  private normalizeFeatures(names: string[], vectors: number[][]): number[][] {
    return vectors.map(v =>
      v.map((val, f) => {
        const stats = this.featureStats.get(names[f]);
        if (stats && stats.max !== stats.min) {
          return (val - stats.min) / (stats.max - stats.min);
        }
        return val;
      }),
    );
  }

  private removeZeroVariance(
    names: string[],
    vectors: number[][],
  ): { features: number[][]; names: string[] } {
    const keepIndices: number[] = [];
    const keepNames: string[] = [];

    for (let f = 0; f < names.length; f++) {
      const values = vectors.map(v => v[f]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
      if (variance > 1e-10) {
        keepIndices.push(f);
        keepNames.push(names[f]);
      }
    }

    const filtered = vectors.map(v => keepIndices.map(i => v[i]));
    return { features: filtered, names: keepNames };
  }
}
