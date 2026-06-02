// src/modules/ml/serving/ModelInferenceGateway.ts
// Unified entry point for all ML inference requests.
// Routes to correct model, handles caching, failover.

import { logger } from '../../../shared/logger.js';
import type { InferenceRequest, InferenceResult, MLPrediction, InferenceMetrics } from '../types.js';
import { generateRequestId } from '../types.js';
import { MLServingInfrastructure } from './MLServingInfrastructure.js';

/**
 * ModelInferenceGateway
 *
 * Unified entry point for all ML inference.
 * Features:
 * - Request routing to correct model
 * - Inference result caching
 * - Failover to deterministic fallback
 * - Latency tracking
 * - Request deduplication
 */
export class ModelInferenceGateway {
  private serving: MLServingInfrastructure;
  private cache: Map<string, { result: InferenceResult; timestamp: number }> = new Map();
  private cacheTTLMs: number = 60_000;
  private maxCacheSize: number = 1000;

  // Metrics
  private totalRequests: number = 0;
  private cacheHits: number = 0;
  private totalLatencyMs: number = 0;
  private errors: number = 0;
  private latencies: number[] = [];

  // Inference handlers
  private handlers: Map<string, (request: InferenceRequest) => Promise<InferenceResult>> = new Map();

  constructor(serving: MLServingInfrastructure) {
    this.serving = serving;
    logger.info('[ModelInferenceGateway] Initialized');
  }

  /**
   * Register an inference handler for a model.
   */
  registerHandler(modelId: string, handler: (request: InferenceRequest) => Promise<InferenceResult>): void {
    this.handlers.set(modelId, handler);
    logger.info(`[ModelInferenceGateway] Registered handler for ${modelId}`);
  }

  /**
   * Execute an inference request.
   */
  async infer(request: InferenceRequest): Promise<InferenceResult> {
    const start = Date.now();
    this.totalRequests++;

    // Check cache
    if (request.options?.useCache !== false) {
      const cached = this.checkCache(request);
      if (cached) {
        this.cacheHits++;
        logger.debug(`[ModelInferenceGateway] Cache hit for ${request.modelId}`);
        return { ...cached, cached: true };
      }
    }

    // Check model readiness
    if (!this.serving.isModelReady(request.modelId)) {
      logger.warn(`[ModelInferenceGateway] Model ${request.modelId} not ready, using fallback`);
      return this.deterministicFallback(request, start);
    }

    // Get handler
    const handler = this.handlers.get(request.modelId);
    if (!handler) {
      logger.warn(`[ModelInferenceGateway] No handler for ${request.modelId}, using fallback`);
      return this.deterministicFallback(request, start);
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(handler, request, request.timeout);

      // Record success
      this.serving.recordInference(request.modelId, true);
      const latencyMs = Date.now() - start;
      this.totalLatencyMs += latencyMs;
      this.latencies.push(latencyMs);
      if (this.latencies.length > 1000) this.latencies.shift();

      // Cache result
      this.cacheResult(request, result);

      return result;
    } catch (error) {
      this.errors++;
      this.serving.recordInference(request.modelId, false);
      logger.error(`[ModelInferenceGateway] Inference failed for ${request.modelId}`, error);
      return this.deterministicFallback(request, start);
    }
  }

  /**
   * Get gateway metrics.
   */
  getMetrics(): InferenceMetrics {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p = (pct: number) => sorted[Math.floor(sorted.length * pct / 100)] ?? 0;
    const elapsed = Math.max(1, (Date.now() - (this.latencies[0] ?? Date.now())) / 1000);

    return {
      totalRequests: this.totalRequests,
      averageLatencyMs: this.totalRequests > 0 ? this.totalLatencyMs / this.totalRequests : 0,
      p50LatencyMs: p(50),
      p95LatencyMs: p(95),
      p99LatencyMs: p(99),
      throughputRps: this.totalRequests / elapsed,
      cacheHitRate: this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0,
      errorRate: this.totalRequests > 0 ? this.errors / this.totalRequests : 0,
      queueDepth: 0,
      activeModels: this.handlers.size,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private checkCache(request: InferenceRequest): InferenceResult | null {
    const key = this.cacheKey(request);
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.cacheTTLMs) {
      return entry.result;
    }
    if (entry) this.cache.delete(key);
    return null;
  }

  private cacheResult(request: InferenceRequest, result: InferenceResult): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Evict oldest
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    const key = this.cacheKey(request);
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  private cacheKey(request: InferenceRequest): string {
    return `${request.modelId}:${JSON.stringify(request.input)}`;
  }

  private async executeWithTimeout(
    handler: (request: InferenceRequest) => Promise<InferenceResult>,
    request: InferenceRequest,
    timeoutMs: number,
  ): Promise<InferenceResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Inference timeout after ${timeoutMs}ms`)), timeoutMs);
      handler(request)
        .then(result => { clearTimeout(timer); resolve(result); })
        .catch(err => { clearTimeout(timer); reject(err); });
    });
  }

  private deterministicFallback(request: InferenceRequest, startTime: number): InferenceResult {
    logger.info(`[ModelInferenceGateway] Deterministic fallback for ${request.modelId}`);
    return {
      requestId: request.requestId,
      modelId: request.modelId,
      prediction: {
        score: 0.5,
        confidence: 0.3, // Low confidence for fallback
        uncertainty: 0.7,
        semanticCertainty: 0.2,
        evidenceCoverage: 0.1,
        retrievalStability: 0.5,
        featureImportance: [],
        modelId: `${request.modelId}-fallback`,
        modelVersion: 'deterministic',
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      } as MLPrediction,
      cached: false,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}
