// src/modules/runtime-orchestration/observability/runtimeObservability.service.ts — Runtime Observability Layer
// Phase-F: Orchestration-level visibility and operational metrics

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export interface OrchestrationMetric {
  timestamp: Date;
  latencyMs: number;
  stage: string;
  success: boolean;
  error?: string;
}

export interface SystemHealth {
  system: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: Record<string, number>;
}

export interface BehavioralFlow {
  eventId: string;
  userId: string;
  stages: Array<{ stage: string; latencyMs: number; timestamp: Date }>;
  totalLatencyMs: number;
}

const METRICS_KEY = 'observability:metrics';
const HEALTH_KEY = 'observability:health';
const FLOWS_KEY = 'observability:flows';

export const runtimeObservability = {
  // ─── Record orchestration metric ─────────────────────────────────────
  async recordMetric(
    stage: string,
    latencyMs: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    const redis = getRedisClient();
    const metric: OrchestrationMetric = {
      timestamp: new Date(),
      latencyMs,
      stage,
      success,
      error,
    };

    await redis.rpush(`${METRICS_KEY}:${stage}`, JSON.stringify(metric));
    await redis.expire(`${METRICS_KEY}:${stage}`, 3600);
  },

  // ─── Get orchestration metrics ───────────────────────────────────────
  async getOrchestrationMetrics(minutes: number = 10): Promise<{
    avgLatencyMs: number;
    successRate: number;
    stageBreakdown: Record<string, { avg: number; count: number; errorRate: number }>;
  }> {
    const redis = getRedisClient();
    const stages = ['xp_processing', 'goal_progression', 'challenge_evaluation', 'achievement_evaluation', 'retention_trigger', 'notification_arbitration', 'fatigue_suppression', 'sse_fanout', 'analytics_update'];

    const stageMetrics: Record<string, OrchestrationMetric[]> = {};
    const cutoff = Date.now() - minutes * 60 * 1000;

    for (const stage of stages) {
      const key = `${METRICS_KEY}:${stage}`;
      const data = await redis.lrange(key, -100, -1);
      stageMetrics[stage] = data
        .map(d => JSON.parse(d))
        .filter(m => new Date(m.timestamp).getTime() > cutoff);
    }

    let totalLatency = 0;
    let totalCount = 0;
    let successCount = 0;
    const stageBreakdown: Record<string, { avg: number; count: number; errorRate: number }> = {};

    for (const [stage, metrics] of Object.entries(stageMetrics)) {
      const stageLatency = metrics.reduce((sum, m) => sum + m.latencyMs, 0);
      const stageSuccess = metrics.filter(m => m.success).length;

      totalLatency += stageLatency;
      totalCount += metrics.length;
      successCount += stageSuccess;

      stageBreakdown[stage] = {
        avg: metrics.length > 0 ? Math.round(stageLatency / metrics.length) : 0,
        count: metrics.length,
        errorRate: metrics.length > 0 ? Math.round((1 - stageSuccess / metrics.length) * 100) : 0,
      };
    }

    return {
      avgLatencyMs: totalCount > 0 ? Math.round(totalLatency / totalCount) : 0,
      successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100,
      stageBreakdown,
    };
  },

  // ─── Record behavioral flow ───────────────────────────────────────────
  async recordFlow(flow: BehavioralFlow): Promise<void> {
    const redis = getRedisClient();
    await redis.rpush(FLOWS_KEY, JSON.stringify(flow));
    await redis.ltrim(FLOWS_KEY, -100, -1);
  },

  // ─── Get recent flows ─────────────────────────────────────────────────
  async getRecentFlows(limit: number = 20): Promise<BehavioralFlow[]> {
    const redis = getRedisClient();
    const flows = await redis.lrange(FLOWS_KEY, -limit, -1);

    return flows.map(f => JSON.parse(f)).reverse();
  },

  // ─── Get system health ───────────────────────────────────────────────
  async getSystemHealth(): Promise<SystemHealth[]> {
    const redis = getRedisClient();
    const cached = await redis.get(HEALTH_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    const systems: SystemHealth[] = [
      {
        system: 'orchestration',
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { active: 0, queued: 0, failed: 0 },
      },
      {
        system: 'queue',
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { pending: 0, processing: 0, completed: 0 },
      },
      {
        system: 'redis',
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { connected: 1, keys: 0, memory: 0 },
      },
      {
        system: 'database',
        status: 'healthy',
        lastCheck: new Date(),
        metrics: { connections: 0, queries: 0, latency: 0 },
      },
    ];

    await redis.set(HEALTH_KEY, JSON.stringify(systems), 'EX', 60);

    return systems;
  },

  // ─── Check suppression frequency ──────────────────────────────────────
  async getSuppressionFrequency(): Promise<{
    fatigueSuppression: number;
    prioritySuppression: number;
    killSwitchSuppression: number;
  }> {
    const redis = getRedisClient();
    
    // Get suppression counts from Redis hash
    const suppressionKey = 'observability:suppression';
    const [fatigueCount, priorityCount, killSwitchCount] = await Promise.all([
      redis.hget(suppressionKey, 'fatigue'),
      redis.hget(suppressionKey, 'priority'),
      redis.hget(suppressionKey, 'killSwitch'),
    ]);

    return {
      fatigueSuppression: fatigueCount ? parseInt(fatigueCount, 10) : 0,
      prioritySuppression: priorityCount ? parseInt(priorityCount, 10) : 0,
      killSwitchSuppression: killSwitchCount ? parseInt(killSwitchCount, 10) : 0,
    };
  },

  // ─── Get trigger conflict rate ───────────────────────────────────────
  async getTriggerConflictRate(): Promise<number> {
    const redis = getRedisClient();
    
    // Get conflict count from Redis hash
    const conflictKey = 'observability:conflicts';
    const conflictCount = await redis.hget(conflictKey, 'total');
    
    return conflictCount ? parseInt(conflictCount, 10) : 0;
  },

  // ─── Get activation level health ─────────────────────────────────────
  async getActivationLevelHealth(): Promise<Record<number, { users: number; avgEngagement: number }>> {
    const redis = getRedisClient();
    
    // Get activation level data from Redis hash
    const activationKey = 'observability:activation_levels';
    const levels = await redis.hgetall(activationKey);
    
    const result: Record<number, { users: number; avgEngagement: number }> = {};
    
    for (const [level, data] of Object.entries(levels)) {
      try {
        const parsed = JSON.parse(data);
        result[parseInt(level, 10)] = {
          users: parsed.users || 0,
          avgEngagement: parsed.avgEngagement || 0,
        };
      } catch (error) {
        logger.warn('[observability] Failed to parse activation level data', { level, data });
      }
    }
    
    // Return default values if no data exists
    if (Object.keys(result).length === 0) {
      return {
        0: { users: 0, avgEngagement: 0 },
        1: { users: 0, avgEngagement: 0 },
        2: { users: 0, avgEngagement: 0 },
        3: { users: 0, avgEngagement: 0 },
        4: { users: 0, avgEngagement: 0 },
      };
    }
    
    return result;
  },

  // ─── Get latency breakdown ───────────────────────────────────────────
  async getLatencyBreakdown(): Promise<{
    p50: number;
    p90: number;
    p99: number;
    avg: number;
  }> {
    const redis = getRedisClient();
    
    // Get latency metrics from Redis list
    const latencyKey = 'observability:latency';
    const latencyData = await redis.lrange(latencyKey, -100, -1);
    
    if (latencyData.length === 0) {
      return {
        p50: 0,
        p90: 0,
        p99: 0,
        avg: 0,
      };
    }
    
    // Parse and sort latencies
    const latencies = latencyData
      .map(d => parseFloat(d))
      .filter(l => !isNaN(l))
      .sort((a, b) => a - b);
    
    if (latencies.length === 0) {
      return {
        p50: 0,
        p90: 0,
        p99: 0,
        avg: 0,
      };
    }
    
    // Calculate percentiles
    const p50Index = Math.floor(latencies.length * 0.5);
    const p90Index = Math.floor(latencies.length * 0.9);
    const p99Index = Math.floor(latencies.length * 0.99);
    
    const avg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    
    return {
      p50: Math.round(latencies[p50Index]),
      p90: Math.round(latencies[p90Index]),
      p99: Math.round(latencies[p99Index]),
      avg: Math.round(avg),
    };
  },

  // ─── Get behavioral dashboard ────────────────────────────────────────
  async getBehavioralDashboard(): Promise<{
    orchestrationMetrics: {
      avgLatencyMs: number;
      successRate: number;
    };
    suppressionFrequency: {
      fatigueSuppression: number;
      prioritySuppression: number;
      killSwitchSuppression: number;
    };
    triggerConflictRate: number;
    systemHealth: SystemHealth[];
    recentFlows: BehavioralFlow[];
  }> {
    const [orchestrationMetrics, suppressionFrequency, triggerConflictRate, systemHealth, recentFlows] = await Promise.all([
      this.getOrchestrationMetrics(),
      this.getSuppressionFrequency(),
      this.getTriggerConflictRate(),
      this.getSystemHealth(),
      this.getRecentFlows(10),
    ]);

    return {
      orchestrationMetrics,
      suppressionFrequency,
      triggerConflictRate,
      systemHealth,
      recentFlows,
    };
  },

  // ─── Get debug info ─────────────────────────────────────────────────
  async getDebugInfo(userId: string): Promise<{
    activationLevel: number;
    trustScore: number;
    recentFlows: BehavioralFlow[];
    activeSwitches: string[];
    suppressionStatus: string;
  }> {
    const redis = getRedisClient();

    const [activationLevel, trustScore, flows, activeSwitches] = await Promise.all([
      redis.hget('activation:user_levels', userId),
      redis.hget('trust:scores', userId),
      this.getRecentFlows(5),
      redis.smembers('kill_switch:active'),
    ]);

    return {
      activationLevel: activationLevel ? parseInt(activationLevel, 10) : 0,
      trustScore: trustScore ? parseFloat(trustScore) : 100,
      recentFlows: flows.filter(f => f.userId === userId),
      activeSwitches: activeSwitches || [],
      suppressionStatus: 'active',
    };
  },
};

export default runtimeObservability;