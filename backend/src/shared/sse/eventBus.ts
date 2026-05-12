// src/shared/sse/eventBus.ts — Lightweight in-memory event broadcaster with metrics
// No Redis, no BullMQ — just eventEmitter with userId-scoped broadcasting + observability.

import { EventEmitter } from 'events';
import { logger } from '../logger.js';

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
// Event types
// ---------------------------------------------------------------------------

export type SseEventType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'new_submission'
  | 'xp_updated'
  | 'level_up'
  | 'heartbeat';

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

  // Operational metrics
  private totalConnections = 0;
  private totalDisconnects = 0;
  private totalReconnects = 0;
  private heartbeatFailures = 0;
  private eventsPublished = 0;
  private readonly startedAt = Date.now();

  constructor() {
    super();
    this.setMaxListeners(this.MAX_CLIENTS);
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
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    const encoded = encoder.encode(payload);
    this.eventsPublished++;

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
