// src/shared/runtime/workerLifecycle.ts — Deployment Safety + Worker Orchestration
// Phase-B: Graceful draining, rolling deployment, worker heartbeat

import { Worker } from 'bullmq';
import { getRedisClient } from '../redis/client.js';
import { logger } from '../logger.js';
import { QueueNames } from '../jobs/types.js';

export interface WorkerHealth {
  workerId: string;
  queueName: string;
  status: 'starting' | 'running' | 'draining' | 'stopping' | 'stopped';
  startedAt: number;
  jobsProcessed: number;
  jobsFailed: number;
  lastHeartbeat: number;
  currentJobId: string | null;
  concurrency: number;
}

export interface DrainingProgress {
  workerId: string;
  activeJobs: number;
  maxDrainTimeMs: number;
  startedAt: number;
  estimatedRemaining: number;
}

// Worker registry for lifecycle management
class WorkerRegistry {
  private workers = new Map<string, WorkerHealth>();
  private drainingWorkers = new Map<string, DrainingProgress>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private gracefulShutdownTimeout = 30000; // 30 seconds

  // Register a worker
  register(workerId: string, queueName: string, concurrency: number): void {
    this.workers.set(workerId, {
      workerId,
      queueName,
      status: 'starting',
      startedAt: Date.now(),
      jobsProcessed: 0,
      jobsFailed: 0,
      lastHeartbeat: Date.now(),
      currentJobId: null,
      concurrency,
    });

    logger.info('[lifecycle] Worker registered', { workerId, queueName });
  }

  // Update worker status
  updateStatus(workerId: string, status: WorkerHealth['status']): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = status;
    }
  }

  // Update job progress
  setCurrentJob(workerId: string, jobId: string | null): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.currentJobId = jobId;
      worker.lastHeartbeat = Date.now();
    }
  }

  // Increment job counters
  incrementProcessed(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.jobsProcessed++;
    }
  }

  incrementFailed(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.jobsFailed++;
    }
  }

  // Start heartbeat monitoring
  startHeartbeat(intervalMs = 10000): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.checkWorkerHealth();
    }, intervalMs);

    logger.info('[lifecycle] Heartbeat monitoring started', { intervalMs });
  }

  // Check worker health
  private checkWorkerHealth(): void {
    const now = Date.now();

    for (const [workerId, worker] of this.workers) {
      // Check for stale heartbeat
      if (now - worker.lastHeartbeat > 60000) {
        logger.warn('[lifecycle] Worker stale heartbeat', { workerId, lastHeartbeat: worker.lastHeartbeat });
      }

      // Check for stuck jobs (running for > 5 minutes without heartbeat update)
      if (worker.status === 'running' && worker.currentJobId) {
        // Could implement job timeout detection here
      }
    }
  }

  // Initiate graceful draining
  async initiateDrain(workerId: string): Promise<DrainingProgress> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    worker.status = 'draining';

    // Get active job count (would need to query BullMQ for actual count)
    const activeJobs = worker.concurrency; // Simplified

    const progress: DrainingProgress = {
      workerId,
      activeJobs,
      maxDrainTimeMs: this.gracefulShutdownTimeout,
      startedAt: Date.now(),
      estimatedRemaining: activeJobs * 30000, // Estimate 30s per job
    };

    this.drainingWorkers.set(workerId, progress);

    logger.info('[lifecycle] Worker draining initiated', { workerId, activeJobs });

    return progress;
  }

  // Check drain progress
  checkDrainProgress(workerId: string): DrainingProgress | null {
    return this.drainingWorkers.get(workerId) || null;
  }

  // Complete drain
  async completeDrain(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = 'stopped';
    }
    this.drainingWorkers.delete(workerId);

    logger.info('[lifecycle] Worker drain completed', { workerId });
  }

  // Get all worker status
  getAllWorkers(): WorkerHealth[] {
    return Array.from(this.workers.values());
  }

  // Stop all workers gracefully (for shutdown)
  async gracefulShutdown(maxWaitMs = 60000): Promise<void> {
    const startTime = Date.now();

    // Mark all workers as draining
    for (const worker of this.workers.values()) {
      worker.status = 'draining';
    }

    // Wait for all to complete or timeout
    while (this.drainingWorkers.size > 0 && Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if any workers finished draining
      for (const [workerId] of this.drainingWorkers) {
        const worker = this.workers.get(workerId);
        if (worker?.status === 'stopped') {
          this.drainingWorkers.delete(workerId);
        }
      }
    }

    // Force stop remaining
    for (const worker of this.workers.values()) {
      worker.status = 'stopping';
    }

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    logger.info('[lifecycle] Graceful shutdown completed');
  }

  // Deployment-safe queue pause
  async pauseQueueForDeploy(queueName: string): Promise<void> {
    const { getQueue } = await import('../jobs/queueFactory.js');
    const queue = getQueue(queueName);

    if (queue) {
      await queue.pause();
      logger.info('[lifecycle] Queue paused for deploy', { queueName });
    }
  }

  // Resume queue after deploy
  async resumeQueueAfterDeploy(queueName: string): Promise<void> {
    const { getQueue } = await import('../jobs/queueFactory.js');
    const queue = getQueue(queueName);

    if (queue) {
      await queue.resume();
      logger.info('[lifecycle] Queue resumed after deploy', { queueName });
    }
  }
}

// Singleton instance
export const workerRegistry = new WorkerRegistry();

// Worker lifecycle hooks for BullMQ workers
export function createWorkerLifecycleHooks(
  workerId: string,
  queueName: string,
  worker: Worker
) {
  workerRegistry.register(workerId, queueName, worker.opts.concurrency || 1);

  return {
    onJobStart: (jobId: string) => {
      workerRegistry.setCurrentJob(workerId, jobId);
    },
    onJobComplete: () => {
      workerRegistry.setCurrentJob(workerId, null);
      workerRegistry.incrementProcessed(workerId);
    },
    onJobFailed: () => {
      workerRegistry.setCurrentJob(workerId, null);
      workerRegistry.incrementFailed(workerId);
    },
    onWorkerDrain: async () => {
      await workerRegistry.completeDrain(workerId);
    },
  };
}

// SSE connection lifecycle for deployment safety
export function createSseLifecycleManager() {
  const activeConnections = new Map<string, { connectedAt: number; lastActivity: number }>();

  return {
    registerConnection(connectionId: string): void {
      activeConnections.set(connectionId, {
        connectedAt: Date.now(),
        lastActivity: Date.now(),
      });
    },

    unregisterConnection(connectionId: string): void {
      activeConnections.delete(connectionId);
    },

    updateActivity(connectionId: string): void {
      const conn = activeConnections.get(connectionId);
      if (conn) {
        conn.lastActivity = Date.now();
      }
    },

    getActiveCount(): number {
      return activeConnections.size;
    },

    // Get connections for graceful drain
    async drainConnections(maxWaitMs = 30000): Promise<void> {
      const startTime = Date.now();

      while (activeConnections.size > 0 && Date.now() - startTime < maxWaitMs) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      logger.info('[lifecycle] SSE connections drained', {
        remaining: activeConnections.size,
      });
    },

    // Prevent new connections during deploy (optional)
    isAcceptingConnections(): boolean {
      // Could add a deployment flag here
      return true;
    },
  };
}

export default workerRegistry;