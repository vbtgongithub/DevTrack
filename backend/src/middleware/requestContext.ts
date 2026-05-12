// src/shared/requestContext.ts — Request correlation ID management
// Generates or preserves X-Request-ID for distributed tracing.
// Attaches requestId to req.context so all modules can propagate it.

import { Request, Response, NextFunction } from 'express';

export interface RequestContext {
  requestId: string;
  userId?: string;
  startTime: number;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Preserve existing ID if client sends one; otherwise generate
  const incomingId = req.headers['x-request-id'] as string | undefined;
  const requestId = (incomingId && incomingId.length <= 64) ? incomingId : generateRequestId();

  req.context = {
    requestId,
    startTime: Date.now(),
  };

  // Attach to response so client can see correlation ID
  _res.setHeader('X-Request-ID', requestId);

  next();
}

// Utility to build correlation metadata for logger calls
export function buildCorrelationMeta(req?: Request): Record<string, unknown> {
  if (!req?.context) return {};
  return {
    requestId: req.context.requestId,
    userId: req.context.userId ?? undefined,
  };
}