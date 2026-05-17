// src/modules/progression-orchestration/activityEvent.ts
// Canonical activity event models, interfaces, and validator factories.
// Standardizes ingestion schemas across all external platform adapters.

import { z } from 'zod';

// Zod Schema to validate ingestion envelopes at runtime
export const CanonicalActivitySchema = z.object({
  activityId: z.string().uuid(),
  provider: z.enum(['leetcode', 'github', 'codeforces', 'gfg', 'codechef', 'hackerrank']),
  providerEventId: z.string().min(1),
  userId: z.string().min(1),
  type: z.enum(['problem_solved', 'contest_participated', 'submission', 'daily_challenge']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'unknown']).optional(),
  
  metadata: z.object({
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),
    language: z.string().optional(),
    runtime: z.number().optional(),
    contestId: z.string().optional(),
    contestRank: z.number().optional(),
  }),

  // Distributed Tracing / Lineage propagation
  traceContext: z.object({
    traceId: z.string(),
    correlationId: z.string(),
    causationId: z.string(),
    schemaVersion: z.number().default(1),
  }),

  // Audit / Performance metrics metadata
  audit: z.object({
    ingestedAt: z.string(),
    occurredAt: z.string(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  }),
});

export type CanonicalActivity = z.infer<typeof CanonicalActivitySchema>;

/**
 * Helper to build a canonical event envelope.
 */
export function createCanonicalActivity(
  provider: CanonicalActivity['provider'],
  providerEventId: string,
  userId: string,
  type: CanonicalActivity['type'],
  data: {
    difficulty?: 'easy' | 'medium' | 'hard' | 'unknown';
    metadata?: CanonicalActivity['metadata'];
  },
  auditInfo: {
    occurredAt: string;
    ipAddress?: string;
    userAgent?: string;
  },
  traceId: string,
  correlationId: string,
  causationId: string
): CanonicalActivity {
  return {
    activityId: crypto.randomUUID(),
    provider,
    providerEventId,
    userId,
    type,
    difficulty: data.difficulty || 'unknown',
    metadata: data.metadata || {},
    traceContext: {
      traceId,
      correlationId,
      causationId,
      schemaVersion: 1,
    },
    audit: {
      ingestedAt: new Date().toISOString(),
      occurredAt: auditInfo.occurredAt,
      ipAddress: auditInfo.ipAddress,
      userAgent: auditInfo.userAgent,
    },
  };
}
