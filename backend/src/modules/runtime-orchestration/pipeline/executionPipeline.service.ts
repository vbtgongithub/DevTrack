// src/modules/runtime-orchestration/pipeline/executionPipeline.service.ts — Retention Execution Pipeline
// Phase-F: Unified event execution pipeline with middleware

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export type EventCategory = 'xp' | 'goal' | 'challenge' | 'achievement' | 'streak' | 'notification' | 'analytics';
export type MiddlewareType = 'validation' | 'rate_limit' | 'suppression' | 'transformation' | 'logging';

export interface PipelineEvent {
  id: string;
  category: EventCategory;
  userId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  metadata: {
    source: string;
    priority: number;
    idempotencyKey: string;
    [key: string]: unknown;
  };
}

export interface PipelineMiddleware {
  id: string;
  name: string;
  type: MiddlewareType;
  order: number;
  handler: (event: PipelineEvent) => Promise<PipelineEvent | null>;
  active: boolean;
}

export interface PipelineMetrics {
  totalProcessed: number;
  totalFailed: number;
  avgLatencyMs: number;
  categoryBreakdown: Record<EventCategory, number>;
}

const PIPELINE_EVENTS_KEY = 'pipeline:events';
const MIDDLEWARE_KEY = 'pipeline:middleware';
const METRICS_KEY = 'pipeline:metrics';

export const executionPipeline = {
  // ─── Process event through pipeline ────────────────────────────────────
  async processEvent(event: PipelineEvent): Promise<{
    success: boolean;
    processedBy: string[];
    result?: unknown;
    error?: string;
  }> {
    const middleware = await this.getMiddleware();
    const activeMiddleware = middleware.filter(m => m.active).sort((a, b) => a.order - b.order);

    const processedBy: string[] = [];
    let processedEvent = event;

    for (const mw of activeMiddleware) {
      try {
        const result = await mw.handler(processedEvent);
        if (result === null) {
          return {
            success: false,
            processedBy,
            error: `Blocked by middleware: ${mw.name}`,
          };
        }
        processedEvent = result;
        processedBy.push(mw.id);
      } catch (error) {
        logger.error('[pipeline] Middleware failed', { middleware: mw.id, error });
        return {
          success: false,
          processedBy,
          error: error instanceof Error ? error.message : 'Middleware error',
        };
      }
    }

    // Execute final event processing
    const result = await this.executeEvent(processedEvent);

    // Update metrics
    await this.updateMetrics(event.category, true);

    return {
      success: true,
      processedBy,
      result,
    };
  },

  // ─── Get all middleware ───────────────────────────────────────────────
  async getMiddleware(): Promise<PipelineMiddleware[]> {
    const redis = getRedisClient();
    const cached = await redis.get(MIDDLEWARE_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    return this.getDefaultMiddleware();
  },

  // ─── Get default middleware configuration ─────────────────────────────
  getDefaultMiddleware(): PipelineMiddleware[] {
    return [
      {
        id: 'validation',
        name: 'Event Validation',
        type: 'validation',
        order: 1,
        handler: this.validationMiddleware.bind(this),
        active: true,
      },
      {
        id: 'rate_limit',
        name: 'Rate Limiting',
        type: 'rate_limit',
        order: 2,
        handler: this.rateLimitMiddleware.bind(this),
        active: true,
      },
      {
        id: 'suppression',
        name: 'Kill Switch Suppression',
        type: 'suppression',
        order: 3,
        handler: this.suppressionMiddleware.bind(this),
        active: true,
      },
      {
        id: 'transformation',
        name: 'Event Transformation',
        type: 'transformation',
        order: 4,
        handler: this.transformationMiddleware.bind(this),
        active: true,
      },
      {
        id: 'logging',
        name: 'Event Logging',
        type: 'logging',
        order: 5,
        handler: this.loggingMiddleware.bind(this),
        active: true,
      },
    ];
  },

  // ─── Validation middleware ────────────────────────────────────────────
  async validationMiddleware(event: PipelineEvent): Promise<PipelineEvent | null> {
    if (!event.userId || !event.category) {
      logger.warn('[pipeline] Invalid event - missing required fields');
      return null;
    }

    return event;
  },

  // ─── Rate limit middleware ───────────────────────────────────────────
  async rateLimitMiddleware(event: PipelineEvent): Promise<PipelineEvent | null> {
    const redis = getRedisClient();
    const key = `pipeline:rate:${event.userId}:${event.category}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60); // 1 minute window
    }

    const maxPerMinute = this.getCategoryRateLimit(event.category);
    if (count > maxPerMinute) {
      logger.warn('[pipeline] Rate limited', { userId: event.userId, category: event.category, count });
      return null;
    }

    return event;
  },

  // ─── Get category rate limit ─────────────────────────────────────────
  getCategoryRateLimit(category: EventCategory): number {
    const limits: Record<EventCategory, number> = {
      xp: 100,
      goal: 50,
      challenge: 20,
      achievement: 30,
      streak: 10,
      notification: 50,
      analytics: 200,
    };
    return limits[category] || 50;
  },

  // ─── Suppression middleware ───────────────────────────────────────────
  async suppressionMiddleware(event: PipelineEvent): Promise<PipelineEvent | null> {
    const { killSwitchService } = await import('../killSwitch/killSwitch.service.js');

    const categoryToTarget: Record<EventCategory, string> = {
      xp: 'xp_multipliers',
      goal: 'goal_generation',
      challenge: 'challenge_generation',
      achievement: 'achievement_system',
      streak: 'streak_bonuses',
      notification: 'notifications',
      analytics: 'orchestration',
    };

    const target = categoryToTarget[event.category];
    if (target) {
      const enabled = await killSwitchService.isEnabled(target as any);
      if (!enabled) {
        logger.debug('[pipeline] Suppressed by kill switch', { category: event.category, target });
        return null;
      }
    }

    return event;
  },

  // ─── Transformation middleware ─────────────────────────────────────────
  async transformationMiddleware(event: PipelineEvent): Promise<PipelineEvent> {
    // Add timestamp normalization
    event.timestamp = new Date();

    // Add processing metadata
    event.metadata = {
      ...event.metadata,
      processedAt: new Date().toISOString(),
      pipelineVersion: '1.0',
    };

    return event;
  },

  // ─── Logging middleware ───────────────────────────────────────────────
  async loggingMiddleware(event: PipelineEvent): Promise<PipelineEvent> {
    logger.debug('[pipeline] Event processed', {
      id: event.id,
      category: event.category,
      userId: event.userId,
    });

    return event;
  },

  // ─── Execute final event processing ───────────────────────────────────
  async executeEvent(event: PipelineEvent): Promise<unknown> {
    const handlers: Record<EventCategory, (event: PipelineEvent) => Promise<unknown>> = {
      xp: this.handleXpEvent.bind(this),
      goal: this.handleGoalEvent.bind(this),
      challenge: this.handleChallengeEvent.bind(this),
      achievement: this.handleAchievementEvent.bind(this),
      streak: this.handleStreakEvent.bind(this),
      notification: this.handleNotificationEvent.bind(this),
      analytics: this.handleAnalyticsEvent.bind(this),
    };

    const handler = handlers[event.category];
    if (!handler) {
      logger.warn('[pipeline] No handler for category', { category: event.category });
      return null;
    }

    return handler(event);
  },

  // ─── Handle XP events ─────────────────────────────────────────────────
  async handleXpEvent(event: PipelineEvent): Promise<{ processed: boolean }> {
    const { getXpProcessingQueue } = await import('../../../shared/jobs/index.js');
    const queue = getXpProcessingQueue();

    await queue.add('pipeline-xp', {
      userId: event.userId,
      eventId: event.id,
      ...event.payload,
    });

    return { processed: true };
  },

  // ─── Handle goal events ────────────────────────────────────────────────
  async handleGoalEvent(event: PipelineEvent): Promise<{ processed: boolean }> {
    return { processed: true };
  },

  // ─── Handle challenge events ──────────────────────────────────────────
  async handleChallengeEvent(event: PipelineEvent): Promise<{ processed: boolean }> {
    return { processed: true };
  },

  // ─── Handle achievement events ────────────────────────────────────────
  async handleAchievementEvent(event: PipelineEvent): Promise<{ processed: boolean }> {
    return { processed: true };
  },

  // ─── Handle streak events ─────────────────────────────────────────────
  async handleStreakEvent(event: PipelineEvent): Promise<{ processed: boolean }> {
    return { processed: true };
  },

  // ─── Handle notification events ────────────────────────────────────────
  async handleNotificationEvent(event: PipelineEvent): Promise<{ processed: boolean }> {
    return { processed: true };
  },

  // ─── Handle analytics events ───────────────────────────────────────────
  async handleAnalyticsEvent(event: PipelineEvent): Promise<{ processed: boolean }> {
    return { processed: true };
  },

  // ─── Update pipeline metrics ──────────────────────────────────────────
  async updateMetrics(category: EventCategory, success: boolean): Promise<void> {
    const redis = getRedisClient();
    const current = await redis.get(METRICS_KEY);

    let metrics: PipelineMetrics = current ? JSON.parse(current) : {
      totalProcessed: 0,
      totalFailed: 0,
      avgLatencyMs: 0,
      categoryBreakdown: { xp: 0, goal: 0, challenge: 0, achievement: 0, streak: 0, notification: 0, analytics: 0 },
    };

    if (success) {
      metrics.totalProcessed++;
      metrics.categoryBreakdown[category]++;
    } else {
      metrics.totalFailed++;
    }

    await redis.set(METRICS_KEY, JSON.stringify(metrics), 'EX', 3600);
  },

  // ─── Get pipeline metrics ──────────────────────────────────────────────
  async getMetrics(): Promise<PipelineMetrics> {
    const redis = getRedisClient();
    const cached = await redis.get(METRICS_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    return {
      totalProcessed: 0,
      totalFailed: 0,
      avgLatencyMs: 0,
      categoryBreakdown: { xp: 0, goal: 0, challenge: 0, achievement: 0, streak: 0, notification: 0, analytics: 0 },
    };
  },

  // ─── Create pipeline event ────────────────────────────────────────────
  createEvent(
    category: EventCategory,
    userId: string,
    payload: Record<string, unknown>,
    source: string = 'system'
  ): PipelineEvent {
    return {
      id: `pipe_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      category,
      userId,
      timestamp: new Date(),
      payload,
      metadata: {
        source,
        priority: 5,
        idempotencyKey: `${category}:${userId}:${Date.now()}`,
      },
    };
  },
};

export default executionPipeline;