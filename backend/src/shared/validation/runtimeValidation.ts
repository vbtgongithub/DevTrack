// src/shared/validation/runtimeValidation.ts — Strict Runtime Contract Validation
// Phase-B: Zod-based validation for all internal systems

import { z } from 'zod';

// ─── Queue Job Payloads ────────────────────────────────────────────────

export const XpEventJobSchema = z.object({
  userId: z.string().uuid(),
  eventId: z.string().min(1),
  sourceType: z.enum(['dsa_accepted', 'dsa_contest', 'daily_streak', 'sync_completed', 'milestone', 'manual']),
  sourceId: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  metadata: z.record(z.unknown()).optional(),
  requestId: z.string().optional(),
  _trace: z.object({
    traceId: z.string().uuid().optional(),
    spanId: z.string().optional(),
    parentSpanId: z.string().optional(),
    correlationId: z.string().optional(),
  }).optional(),
});

export const StreakRecalcJobSchema = z.object({
  userId: z.string().uuid(),
  streakType: z.enum(['dsa', 'github', 'unified']),
  reason: z.enum(['activity_recorded', 'manual_trigger', 'scheduled_rebuild']),
  requestId: z.string().optional(),
  _trace: z.object({
    traceId: z.string().uuid().optional(),
    spanId: z.string().optional(),
    correlationId: z.string().optional(),
  }).optional(),
});

export const AnalyticsSyncJobSchema = z.object({
  userId: z.string().uuid(),
  syncType: z.enum(['xp_update', 'streak_update', 'full_rebuild']),
  requestId: z.string().optional(),
  _trace: z.object({
    traceId: z.string().uuid().optional(),
    spanId: z.string().optional(),
    correlationId: z.string().optional(),
  }).optional(),
});

export const NotificationJobSchema = z.object({
  userId: z.string().uuid(),
  notificationType: z.enum(['streak_reminder', 'level_up', 'milestone', 'system']),
  payload: z.record(z.unknown()),
  requestId: z.string().optional(),
});

// ─── Replay Payloads ──────────────────────────────────────────────────

export const ReplayActivitySchema = z.object({
  userId: z.string().uuid(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  components: z.array(z.enum(['xp', 'streak', 'analytics'])).optional(),
  triggerSource: z.enum(['scheduled', 'manual', 'corruption_recovery']).default('manual'),
});

// ─── Event Schemas ────────────────────────────────────────────────────

export const SseEventSchema = z.object({
  version: z.number().int().min(1).max(10),
  type: z.enum(['sync_started', 'sync_completed', 'sync_failed', 'new_submission', 'xp_updated', 'level_up', 'streak_milestone', 'badge_earned', 'heartbeat', 'notification']),
  timestamp: z.string().datetime(),
  userId: z.string().uuid().optional(),
  payload: z.record(z.unknown()),
});

export const ActivityEventSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['problem_solved', 'commit_pushed', 'pr_merged', 'project_created', 'project_updated', 'contest_participated', 'streak_milestone']),
  occurredAt: z.string().datetime(),
  platform: z.string().optional(),
  sourceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── User Input Schemas ────────────────────────────────────────────────

export const UserRegistrationSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50),
  timezone: z.string().optional(),
});

export const UserLoginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

export const StreakActivitySchema = z.object({
  streakType: z.enum(['dsa', 'github', 'unified']),
  source: z.string().min(1),
  activityDate: z.string().datetime().optional(),
  timezone: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── API Response Schemas ──────────────────────────────────────────────

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  uptime: z.number().positive(),
  checks: z.record(z.object({
    status: z.string(),
    latencyMs: z.number().optional(),
    error: z.string().optional(),
  })),
});

export const MetricsResponseSchema = z.object({
  queues: z.array(z.object({
    name: z.string(),
    waiting: z.number().int(),
    active: z.number().int(),
    completed: z.number().int(),
    failed: z.number().int(),
  })),
  redis: z.object({
    status: z.string(),
    keys: z.number().int(),
  }),
  sse: z.object({
    activeConnections: z.number().int(),
  }),
});

// ─── Validation Engine ─────────────────────────────────────────────────

export const validationEngine = {
  // Validate and parse with error reporting
  validate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: string[];
  } {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errors = result.error.issues.map((issue) =>
      `${issue.path.join('.')}: ${issue.message}`
    );

    return { success: false, errors };
  },

  // Validate with transformation (for migration)
  validateAndTransform<T, U>(
    schema: z.ZodSchema<T>,
    transformer: (data: T) => U,
    data: unknown
  ): {
    success: boolean;
    transformed?: U;
    errors?: string[];
  } {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map((issue) =>
        `${issue.path.join('.')}: ${issue.message}`
      );
      return { success: false, errors };
    }

    try {
      const transformed = transformer(result.data);
      return { success: true, transformed };
    } catch (err) {
      return {
        success: false,
        errors: [`Transformation failed: ${err instanceof Error ? err.message : 'Unknown error'}`],
      };
    }
  },

  // Middleware factory for Express routes
  validateBody<T extends z.ZodSchema>(schema: T) {
    return (req: unknown) => {
      const result = (schema as z.ZodSchema).safeParse((req as { body: unknown }).body);
      if (!result.success) {
        return {
          valid: false,
          errors: result.error.issues.map((i) => i.message),
        };
      }
      return { valid: true, data: result.data };
    };
  },

  // Validate queue job data
  validateJobPayload(queueType: string, data: unknown): {
    valid: boolean;
    errors?: string[];
  } {
    let schema: z.ZodSchema;

    switch (queueType) {
      case 'xp-events':
        schema = XpEventJobSchema;
        break;
      case 'streak-recalc':
        schema = StreakRecalcJobSchema;
        break;
      case 'analytics-sync':
        schema = AnalyticsSyncJobSchema;
        break;
      case 'notifications':
        schema = NotificationJobSchema;
        break;
      default:
        return { valid: true }; // Unknown queue, skip validation
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.issues.map((i) => `[${queueType}] ${i.path.join('.')}: ${i.message}`),
      };
    }

    return { valid: true };
  },
};

export type ValidatedXpEvent = z.infer<typeof XpEventJobSchema>;
export type ValidatedStreakRecalc = z.infer<typeof StreakRecalcJobSchema>;
export type ValidatedAnalyticsSync = z.infer<typeof AnalyticsSyncJobSchema>;
export type ValidatedReplay = z.infer<typeof ReplayActivitySchema>;

export default validationEngine;