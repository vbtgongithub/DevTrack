// src/modules/ml/online-eval/OnlineMLEvaluationEngine.ts
// Tracks live ranking quality, recommendation usefulness, semantic retrieval
// quality, ATS semantic realism. Continuous ML calibration.

import { logger } from '../../../shared/logger.js';
import type { OnlineMetric, DriftReport, DriftStatus, EvaluationMetrics } from '../types.js';

interface LiveSignal {
  modelId: string;
  metricName: string;
  value: number;
  timestamp: number;
}

interface QualityWindow {
  signals: LiveSignal[];
  startTime: number;
  windowMs: number;
}

/**
 * OnlineMLEvaluationEngine
 *
 * Continuous live ML quality monitoring:
 * - Live ranking quality (NDCG drift, MRR drift)
 * - Recommendation usefulness (acceptance rate, completion rate)
 * - Semantic retrieval quality (relevance drift)
 * - ATS semantic realism (accuracy drift)
 *
 * Enables continuous ML calibration by detecting quality degradation in real-time.
 */
export class OnlineMLEvaluationEngine {
  private windows: Map<string, QualityWindow> = new Map();
  private baselines: Map<string, number> = new Map();
  private driftThreshold: number;
  private windowDurations: Record<string, number> = {
    'realtime': 60_000,          // 1 minute
    '1h': 3_600_000,            // 1 hour
    '24h': 86_400_000,          // 24 hours
    '7d': 604_800_000,          // 7 days
  };

  // Drift alerts
  private driftAlerts: { modelId: string; metric: string; severity: 'warning' | 'critical'; timestamp: string }[] = [];

  constructor(config?: { driftThreshold?: number }) {
    this.driftThreshold = config?.driftThreshold ?? 0.1;
    logger.info('[OnlineMLEvaluationEngine] Initialized', { driftThreshold: this.driftThreshold });
  }

  /**
   * Record a live metric signal.
   */
  recordSignal(modelId: string, metricName: string, value: number): void {
    const key = `${modelId}:${metricName}`;
    const now = Date.now();

    const window = this.windows.get(key) ?? {
      signals: [],
      startTime: now,
      windowMs: this.windowDurations['24h'],
    };

    window.signals.push({ modelId, metricName, value, timestamp: now });

    // Prune old signals
    const cutoff = now - window.windowMs;
    window.signals = window.signals.filter(s => s.timestamp > cutoff);

    this.windows.set(key, window);

    // Check for drift
    this.checkDrift(modelId, metricName, value);
  }

  /**
   * Set baseline for a metric.
   */
  setBaseline(modelId: string, metricName: string, value: number): void {
    this.baselines.set(`${modelId}:${metricName}`, value);
    logger.info(`[OnlineMLEvaluation] Baseline set: ${modelId}:${metricName} = ${value}`);
  }

  /**
   * Get current metric values across windows.
   */
  getMetrics(modelId: string, metricName: string): OnlineMetric[] {
    const key = `${modelId}:${metricName}`;
    const window = this.windows.get(key);
    if (!window || window.signals.length === 0) return [];

    const now = Date.now();
    const results: OnlineMetric[] = [];

    for (const [windowName, windowMs] of Object.entries(this.windowDurations)) {
      const cutoff = now - windowMs;
      const windowSignals = window.signals.filter(s => s.timestamp > cutoff);

      if (windowSignals.length > 0) {
        const avg = windowSignals.reduce((sum, s) => sum + s.value, 0) / windowSignals.length;
        results.push({
          metricName,
          value: avg,
          window: windowName as OnlineMetric['window'],
          sampleCount: windowSignals.length,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Generate a drift report for a model.
   */
  generateDriftReport(modelId: string): DriftReport {
    const featureDrift: DriftReport['featureDrift'] = [];
    const predictionDrift: DriftReport['predictionDrift'] = [];
    let overallDriftStatus: DriftStatus = 'stable';

    // Check all metrics for this model
    for (const [key, window] of this.windows) {
      if (!key.startsWith(`${modelId}:`)) continue;
      const metricName = key.split(':')[1];

      const baseline = this.baselines.get(key);
      if (baseline === undefined) continue;

      const recentSignals = window.signals.filter(s =>
        s.timestamp > Date.now() - this.windowDurations['1h'],
      );

      if (recentSignals.length === 0) continue;

      const currentAvg = recentSignals.reduce((s, sig) => s + sig.value, 0) / recentSignals.length;

      // Compute PSI-like score
      const drift = Math.abs(currentAvg - baseline) / (Math.abs(baseline) || 1);
      const drifted = drift > this.driftThreshold;

      predictionDrift.push({
        metricName,
        baseline,
        current: currentAvg,
        drifted,
      });

      if (drifted) {
        if (drift > this.driftThreshold * 2) {
          overallDriftStatus = 'critical';
        } else if (overallDriftStatus !== 'critical') {
          overallDriftStatus = 'drifting';
        }
      }
    }

    return {
      modelId,
      featureDrift,
      predictionDrift,
      overallDriftStatus,
      detectedAt: new Date().toISOString(),
    };
  }

  /**
   * Track ranking quality live.
   */
  recordRankingQuality(modelId: string, ndcg: number, mrr: number): void {
    this.recordSignal(modelId, 'ranking_ndcg', ndcg);
    this.recordSignal(modelId, 'ranking_mrr', mrr);
  }

  /**
   * Track recommendation usefulness live.
   */
  recordRecommendationUsefulness(modelId: string, accepted: boolean, completed: boolean): void {
    this.recordSignal(modelId, 'recommendation_acceptance', accepted ? 1 : 0);
    this.recordSignal(modelId, 'recommendation_completion', completed ? 1 : 0);
  }

  /**
   * Track semantic retrieval quality live.
   */
  recordRetrievalQuality(modelId: string, relevanceScore: number): void {
    this.recordSignal(modelId, 'retrieval_relevance', relevanceScore);
  }

  /**
   * Track ATS semantic quality live.
   */
  recordATSQuality(modelId: string, atsScore: number): void {
    this.recordSignal(modelId, 'ats_semantic_quality', atsScore);
  }

  /**
   * Get drift alerts.
   */
  getDriftAlerts(): typeof this.driftAlerts {
    return this.driftAlerts;
  }

  /**
   * Get overall health summary.
   */
  getHealthSummary(): {
    modelsMonitored: number;
    metricsTracked: number;
    driftingModels: string[];
    criticalModels: string[];
  } {
    const modelIds = new Set<string>();
    const driftingModels = new Set<string>();
    const criticalModels = new Set<string>();

    for (const key of this.windows.keys()) {
      const modelId = key.split(':')[0];
      modelIds.add(modelId);

      const report = this.generateDriftReport(modelId);
      if (report.overallDriftStatus === 'drifting') driftingModels.add(modelId);
      if (report.overallDriftStatus === 'critical') criticalModels.add(modelId);
    }

    return {
      modelsMonitored: modelIds.size,
      metricsTracked: this.windows.size,
      driftingModels: Array.from(driftingModels),
      criticalModels: Array.from(criticalModels),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private checkDrift(modelId: string, metricName: string, currentValue: number): void {
    const key = `${modelId}:${metricName}`;
    const baseline = this.baselines.get(key);
    if (baseline === undefined) return;

    const drift = Math.abs(currentValue - baseline) / (Math.abs(baseline) || 1);

    if (drift > this.driftThreshold * 2) {
      this.driftAlerts.push({
        modelId,
        metric: metricName,
        severity: 'critical',
        timestamp: new Date().toISOString(),
      });
      logger.warn(`[OnlineMLEvaluation] CRITICAL drift: ${modelId}:${metricName} = ${currentValue} (baseline: ${baseline}, drift: ${(drift * 100).toFixed(1)}%)`);
    } else if (drift > this.driftThreshold) {
      this.driftAlerts.push({
        modelId,
        metric: metricName,
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
      logger.info(`[OnlineMLEvaluation] Warning drift: ${modelId}:${metricName} = ${currentValue} (baseline: ${baseline})`);
    }
  }
}
