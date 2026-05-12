// src/shared/sse/sseHandler.ts — SSE endpoint handler with correlation IDs
// Protected by auth middleware, userId-scoped, with heartbeat and cleanup.

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { eventBus, SseClient } from './eventBus.js';
import { logger } from '../logger.js';
import { env } from '../../config/env.js';

const encoder = new TextEncoder();

function createSseStream(
  userId: string,
  clientId: string,
  requestId: string
): ReadableStream<Uint8Array> {
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;

      const client: SseClient = {
        id: clientId,
        userId,
        controller,
        connectedAt: Date.now(),
        emit(event) {
          if (!controllerRef) return;
          try {
            const payload = `data: ${JSON.stringify(event)}\n\n`;
            controllerRef.enqueue(encoder.encode(payload));
          } catch {
            // Stream closed
          }
        },
        destroy() {
          controllerRef = null;
        },
      };

      try {
        eventBus.register(client);
      } catch (err) {
        logger.error('[sse] Failed to register client', err as Error, {
          requestId,
          clientId,
          error: err instanceof Error ? err.message : String(err),
          event: 'sse_register_failed',
        });
        controller.error(err);
      }
    },
    cancel() {
      eventBus.unregister(clientId);
      logger.info('[sse] Stream cancelled', {
        event: 'sse_stream_cancelled',
        clientId,
        userId,
        requestId,
      });
    },
  });

  return stream;
}

export function handleSseRequest(req: Request, res: Response): void {
  const requestId = req.context?.requestId ?? `sse-${Date.now()}`;

  const token = (req.query.token as string) || (req.headers.authorization?.split(' ')[1]);

  if (!token) {
    logger.warn('[sse] Auth required', {
      event: 'sse_auth_required',
      requestId,
      ip: req.ip,
    });
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string };
    userId = decoded.id;
  } catch {
    logger.warn('[sse] Invalid token', {
      event: 'sse_invalid_token',
      requestId,
      ip: req.ip,
    });
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const clientId = `sse-${userId}-${Date.now()}`;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Keep-Alive', 'timeout=120');
  res.setHeader('X-Request-ID', requestId);

  res.flushHeaders();

  eventBus.startHeartbeat();

  const stream = createSseStream(userId, clientId, requestId);

  stream.pipeTo(
    new WritableStream({
      write(_chunk) {},
      close() {
        eventBus.unregister(clientId);
      },
      abort(err) {
        logger.warn('[sse] Stream aborted', {
          event: 'sse_stream_aborted',
          clientId,
          requestId,
          error: String(err),
        });
        eventBus.unregister(clientId);
      },
    })
  ).catch((err) => {
    logger.warn('[sse] Stream pipe error', {
      event: 'sse_pipe_error',
      clientId,
      requestId,
      error: String(err),
    });
    eventBus.unregister(clientId);
  });

  res.on('close', () => {
    eventBus.unregister(clientId);
    logger.info('[sse] Response closed', {
      event: 'sse_response_closed',
      clientId,
      userId,
      requestId,
    });
  });

  logger.info('[sse] SSE connection opened', {
    event: 'sse_connection_opened',
    clientId,
    userId,
    requestId,
  });
}