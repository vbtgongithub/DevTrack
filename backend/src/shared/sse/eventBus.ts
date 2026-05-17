// src/shared/sse/eventBus.ts — In-memory event broadcaster with optional Redis pub/sub for horizontal scaling
// Local events for same-instance, Redis pub/sub for cross-instance event distribution.

import { EventEmitter } from 'events';
import { logger } from '../logger.js';
import { getRedisClient } from '../redis/client.js';

const SSE_CHANNEL = 'devtrack:sse:events';

// ---------------------------------------------------------------------------
// SSE Operational Metrics
// ---------------------------------------------------------------------------

export interface SseMetricsSnapshot {
  activeConnections: number;
  totalConnections: number;
  totalDisconnects: number;
  totalReconnects: number;
  heartbeatFailures: number;
  eventsPublished: number;
  uptimeSeconds: number;
}

// ---------------------------------------------------------------------------
// Event types - Expanded taxonomy for unified runtime state
// ---------------------------------------------------------------------------

export type SseEventType =
  // Runtime state (primary)
  | 'runtime_state_patch'
  | 'runtime_state_full'
  // Behavioral
  | 'behavioral_message'
  | 'notification_created'
  // Progression moments
  | 'level_up'
  | 'streak_milestone'
  | 'streak_at_risk'
  | 'achievement_unlocked'
  | 'goal_completed'
  | 'challenge_completed'
  | 'near_milestone'
  // Sync
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'new_submission'
  // Legacy (for backwards compatibility)
  | 'xp_updated'
  | 'badge_earned'
  // System
  | 'heartbeat';

export interface SseEventEnvelope {
  id: string;
  type: SseEventType;
  sequence: number;
  timestamp: string;
  userId: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  schemaVersion?: number;
}

export interface SseEvent {
  type: SseEventType;
  timestamp: string;
  userId?: string;
  platform?: string;
  stats?: {
    totalSolved?: number;
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
    rating?: number;
    totalContests?: number;
    ingested?: number;
    successCount?: number;
    failedCount?: number;
    error?: string;
  };
}

// ---------------------------------------------------------------------------
// SseClient — one per SSE connection
// ---------------------------------------------------------------------------

export interface SseClient {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  connectedAt: number;
  emit(event: SseEvent): void;
  destroy(): void;
}

const encoder = new TextEncoder();

// ---------------------------------------------------------------------------
// EventBus — singleton broadcaster with operational metrics
// ---------------------------------------------------------------------------

class EventBus extends EventEmitter {
  private clients = new Map<string, SseClient>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 25_000;
  private readonly MAX_CLIENTS = 10_000;
  private redisSubscriber: ReturnType<typeof getRedisClient>['duplicate'] | null = null;

  // Operational metrics
  private totalConnections = 0;
  private totalDisconnects = 0;
  private totalReconnects = 0;
  private heartbeatFailures = 0;
  private eventsPublished = 0;
  private readonly startedAt = Date.now();

  // Event coalescing for runtime_state_patch
  private patchCoalesceTimer: NodeJS.Timeout | null = null;
  private pendingPatch: { userId: string; delta: Record<string, unknown> } | null = null;
  private readonly PATCH_COALESCE_MS = 3000; // 3 seconds

  constructor() {
    super();
    this.setMaxListeners(this.MAX_CLIENTS);
    this.initRedisPubSub();
  }

  // ─── Redis pub/sub for horizontal scaling ─────────────────────────────────
  private async initRedisPubSub(): Promise<void> {
    try {
      const Redis = (await import('ioredis')).default;
      const subscriber = new (Redis as unknown as { new(options: Record<string, unknown>): unknown })({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
      });

      (subscriber as unknown as { on(event: string, cb: (channel: string, message: string) => void): void }).on('message', (_channel: string, message: string) => {
        try {
          const event = JSON.parse(message) as SseEvent;
          this.publishLocal(event, event.userId);
        } catch (err) {
          logger.warn('[sse] Failed to parse Redis message', { error: err });
        }
      });

      await (subscriber as unknown as { subscribe(channel: string): Promise<void> }).subscribe(SSE_CHANNEL);
      this.redisSubscriber = subscriber as typeof this.redisSubscriber;
      logger.info('[sse] Redis pub/sub initialized', { channel: SSE_CHANNEL });
    } catch (err) {
      logger.warn('[sse] Redis pub/sub unavailable, using local only', { error: err });
    }
  }

  private async publishToRedis(event: SseEvent): Promise<void> {
    try {
      const Redis = (await import('ioredis')).default;
      const publisher = new (Redis as unknown as { new(options: Record<string, unknown>): unknown })({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      });
      await (publisher as unknown as { publish(channel: string, message: string): Promise<number> }).publish(SSE_CHANNEL, JSON.stringify(event));
      await (publisher as unknown as { quit(): Promise<void> }).quit();
    } catch (err) {
      logger.debug('[sse] Redis publish failed', { error: err });
    }
  }

  private publishLocal(event: SseEvent, targetUserId?: string): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    const encoded = encoder.encode(payload);

    if (targetUserId) {
      for (const client of this.clients.values()) {
        if (client.userId === targetUserId) {
          try {
            client.controller.enqueue(encoded);
          } catch {
            this.unregister(client.id);
          }
        }
      }
    } else {
      for (const client of this.clients.values()) {
        try {
          client.controller.enqueue(encoded);
        } catch {
          this.unregister(client.id);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Client management
  // ---------------------------------------------------------------------------

  register(client: SseClient): void {
    if (this.clients.size >= this.MAX_CLIENTS) {
      logger.warn('[sse] Max clients reached, rejecting connection', {
        currentClients: this.clients.size,
        maxClients: this.MAX_CLIENTS,
        event: 'sse_max_clients_reached',
      });
      throw new Error('Server at capacity');
    }

    this.clients.set(client.id, client);
    this.totalConnections++;

    logger.info('[sse] Client connected', {
      event: 'sse_client_connected',
      clientId: client.id,
      userId: client.userId,
      activeConnections: this.clients.size,
      totalConnections: this.totalConnections,
    });
  }

  unregister(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const lifetime = Date.now() - client.connectedAt;
    this.clients.delete(clientId);
    this.totalDisconnects++;
    client.destroy();

    logger.info('[sse] Client disconnected', {
      event: 'sse_client_disconnected',
      clientId,
      userId: client.userId,
      activeConnections: this.clients.size,
      totalDisconnects: this.totalDisconnects,
      lifetimeMs: lifetime,
    });
  }

  // ---------------------------------------------------------------------------
  // Event emission — userId-scoped (user only sees their own events)
  // ---------------------------------------------------------------------------

  publish(event: SseEvent, targetUserId?: string): void {
    this.eventsPublished++;

    // Local delivery (same instance)
    this.publishLocal(event, targetUserId);

    // Cross-instance delivery via Redis pub/sub
    void this.publishToRedis(event);

    logger.debug('[sse] Event published', {
      event: 'sse_event_published',
      type: event.type,
      userId: event.userId ?? 'system',
      targetUserId: targetUserId ?? 'broadcast',
      clientCount: this.clients.size,
      totalEvents: this.eventsPublished,
    });
  }

  // ---------------------------------------------------------------------------
  // Heartbeat — keeps connections alive, detects stale clients
  // ---------------------------------------------------------------------------

  startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      const payload = encoder.encode(`: heartbeat\n\n`);
      let failed = 0;

      for (const client of this.clients.values()) {
        try {
          client.controller.enqueue(payload);
        } catch {
          failed++;
          this.unregister(client.id);
        }
      }

      if (failed > 0) {
        this.heartbeatFailures += failed;
        logger.warn('[sse] Heartbeat failed for clients, cleaned up', {
          event: 'sse_heartbeat_failure',
          failed,
          remainingClients: this.clients.size,
          heartbeatFailures: this.heartbeatFailures,
        });
      }
    }, this.HEARTBEAT_INTERVAL_MS);

    logger.info('[sse] Heartbeat started', {
      event: 'sse_heartbeat_started',
      intervalMs: this.HEARTBEAT_INTERVAL_MS,
    });
  }

  stopHeartbeat(): void {
    if (!this.heartbeatInterval) return;
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
    logger.info('[sse] Heartbeat stopped', { event: 'sse_heartbeat_stopped' });
  }

  // ---------------------------------------------------------------------------
  // Metrics & diagnostics
  // ---------------------------------------------------------------------------

  recordReconnect(): void {
    this.totalReconnects++;
  }

  getMetrics(): SseMetricsSnapshot {
    return {
      activeConnections: this.clients.size,
      totalConnections: this.totalConnections,
      totalDisconnects: this.totalDisconnects,
      totalReconnects: this.totalReconnects,
      heartbeatFailures: this.heartbeatFailures,
      eventsPublished: this.eventsPublished,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  // ---------------------------------------------------------------------------
  // Broadcast helpers (convenience wrappers)
  // ---------------------------------------------------------------------------

  emitSyncStarted(userId: string): void {
    this.publish(
      {
        type: 'sync_started',
        timestamp: new Date().toISOString(),
        userId,
        stats: { totalSolved: 0 },
      },
      userId
    );
  }

  emitSyncCompleted(userId: string, platform: string, stats?: SseEvent['stats']): void {
    this.publish(
      {
        type: 'sync_completed',
        timestamp: new Date().toISOString(),
        userId,
        platform,
        stats,
      },
      userId
    );
  }

  emitSyncFailed(userId: string, platform: string, error: string): void {
    this.publish(
      {
        type: 'sync_failed',
        timestamp: new Date().toISOString(),
        userId,
        platform,
        stats: { error },
      },
      userId
    );
  }

  emitNewSubmission(userId: string, platform: string, ingested: number): void {
    this.publish(
      {
        type: 'new_submission',
        timestamp: new Date().toISOString(),
        userId,
        platform,
        stats: { ingested },
      },
      userId
    );
  }

  emitXpUpdated(userId: string, totalXp: number, gainedXp: number, currentLevel: number, nextLevelXp: number): void {
    this.publish(
      {
        type: 'xp_updated',
        timestamp: new Date().toISOString(),
        userId,
        stats: {
          totalSolved: totalXp,
          easySolved: gainedXp,
          mediumSolved: currentLevel,
          hardSolved: nextLevelXp,
        },
      },
      userId
    );
  }

  emitLevelUp(userId: string, newLevel: number, totalXp: number): void {
    this.publish(
      {
        type: 'level_up',
        timestamp: new Date().toISOString(),
        userId,
        stats: {
          totalSolved: totalXp,
          rating: newLevel,
        },
      },
      userId
    );
  }

  emitStreakMilestone(userId: string, streakDays: number, streakType: string): void {
    this.publish(
      {
        type: 'streak_milestone',
        timestamp: new Date().toISOString(),
        userId,
        stats: {
          totalSolved: streakDays,
          easySolved: streakType === 'dsa' ? 1 : 0,
          mediumSolved: streakType === 'github' ? 1 : 0,
          hardSolved: streakType === 'unified' ? 1 : 0,
        },
      },
      userId
    );
  }

  emitBadgeEarned(userId: string, badgeId: string, badgeName: string): void {
    this.publish(
      {
        type: 'badge_earned',
        timestamp: new Date().toISOString(),
        userId,
        stats: {
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
        },
      },
      userId
    );
  }

  // ─── New SSE event emitters for unified runtime state ─────────────────────

  async emitRuntimeStatePatch(userId: string, delta: Record<string, unknown>): Promise<void> {
    // Coalesce patches - max 1 per 3 seconds
    if (this.pendingPatch && this.pendingPatch.userId === userId) {
      // Merge with pending patch
      this.pendingPatch.delta = { ...this.pendingPatch.delta, ...delta };
      return;
    }

    if (this.patchCoalesceTimer) {
      clearTimeout(this.patchCoalesceTimer);
    }

    this.pendingPatch = { userId, delta };
    this.patchCoalesceTimer = setTimeout(async () => {
      if (this.pendingPatch) {
        await this.publishEnvelope(userId, 'runtime_state_patch', this.pendingPatch.delta);
        this.pendingPatch = null;
      }
    }, this.PATCH_COALESCE_MS);
  }

  async emitRuntimeStateFull(userId: string, state: Record<string, unknown>): Promise<void> {
    // Bypass coalescing for full state (e.g., on reconnect)
    await this.publishEnvelope(userId, 'runtime_state_full', { state });
  }

  async emitBehavioralMessage(
    userId: string,
    messageId: string,
    tone: 'encouraging' | 'calm' | 'celebratory' | 'gentle-nudge' | 'supportive' | 'silent',
    text: string,
    action?: { label: string; route: string },
    expiresAt?: Date
  ): Promise<void> {
    await this.publishEnvelope(userId, 'behavioral_message', {
      messageId,
      tone,
      text,
      action,
      expiresAt: expiresAt?.toISOString(),
    });
  }

  async emitNotificationCreated(
    userId: string,
    notificationId: string,
    type: string,
    title: string,
    body: string,
    tone: string,
    priority: string
  ): Promise<void> {
    await this.publishEnvelope(userId, 'notification_created', {
      notificationId,
      type,
      title,
      body,
      tone,
      priority,
    });
  }

  // ─── Helper to publish envelope with sequence number ─────────────────────

  async publishEnvelope(
    userId: string,
    type: SseEventType,
    payload: Record<string, unknown>,
    correlationId?: string,
    schemaVersion?: number
  ): Promise<void> {
    const redis = getRedisClient();
    
    // Get next sequence number for this user
    const sequenceKey = `sse:seq:${userId}`;
    const sequence = await redis.incr(sequenceKey);
    // Keep sequence key alive as long as the stream — prevents unbounded key accumulation
    await redis.expire(sequenceKey, 300);
    
    // Generate event ID
    const eventId = `${userId}-${sequence}-${Date.now()}`;
    
    const envelope: SseEventEnvelope = {
      id: eventId,
      type,
      sequence,
      timestamp: new Date().toISOString(),
      userId,
      payload,
      correlationId: correlationId || eventId,
      schemaVersion: schemaVersion || 1,
    };
    
    // Log to Redis stream for backfill (5 min retention, max 100 entries)
    const streamKey = `sse:stream:${userId}`;
    await redis.xadd(
      streamKey,
      '*',
      'type',
      type,
      'sequence',
      sequence.toString(),
      'payload',
      JSON.stringify(payload),
      'timestamp',
      envelope.timestamp,
      'correlationId',
      envelope.correlationId || '',
      'schemaVersion',
      (envelope.schemaVersion || 1).toString()
    );
    await redis.expire(streamKey, 300); // 5 minutes
    await redis.xtrim(streamKey, 'MAXLEN', '~', 100);
    
    // Publish as legacy event for backward compatibility
    this.publish(
      {
        type,
        timestamp: envelope.timestamp,
        userId,
        stats: payload as SseEvent['stats'],
      },
      userId
    );
  }

  // ─── Legacy emit methods (for backward compatibility) ─────────────────────

  emitRuntimeStateUpdated(userId: string, state: Record<string, unknown>): void {
    // Use new patch method
    void this.emitRuntimeStatePatch(userId, state);
  }

  shutdown(): void {
    this.stopHeartbeat();
    for (const client of this.clients.values()) {
      try {
        client.controller.close();
      } catch {
        // ignore
      }
      client.destroy();
    }
    this.clients.clear();
    logger.info('[sse] EventBus shutdown', { event: 'sse_shutdown' });
  }
}
// Module-level singleton
export const eventBus = new EventBus();
export default eventBus;
