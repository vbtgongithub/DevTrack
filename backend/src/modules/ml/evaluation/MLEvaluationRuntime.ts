// src/modules/ml/evaluation/MLEvaluationRuntime.ts
// Computes NDCG, MRR, Precision@K, Recall@K, F1, Accuracy.
// No model deployment without evaluation.

import { logger } from '../../../shared/logger.js';
import type { EvaluationMetrics } from '../types.js';

interface RankingEvalInput {
  predicted: string[];     // ordered predicted items
  relevant: Set<string>;   // ground truth relevant items
}

interface ClassificationEvalInput {
  predicted: number[];     // predicted labels (0/1)
  actual: number[];        // ground truth labels (0/1)
}

interface EvaluationReport {
  metrics: EvaluationMetrics;
  perQueryMetrics?: { queryId: string; metrics: EvaluationMetrics }[];
  summary: string;
  timestamp: string;
}

/**
 * MLEvaluationRuntime
 *
 * Comprehensive ML evaluation infrastructure.
 *
 * Ranking metrics: NDCG, MRR, Precision@K, Recall@K
 * Classification metrics: F1, Accuracy, Precision, Recall
 * Quality assessment: ranking, classification, semantic, recommendation, ATS
 *
 * GOVERNANCE: No model deployment without evaluation.
 */
export class MLEvaluationRuntime {
  constructor() {
    logger.info('[MLEvaluationRuntime] Initialized');
  }

  // ---------------------------------------------------------------------------
  // Ranking Metrics
  // ---------------------------------------------------------------------------

  /**
   * Normalized Discounted Cumulative Gain at K.
   */
  ndcgAtK(predicted: string[], relevant: Set<string>, k: number): number {
    const dcg = this.dcgAtK(predicted, relevant, k);
    const idealOrder = predicted
      .map(id => relevant.has(id) ? 1 : 0)
      .sort((a, b) => b - a);
    const idcg = this.dcgFromRelevance(idealOrder, k);
    return idcg > 0 ? dcg / idcg : 0;
  }

  /**
   * Mean Reciprocal Rank.
   */
  mrr(queries: RankingEvalInput[]): number {
    let totalRR = 0;
    for (const query of queries) {
      for (let i = 0; i < query.predicted.length; i++) {
        if (query.relevant.has(query.predicted[i])) {
          totalRR += 1 / (i + 1);
          break;
        }
      }
    }
    return queries.length > 0 ? totalRR / queries.length : 0;
  }

  /**
   * Precision at K.
   */
  precisionAtK(predicted: string[], relevant: Set<string>, k: number): number {
    const topK = predicted.slice(0, k);
    const hits = topK.filter(id => relevant.has(id)).length;
    return k > 0 ? hits / k : 0;
  }

  /**
   * Recall at K.
   */
  recallAtK(predicted: string[], relevant: Set<string>, k: number): number {
    const topK = predicted.slice(0, k);
    const hits = topK.filter(id => relevant.has(id)).length;
    return relevant.size > 0 ? hits / relevant.size : 0;
  }

  // ---------------------------------------------------------------------------
  // Classification Metrics
  // ---------------------------------------------------------------------------

  /**
   * F1 Score.
   */
  f1Score(predicted: number[], actual: number[]): number {
    const precision = this.precision(predicted, actual);
    const recall = this.recall(predicted, actual);
    return precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  }

  /**
   * Accuracy.
   */
  accuracy(predicted: number[], actual: number[]): number {
    if (predicted.length === 0) return 0;
    const correct = predicted.filter((p, i) => p === actual[i]).length;
    return correct / predicted.length;
  }

  /**
   * Precision (positive class).
   */
  precision(predicted: number[], actual: number[]): number {
    const tp = predicted.filter((p, i) => p === 1 && actual[i] === 1).length;
    const fp = predicted.filter((p, i) => p === 1 && actual[i] === 0).length;
    return tp + fp > 0 ? tp / (tp + fp) : 0;
  }

  /**
   * Recall (positive class).
   */
  recall(predicted: number[], actual: number[]): number {
    const tp = predicted.filter((p, i) => p === 1 && actual[i] === 1).length;
    const fn = predicted.filter((p, i) => p === 0 && actual[i] === 1).length;
    return tp + fn > 0 ? tp / (tp + fn) : 0;
  }

  /**
   * AUC-ROC (trapezoidal approximation).
   */
  aucRoc(scores: number[], labels: number[]): number {
    // Sort by score descending
    const sorted = scores
      .map((s, i) => ({ score: s, label: labels[i] }))
      .sort((a, b) => b.score - a.score);

    const totalPositive = labels.filter(l => l === 1).length;
    const totalNegative = labels.length - totalPositive;

    if (totalPositive === 0 || totalNegative === 0) return 0.5;

    let tpCount = 0;
    let fpCount = 0;
    let auc = 0;
    let prevFPR = 0;

    for (const item of sorted) {
      if (item.label === 1) {
        tpCount++;
      } else {
        fpCount++;
        const tpr = tpCount / totalPositive;
        const fpr = fpCount / totalNegative;
        auc += tpr * (fpr - prevFPR); // trapezoidal
        prevFPR = fpr;
      }
    }

    return auc;
  }

  // ---------------------------------------------------------------------------
  // Comprehensive Evaluation
  // ---------------------------------------------------------------------------

  /**
   * Run full ranking evaluation.
   */
  evaluateRanking(queries: RankingEvalInput[], kValues: number[] = [1, 3, 5, 10]): EvaluationReport {
    logger.info(`[MLEvaluation] Evaluating ranking with ${queries.length} queries`);

    const precisionAtKMap: Record<number, number> = {};
    const recallAtKMap: Record<number, number> = {};

    for (const k of kValues) {
      const precisions = queries.map(q => this.precisionAtK(q.predicted, q.relevant, k));
      precisionAtKMap[k] = precisions.reduce((a, b) => a + b, 0) / (precisions.length || 1);

      const recalls = queries.map(q => this.recallAtK(q.predicted, q.relevant, k));
      recallAtKMap[k] = recalls.reduce((a, b) => a + b, 0) / (recalls.length || 1);
    }

    const ndcgValues = queries.map(q => this.ndcgAtK(q.predicted, q.relevant, 10));
    const ndcg = ndcgValues.reduce((a, b) => a + b, 0) / (ndcgValues.length || 1);

    const metrics: EvaluationMetrics = {
      ndcg,
      mrr: this.mrr(queries),
      precisionAtK: precisionAtKMap,
      recallAtK: recallAtKMap,
    };

    return {
      metrics,
      perQueryMetrics: queries.map((q, i) => ({
        queryId: `query_${i}`,
        metrics: {
          ndcg: ndcgValues[i],
          precisionAtK: Object.fromEntries(kValues.map(k => [k, this.precisionAtK(q.predicted, q.relevant, k)])),
          recallAtK: Object.fromEntries(kValues.map(k => [k, this.recallAtK(q.predicted, q.relevant, k)])),
        },
      })),
      summary: `NDCG@10=${ndcg.toFixed(4)}, MRR=${metrics.mrr!.toFixed(4)}, P@5=${precisionAtKMap[5]?.toFixed(4) ?? 'N/A'}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Run full classification evaluation.
   */
  evaluateClassification(input: ClassificationEvalInput): EvaluationReport {
    logger.info(`[MLEvaluation] Evaluating classification with ${input.predicted.length} samples`);

    const metrics: EvaluationMetrics = {
      f1: this.f1Score(input.predicted, input.actual),
      accuracy: this.accuracy(input.predicted, input.actual),
    };

    return {
      metrics,
      summary: `F1=${metrics.f1!.toFixed(4)}, Accuracy=${metrics.accuracy!.toFixed(4)}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if metrics meet minimum thresholds for deployment.
   */
  meetsDeploymentThresholds(
    metrics: EvaluationMetrics,
    thresholds: Partial<EvaluationMetrics>,
  ): { passes: boolean; failures: string[] } {
    const failures: string[] = [];

    for (const [key, threshold] of Object.entries(thresholds)) {
      const actual = (metrics as Record<string, unknown>)[key];
      if (typeof actual === 'number' && typeof threshold === 'number') {
        if (key === 'logloss' || key === 'mae' || key === 'rmse') {
          if (actual > threshold) failures.push(`${key}: ${actual.toFixed(4)} > ${threshold} (threshold)`);
        } else {
          if (actual < threshold) failures.push(`${key}: ${actual.toFixed(4)} < ${threshold} (threshold)`);
        }
      }
    }

    return { passes: failures.length === 0, failures };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private dcgAtK(predicted: string[], relevant: Set<string>, k: number): number {
    let dcg = 0;
    const topK = predicted.slice(0, k);
    for (let i = 0; i < topK.length; i++) {
      const rel = relevant.has(topK[i]) ? 1 : 0;
      dcg += rel / Math.log2(i + 2);
    }
    return dcg;
  }

  private dcgFromRelevance(relevance: number[], k: number): number {
    let dcg = 0;
    for (let i = 0; i < Math.min(k, relevance.length); i++) {
      dcg += relevance[i] / Math.log2(i + 2);
    }
    return dcg;
  }
}
