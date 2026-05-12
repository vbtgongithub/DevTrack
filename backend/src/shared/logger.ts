// src/shared/logger.ts — Structured logger with performance monitoring
import { env } from '../config/env.js';

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  event: string;
  durationMs?: number;
  requestId?: string;
  userId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function emit(entry: LogEntry): void {
  const line = formatEntry(entry);
  switch (entry.level) {
    case 'ERROR':
    case 'WARN':
      console.error(line);
      break;
    default:
      process.stdout.write(line + '\n');
  }
}

const SERVICE_NAME = 'devtrack-api';

// ---------------------------------------------------------------------------
// Slow query thresholds (ms)
// ---------------------------------------------------------------------------
const THRESHOLDS = {
  DB_QUERY: 200,
  AGGREGATION: 300,
  SCHEDULER_CYCLE: 500,
  SUBMISSIONS_QUERY: 400,
  HEATMAP_AGG: 500,
  SSE_PUBLISH: 50,
};

export const logger = {
  info(event: string, meta?: Record<string, unknown>): void {
    emit({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: SERVICE_NAME,
      event,
      requestId: meta?.requestId as string | undefined,
      userId: meta?.userId as string | undefined,
      metadata: excludeMeta(meta),
    });
  },

  error(event: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errorMsg = error instanceof Error ? error.message : String(error ?? '');
    emit({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: SERVICE_NAME,
      event,
      requestId: meta?.requestId as string | undefined,
      userId: meta?.userId as string | undefined,
      error: errorMsg || undefined,
      metadata: excludeMeta(meta),
    });
  },

  warn(event: string, meta?: Record<string, unknown>): void {
    emit({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      service: SERVICE_NAME,
      event,
      requestId: meta?.requestId as string | undefined,
      userId: meta?.userId as string | undefined,
      metadata: excludeMeta(meta),
    });
  },

  debug(event: string, meta?: Record<string, unknown>): void {
    if (!env.IS_DEV) return;
    emit({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      service: SERVICE_NAME,
      event,
      requestId: meta?.requestId as string | undefined,
      userId: meta?.userId as string | undefined,
      metadata: excludeMeta(meta),
    });
  },

  http(event: string, meta?: Record<string, unknown>): void {
    if (!env.IS_DEV) return;
    emit({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: SERVICE_NAME,
      event,
      requestId: meta?.requestId as string | undefined,
      userId: meta?.userId as string | undefined,
      metadata: excludeMeta(meta),
    });
  },

  // Performance logging — auto-flags slow operations by category
  perf(label: string, ms: number, meta?: Record<string, unknown>): void {
    const threshold = detectCategory(label);
    const level = ms > threshold ? 'WARN' : 'INFO';
    emit({
      timestamp: new Date().toISOString(),
      level,
      service: SERVICE_NAME,
      event: 'performance',
      durationMs: ms,
      requestId: meta?.requestId as string | undefined,
      userId: meta?.userId as string | undefined,
      metadata: { label, threshold, ...excludeMeta(meta) },
    });
  },
};

function detectCategory(label: string): number {
  const l = label.toLowerCase();
  if (l.includes('db') || l.includes('query') || l.includes('mongo')) return THRESHOLDS.DB_QUERY;
  if (l.includes('agg') || l.includes('heatmap')) return THRESHOLDS.AGGREGATION;
  if (l.includes('scheduler') || l.includes('sync')) return THRESHOLDS.SCHEDULER_CYCLE;
  if (l.includes('submission')) return THRESHOLDS.SUBMISSIONS_QUERY;
  if (l.includes('heat')) return THRESHOLDS.HEATMAP_AGG;
  if (l.includes('sse') || l.includes('publish') || l.includes('event')) return THRESHOLDS.SSE_PUBLISH;
  return THRESHOLDS.DB_QUERY;
}

function excludeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const { requestId, userId, ...rest } = meta;
  void requestId; void userId; // consumed above
  return Object.keys(rest).length > 0 ? rest : undefined;
}

export default logger;