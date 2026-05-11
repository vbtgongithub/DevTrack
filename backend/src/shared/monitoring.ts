// src/shared/monitoring.ts - Production Monitoring Service
// ============================================================================
// Simple wrapper for production observability. Can be easily extended to
// integrate with Sentry, BetterStack, or Datadog.
// ============================================================================

import { logger } from './logger.js';
import { env } from '../config/index.js';

interface ErrorContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Report an error to production monitoring systems.
 */
export function reportError(error: unknown, context: ErrorContext = {}): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  // 1. Log locally with structured metadata
  logger.error(`[MONITORING] Error reported: ${errorObj.message}`, {
    stack: errorObj.stack,
    ...context,
  });

  // 2. Production-only integrations
  if (env.IS_PROD) {
    // TODO: Integrate Sentry or BetterStack here
    // Sentry.captureException(errorObj, { extra: context });
  }
}

/**
 * Track a performance metric.
 */
export function trackMetric(name: string, value: number, tags: Record<string, string> = {}): void {
  if (env.IS_PROD) {
    // logger.info(`[METRIC] ${name}: ${value}`, tags);
  }
}
