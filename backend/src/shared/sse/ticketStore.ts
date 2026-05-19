// src/shared/sse/ticketStore.ts — Fault-Tolerant Handshake Ticket Store
import crypto from 'crypto';
import { getRedisClient } from '../redis/client.js';
import { logger } from '../logger.js';

const memoryTickets = new Map<string, { userId: string; expiresAt: number }>();

// Periodic cleanup of expired memory tickets (unref prevents blocking process exit in tests)
const timer = setInterval(() => {
  const now = Date.now();
  for (const [ticket, data] of memoryTickets.entries()) {
    if (data.expiresAt < now) {
      memoryTickets.delete(ticket);
    }
  }
}, 30_000);
if (timer && typeof timer.unref === 'function') {
  timer.unref();
}

/**
 * Creates a secure, short-lived handshake ticket for a user.
 * Falls back to in-memory store if Redis is unavailable.
 */
export async function createHandshakeTicket(userId: string): Promise<string> {
  const ticket = crypto.randomUUID();
  const redis = getRedisClient();

  if (redis.status === 'ready') {
    try {
      await redis.setex(`sse:ticket:${ticket}`, 10, userId);
      return ticket;
    } catch (err) {
      logger.warn('[sse-tickets] Redis write failed, falling back to memory', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Graceful degradation fallback
  memoryTickets.set(ticket, {
    userId,
    expiresAt: Date.now() + 10_000, // 10s expiry
  });
  return ticket;
}

/**
 * Consumes a handshake ticket and returns the userId if valid.
 * Strictly single-use (deleted immediately upon read).
 */
export async function consumeHandshakeTicket(ticket: string): Promise<string | null> {
  const redis = getRedisClient();

  if (redis.status === 'ready') {
    try {
      const ticketKey = `sse:ticket:${ticket}`;
      const userId = await redis.get(ticketKey);
      if (userId) {
        await redis.del(ticketKey);
        return userId;
      }
    } catch (err) {
      logger.warn('[sse-tickets] Redis read failed, falling back to memory check', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Memory fallback check
  const data = memoryTickets.get(ticket);
  if (!data) return null;

  memoryTickets.delete(ticket);

  if (data.expiresAt < Date.now()) {
    logger.warn('[sse-tickets] Fallback ticket expired', { ticket });
    return null;
  }

  return data.userId;
}
