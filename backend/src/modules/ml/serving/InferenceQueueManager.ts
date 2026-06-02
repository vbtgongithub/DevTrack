// src/modules/ml/serving/InferenceQueueManager.ts
// Priority queue for inference requests with batching, timeout, backpressure.

import { logger } from '../../../shared/logger.js';
import type { InferenceRequest, InferenceResult, InferencePriority } from '../types.js';

interface QueuedRequest {
  request: InferenceRequest;
  resolve: (result: InferenceResult) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
  priority: number;
}

/**
 * InferenceQueueManager
 *
 * Priority queue for ML inference with:
 * - Priority-based scheduling (critical > high > normal > low)
 * - Request batching for throughput optimization
 * - Timeout enforcement
 * - Backpressure when queue depth exceeds threshold
 * - FIFO within same priority level
 */
export class InferenceQueueManager {
  private queue: QueuedRequest[] = [];
  private processing: boolean = false;
  private maxQueueDepth: number;
  private batchSize: number;
  private processInterval: number;
  private processor: ((requests: InferenceRequest[]) => Promise<InferenceResult[]>) | null = null;

  // Metrics
  private totalEnqueued: number = 0;
  private totalProcessed: number = 0;
  private totalDropped: number = 0;
  private totalTimeouts: number = 0;

  constructor(config?: {
    maxQueueDepth?: number;
    batchSize?: number;
    processIntervalMs?: number;
  }) {
    this.maxQueueDepth = config?.maxQueueDepth ?? 100;
    this.batchSize = config?.batchSize ?? 8;
    this.processInterval = config?.processIntervalMs ?? 50;
    logger.info('[InferenceQueueManager] Initialized', {
      maxQueueDepth: this.maxQueueDepth,
      batchSize: this.batchSize,
    });
  }

  /**
   * Set the batch processor function.
   */
  setProcessor(processor: (requests: InferenceRequest[]) => Promise<InferenceResult[]>): void {
    this.processor = processor;
  }

  /**
   * Enqueue an inference request. Returns promise that resolves with result.
   */
  async enqueue(request: InferenceRequest): Promise<InferenceResult> {
    // Backpressure check
    if (this.queue.length >= this.maxQueueDepth) {
      this.totalDropped++;
      logger.warn(`[InferenceQueueManager] Queue full (${this.queue.length}), dropping request ${request.requestId}`);
      throw new Error('Inference queue full — backpressure applied');
    }

    this.totalEnqueued++;

    return new Promise<InferenceResult>((resolve, reject) => {
      const priorityValue = this.priorityToNumber(request.priority);

      this.queue.push({
        request,
        resolve,
        reject,
        enqueuedAt: Date.now(),
        priority: priorityValue,
      });

      // Sort by priority (higher = processed first), then by enqueue time (FIFO)
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.enqueuedAt - b.enqueuedAt;
      });

      // Set timeout
      setTimeout(() => {
        const idx = this.queue.findIndex(q => q.request.requestId === request.requestId);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          this.totalTimeouts++;
          reject(new Error(`Inference request ${request.requestId} timed out after ${request.timeout}ms`));
        }
      }, request.timeout);

      // Trigger processing
      this.triggerProcessing();
    });
  }

  /**
   * Get current queue depth.
   */
  getQueueDepth(): number {
    return this.queue.length;
  }

  /**
   * Get queue metrics.
   */
  getMetrics(): {
    queueDepth: number;
    totalEnqueued: number;
    totalProcessed: number;
    totalDropped: number;
    totalTimeouts: number;
  } {
    return {
      queueDepth: this.queue.length,
      totalEnqueued: this.totalEnqueued,
      totalProcessed: this.totalProcessed,
      totalDropped: this.totalDropped,
      totalTimeouts: this.totalTimeouts,
    };
  }

  /**
   * Drain the queue (for graceful shutdown).
   */
  async drain(): Promise<void> {
    logger.info('[InferenceQueueManager] Draining queue');
    while (this.queue.length > 0) {
      await this.processBatch();
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async triggerProcessing(): Promise<void> {
    if (this.processing) return;

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        await this.processBatch();
        if (this.queue.length > 0) {
          await this.sleep(this.processInterval);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async processBatch(): Promise<void> {
    if (!this.processor) {
      logger.warn('[InferenceQueueManager] No processor set, cannot process batch');
      return;
    }

    const batch = this.queue.splice(0, this.batchSize);
    if (batch.length === 0) return;

    try {
      const requests = batch.map(q => q.request);
      const results = await this.processor(requests);

      for (let i = 0; i < batch.length; i++) {
        this.totalProcessed++;
        if (results[i]) {
          batch[i].resolve(results[i]);
        } else {
          batch[i].reject(new Error('No result returned for request'));
        }
      }
    } catch (error) {
      // Fail all requests in the batch
      for (const item of batch) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private priorityToNumber(priority: InferencePriority): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
