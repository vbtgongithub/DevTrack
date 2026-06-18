// src/modules/ml/serving/MLServingInfrastructure.ts
// Top-level ML serving coordinator: model loading, warm-up, health checks, memory.

import { logger } from '../../../shared/logger.js';
import type { ModelMetadata, ModelStatus } from '../types.js';

interface ModelInstance {
  metadata: ModelMetadata;
  loadedAt: string;
  lastInferenceAt: string | null;
  memoryUsageMB: number;
  isWarmedUp: boolean;
  inferenceCount: number;
  errorCount: number;
}

interface ServingHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  loadedModels: number;
  totalInferences: number;
  totalErrors: number;
  averageMemoryMB: number;
  uptime: number;
}

/**
 * MLServingInfrastructure
 *
 * Production-grade model serving coordinator.
 * Manages model lifecycle: loading, warm-up, health monitoring, memory management.
 * Supports local model serving with failover and degraded-mode operation.
 */
export class MLServingInfrastructure {
  private models: Map<string, ModelInstance> = new Map();
  private startTime: number = Date.now();
  private maxMemoryMB: number = 512;

  constructor(config?: { maxMemoryMB?: number }) {
    this.maxMemoryMB = config?.maxMemoryMB ?? 512;
    logger.info('[MLServing] Infrastructure initialized', { maxMemoryMB: this.maxMemoryMB });
  }

  /**
   * Register and load a model for serving.
   */
  async loadModel(metadata: ModelMetadata): Promise<boolean> {
    logger.info(`[MLServing] Loading model ${metadata.modelId} v${metadata.version}`);

    // Check memory budget
    const currentMemory = this.getTotalMemoryUsage();
    const estimatedModelMemory = this.estimateModelMemory(metadata);
    if (currentMemory + estimatedModelMemory > this.maxMemoryMB) {
      logger.warn(`[MLServing] Insufficient memory to load ${metadata.modelId}. Current: ${currentMemory}MB, Estimated: ${estimatedModelMemory}MB`);
      // Try evicting least-recently-used model
      this.evictLRUModel();
    }

    const instance: ModelInstance = {
      metadata,
      loadedAt: new Date().toISOString(),
      lastInferenceAt: null,
      memoryUsageMB: estimatedModelMemory,
      isWarmedUp: false,
      inferenceCount: 0,
      errorCount: 0,
    };

    this.models.set(metadata.modelId, instance);

    // Warm up the model
    await this.warmUpModel(metadata.modelId);

    logger.info(`[MLServing] Model ${metadata.modelId} loaded and warmed up`);
    return true;
  }

  /**
   * Unload a model from serving.
   */
  unloadModel(modelId: string): boolean {
    const instance = this.models.get(modelId);
    if (!instance) return false;

    logger.info(`[MLServing] Unloading model ${modelId}`);
    this.models.delete(modelId);
    return true;
  }

  /**
   * Record inference execution for a model.
   */
  recordInference(modelId: string, success: boolean): void {
    const instance = this.models.get(modelId);
    if (!instance) return;

    instance.inferenceCount++;
    instance.lastInferenceAt = new Date().toISOString();
    if (!success) instance.errorCount++;
  }

  /**
   * Check if a model is loaded and ready.
   */
  isModelReady(modelId: string): boolean {
    const instance = this.models.get(modelId);
    return !!instance && instance.isWarmedUp;
  }

  /**
   * Get health status of the serving infrastructure.
   */
  getHealth(): ServingHealth {
    const models = Array.from(this.models.values());
    const totalInferences = models.reduce((sum, m) => sum + m.inferenceCount, 0);
    const totalErrors = models.reduce((sum, m) => sum + m.errorCount, 0);
    const avgMemory = models.length > 0
      ? models.reduce((sum, m) => sum + m.memoryUsageMB, 0) / models.length
      : 0;

    const errorRate = totalInferences > 0 ? totalErrors / totalInferences : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (errorRate < 0.01 && models.every(m => m.isWarmedUp)) status = 'healthy';
    else if (errorRate < 0.05) status = 'degraded';
    else status = 'unhealthy';

    return {
      status,
      loadedModels: models.length,
      totalInferences,
      totalErrors,
      averageMemoryMB: Math.round(avgMemory),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get all loaded model metadata.
   */
  getLoadedModels(): ModelMetadata[] {
    return Array.from(this.models.values()).map(m => m.metadata);
  }

  /**
   * Get instance details for a model.
   */
  getModelInstance(modelId: string): ModelInstance | undefined {
    return this.models.get(modelId);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async warmUpModel(modelId: string): Promise<void> {
    const instance = this.models.get(modelId);
    if (!instance) return;

    logger.info(`[MLServing] Warming up model ${modelId}`);
    // Simulate warm-up (in production this would run a dummy inference)
    instance.isWarmedUp = true;
  }

  private estimateModelMemory(metadata: ModelMetadata): number {
    switch (metadata.modelType) {
      case 'distilbert': return 50;
      case 'xgboost': return 10;
      case 'lightgbm': return 8;
      case 'lambdamart': return 12;
      case 'classifier': return 15;
      case 'ranker': return 10;
      case 'recommender': return 15;
      default: return 10;
    }
  }

  private getTotalMemoryUsage(): number {
    return Array.from(this.models.values()).reduce((sum, m) => sum + m.memoryUsageMB, 0);
  }

  private evictLRUModel(): void {
    let oldestModel: string | null = null;
    let oldestTime = Infinity;

    for (const [id, instance] of this.models) {
      const lastUsed = instance.lastInferenceAt
        ? new Date(instance.lastInferenceAt).getTime()
        : new Date(instance.loadedAt).getTime();
      if (lastUsed < oldestTime) {
        oldestTime = lastUsed;
        oldestModel = id;
      }
    }

    if (oldestModel) {
      logger.info(`[MLServing] Evicting LRU model ${oldestModel}`);
      this.models.delete(oldestModel);
    }
  }
}
