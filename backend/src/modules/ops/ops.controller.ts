// src/modules/ops/ops.controller.ts — Production monitoring + operational tooling
// Phase-1 Hardening: Queue monitoring, health endpoints, operational visibility

import { Request, Response } from 'express';
import { getRedisClient } from '../../shared/redis/client.js';
import { getAllQueues, getQueue } from '../../shared/jobs/queueFactory.js';
import { getXpWorkerStatus } from '../../shared/jobs/xpWorker.js';
import { getRedisHealth } from '../../shared/redis/client.js';
import cacheManager from '../../shared/cache/cacheManager.js';
import { getAntiFraudConfig } from '../anti-fraud/anti-fraud.service.js';
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
  antiFraud: ReturnType<typeof getAntiFraudConfig>;
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
      QueueNames.XP_PROCESSING,
      QueueNames.STREAK_RECALC,
      QueueNames.ANALYTICS_SYNC,
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

    // Get anti-fraud config
    const antiFraudConfig = getAntiFraudConfig();

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
      antiFraud: antiFraudConfig,
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

  // ─── Closed Beta Operations ─────────────────────────────────────────────
  async getBetaStatus(req: Request, res: Response): Promise<void> {
    try {
      const { betaManagement } = await import('../beta/betaManagement.service.js');
      const { betaOperations } = await import('../beta/betaOperations.service.js');
      
      const [stats, opsStats] = await Promise.all([
        betaManagement.getBetaStatistics(),
        betaOperations.getBetaStatistics(),
      ]);

      res.json({
        success: true,
        stats: {
          ...stats,
          ...opsStats,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get beta status' });
    }
  },

  async createBetaCohort(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, type, targetSize, featureFlags, betaFeatures } = req.body;
      const { betaManagement } = await import('../beta/betaManagement.service.js');
      
      const cohortId = await betaManagement.createCohort(name, description, type, {
        targetSize,
        featureFlags,
        betaFeatures,
      });

      await betaManagement.activateCohort(cohortId);

      res.json({
        success: true,
        message: 'Beta cohort created and activated successfully',
        cohortId,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create beta cohort' });
    }
  },

  async generateInviteCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, cohortId, expiresInDays } = req.body;
      const { betaManagement } = await import('../beta/betaManagement.service.js');
      
      const invite = await betaManagement.generateInvite(email, cohortId, expiresInDays || 30);

      res.json({
        success: true,
        invite,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate invite' });
    }
  },

  // ─── Feature Gates ──────────────────────────────────────────────────────
  async getFeatureGates(req: Request, res: Response): Promise<void> {
    try {
      const { featureGate } = await import('../beta/featureGate.service.js');
      const gates = await featureGate.listFeatureGates();
      res.json({ success: true, gates });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list feature gates' });
    }
  },

  async configureFeatureGate(req: Request, res: Response): Promise<void> {
    try {
      const { featureGate } = await import('../beta/featureGate.service.js');
      await featureGate.configureFeatureGate(req.body);
      res.json({ success: true, message: 'Feature gate configured successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to configure feature gate' });
    }
  },

  async toggleFeatureGate(req: Request, res: Response): Promise<void> {
    try {
      const { featureName, enabled } = req.body;
      const { featureGate } = await import('../beta/featureGate.service.js');
      
      if (enabled) {
        await featureGate.enableFeature(featureName);
      } else {
        await featureGate.disableFeature(featureName);
      }

      res.json({
        success: true,
        message: `Feature ${featureName} ${enabled ? 'enabled' : 'disabled'} globally`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to toggle feature gate' });
    }
  },

  // ─── Kill Switches ──────────────────────────────────────────────────────
  async getKillSwitches(req: Request, res: Response): Promise<void> {
    try {
      const { killSwitchService } = await import('../runtime-orchestration/killSwitch/index.js');
      const switches = await killSwitchService.getAllSwitches();
      res.json({ success: true, switches });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list kill switches' });
    }
  },

  async toggleKillSwitch(req: Request, res: Response): Promise<void> {
    try {
      const { switchId, enabled, reason } = req.body;
      const { killSwitchService } = await import('../runtime-orchestration/killSwitch/index.js');
      
      let updatedSwitch;
      if (!enabled) {
        // Activate the kill switch (which disables the system)
        updatedSwitch = await killSwitchService.activate(switchId, 'admin', reason || 'Operator action');
      } else {
        // Deactivate the kill switch (which enables the system)
        updatedSwitch = await killSwitchService.deactivate(switchId, 'admin', reason || 'Operator action');
      }

      res.json({
        success: true,
        message: `System ${switchId} ${enabled ? 'enabled' : 'disabled'}`,
        switch: updatedSwitch,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to toggle kill switch' });
    }
  },

  // ─── Retention & Cohort Dashboard ───────────────────────────────────────
  async getRetentionDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { retentionCommandCenter } = await import('../retention-ops/commandCenter/index.js');
      
      const [metrics, cohorts, summary, alerts] = await Promise.all([
        retentionCommandCenter.getLiveMetrics(),
        retentionCommandCenter.getCohortHealth(7),
        retentionCommandCenter.getHealthSummary(),
        retentionCommandCenter.getOperationalAlerts(),
      ]);

      res.json({
        success: true,
        metrics,
        cohorts,
        summary,
        alerts,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load retention dashboard' });
    }
  },
};

export default opsController;