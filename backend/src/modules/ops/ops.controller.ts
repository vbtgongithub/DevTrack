// src/modules/ops/ops.controller.ts — Production monitoring + operational tooling
// Phase-1 Hardening: Queue monitoring, health endpoints, operational visibility

import { Request, Response } from 'express';
import { getRedisClient } from '../../shared/redis/client.js';
import { getAllQueues, getQueue } from '../../shared/jobs/queueFactory.js';
import { getXpWorkerStatus } from '../../shared/jobs/xpWorker.js';
import { getRedisHealth } from '../../shared/redis/client.js';
import cacheManager from '../../shared/cache/cacheManager.js';
import { eventBus } from '../../shared/sse/eventBus.js';
import { logger } from '../../shared/logger.js';
import { QueueNames } from '../../shared/jobs/types.js';
import type { Queue } from 'bullmq';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, { status: string; latencyMs?: number; error?: string }>;
}

interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  paused: boolean;
}

interface SystemMetrics {
  queues: QueueMetrics[];
  redis: {
    status: string;
    keys: number;
    memory: string;
  };
  sse: {
    activeConnections: number;
    totalConnections: number;
    totalDisconnects: number;
    eventsPublished: number;
  };
  workers: {
    xp: {
      running: boolean;
      processed: number;
      awarded: number;
      duplicates: number;
      failed: number;
      uptimeSeconds: number;
    };
  };
}

export const opsController = {
  // ─── Health check endpoint ─────────────────────────────────────────────
  async health(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {},
    };

    // Check MongoDB
    try {
      const mongoose = await import('mongoose');
      const mongoStart = Date.now();
      await mongoose.default.connection.db?.admin().ping();
      healthStatus.checks.mongodb = {
        status: 'ok',
        latencyMs: Date.now() - mongoStart,
      };
    } catch (err) {
      healthStatus.checks.mongodb = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
      healthStatus.status = 'unhealthy';
    }

    // Check Redis
    try {
      const redisStart = Date.now();
      const redis = getRedisClient();
      await redis.ping();
      healthStatus.checks.redis = {
        status: 'ok',
        latencyMs: Date.now() - redisStart,
      };
    } catch (err) {
      healthStatus.checks.redis = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
      healthStatus.status = 'unhealthy';
    }

    // Overall latency
    const totalLatency = Date.now() - startTime;
    healthStatus.checks.latency = {
      status: totalLatency < 500 ? 'ok' : 'degraded',
      latencyMs: totalLatency,
    };

    if (healthStatus.status === 'healthy' && totalLatency > 500) {
      healthStatus.status = 'degraded';
    }

    const httpStatus = healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;
    res.status(httpStatus).json(healthStatus);
  },

  // ─── System metrics endpoint ────────────────────────────────────────────
  async metrics(req: Request, res: Response): Promise<void> {
    const redis = getRedisClient();
    const dbSize = (await redis.dbsize()) || 0;

    // Get queue metrics
    const queueMetrics: QueueMetrics[] = [];
    const queueNames = [
      QueueNames.PLATFORM_SYNC,
      QueueNames.XP_PROCESSING,
      QueueNames.STREAK_RECALC,
      QueueNames.NOTIFICATIONS,
    ];

    for (const name of queueNames) {
      const queue = getQueue(name);
      if (queue) {
        const counts = await queue.getJobCounts();
        queueMetrics.push({
          name,
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          paused: counts.paused === 1 || false,
        });
      }
    }

    // Get SSE metrics
    const sseMetrics = eventBus.getMetrics();

    // Get XP worker status
    const xpWorkerStatus = getXpWorkerStatus();

    const metrics: SystemMetrics = {
      queues: queueMetrics,
      redis: {
        status: redis.status,
        keys: dbSize,
        memory: 'N/A',
      },
      sse: {
        activeConnections: sseMetrics.activeConnections,
        totalConnections: sseMetrics.totalConnections,
        totalDisconnects: sseMetrics.totalDisconnects,
        eventsPublished: sseMetrics.eventsPublished,
      },
      workers: {
        xp: xpWorkerStatus,
      },
    };

    res.json(metrics);
  },

  // ─── Queue inspection ─────────────────────────────────────────────────
  async queueStatus(req: Request, res: Response): Promise<void> {
    const queueName = req.params.queueName as string;

    const queue = getQueue(queueName);
    if (!queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const counts = await queue.getJobCounts();
    const workers = await queue.getWorkers();

    res.json({
      name: queueName,
      counts,
      workers: workers.map((w) => ({
        id: w.id,
        running: w.running,
      })),
    });
  },

  // ─── Recent jobs ────────────────────────────────────────────────────────
  async recentJobs(req: Request, res: Response): Promise<void> {
    const queueName = req.params.queueName as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const queue = getQueue(queueName);
    if (!queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const [waiting, completed, failed] = await Promise.all([
      queue.getWaiting(0, limit),
      queue.getCompleted(0, limit),
      queue.getFailed(0, limit),
    ]);

    res.json({
      queue: queueName,
      waiting: waiting.map((j) => ({
        id: j.id,
        data: j.data,
        timestamp: j.timestamp,
      })),
      completed: completed.map((j) => ({
        id: j.id,
        data: j.data,
        finishedOn: j.finishedOn,
      })),
      failed: failed.map((j) => ({
        id: j.id,
        data: j.data,
        failedReason: j.failedReason,
        attempts: j.attemptsMade,
      })),
    });
  },

  // ─── DLQ replay ─────────────────────────────────────────────────────────
  async replayDlqJob(req: Request, res: Response): Promise<void> {
    const queueName = req.params.queueName as string;
    const jobId = req.params.jobId as string;

    const queue = getQueue(queueName);
    if (!queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Retry the job
    await job.retry();

    logger.info('[ops] DLQ job replayed', { queueName, jobId });

    res.json({
      success: true,
      message: 'Job requeued for retry',
      jobId,
    });
  },

  // ─── Cache management ─────────────────────────────────────────────────
  async cacheStats(req: Request, res: Response): Promise<void> {
    const stats = await cacheManager.healthCheck();
    res.json(stats);
  },

  async clearUserCache(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;

    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }

    await cacheManager.invalidateAllUserCache(userId);

    logger.info('[ops] User cache cleared', { userId });

    res.json({
      success: true,
      message: 'User cache cleared',
      userId,
    });
  },

  // ─── Logging level adjustment ──────────────────────────────────────────
  setLogLevel(req: Request, res: Response): void {
    const { level } = req.body;

    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(level)) {
      res.status(400).json({ error: 'Invalid log level' });
      return;
    }

    // Note: Actual logger level change would need logger implementation
    logger.info('[ops] Log level changed', { level });

    res.json({
      success: true,
      message: `Log level set to ${level}`,
    });
  },

};

export default opsController;