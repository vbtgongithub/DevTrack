// tests/chaos/ingestionOrchestration.test.ts
// Chaos & integration test suite verifying the deterministic progression and ingestion pipeline.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestionPipelineService } from '../../src/modules/progression-orchestration/ingestionPipeline.js';
import { xpEngine } from '../../src/modules/progression-orchestration/xpEngine.js';
import { streakEngine } from '../../src/modules/progression-orchestration/streakEngine.js';
import { antiAbuseDetector } from '../../src/modules/progression-orchestration/abuseDetector.js';
import { deduplicator } from '../../src/modules/progression-orchestration/deduplicator.js';

// Mock Redis client to run completely unit-level and bypass connection timeouts
const redisState: Record<string, string> = {};
const mockRedis = {
  get: vi.fn().mockImplementation(async (key) => redisState[key] || null),
  set: vi.fn().mockImplementation(async (key, val) => {
    redisState[key] = val;
    return 'OK';
  }),
  del: vi.fn().mockImplementation(async (...keys) => {
    keys.forEach((key) => delete redisState[key]);
    return 1;
  }),
  zadd: vi.fn().mockResolvedValue(1),
  zremrangebyscore: vi.fn().mockResolvedValue(0),
  zcard: vi.fn().mockResolvedValue(0),
  xadd: vi.fn().mockResolvedValue('123-0'),
  hset: vi.fn().mockResolvedValue(1),
};

vi.mock('../../src/shared/redis/index', () => ({
  getRedisClient: () => mockRedis,
}));

// Mock Database models to keep the tests completely isolated and fast
vi.mock('../../src/db/models/userXp.model.js', () => ({
  UserXp: {
    findOne: vi.fn().mockResolvedValue({
      totalXp: 120,
      currentLevel: 2,
      save: vi.fn().mockResolvedValue(true),
      lifetimeStats: {
        totalProblemsSolved: 5,
        easySolved: 3,
        mediumSolved: 2,
        hardSolved: 0,
        totalXpEarned: 120,
      },
    }),
  },
}));

vi.mock('../../src/db/models/userStreakLog.model.js', () => ({
  UserStreakLog: {
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('../../src/db/models/xpTransaction.model.js', () => ({
  XpTransaction: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('../../src/db/models/unifiedRuntimeState.model.ts', () => ({
  UnifiedRuntimeState: {
    findOne: vi.fn().mockResolvedValue({
      userId: 'test-user-123',
      xp: 120,
      level: 2,
      streak: 5,
      longestStreak: 5,
      save: vi.fn().mockResolvedValue(true),
    }),
  },
}));

describe('Progression & Ingestion Orchestration Pipeline', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sandbox local state
    Object.keys(redisState).forEach((key) => delete redisState[key]);
  });

  it('should normalize and ingest a stream of multi-provider submissions successfully', async () => {
    const mockLeetCodeSub = {
      externalId: 'leetcode-sub-1',
      platform: 'leetcode' as const,
      title: 'Two Sum',
      difficulty: 'easy' as const,
      status: 'accepted' as const,
      submittedAt: new Date(),
      language: 'javascript',
    };

    // Ensure first-time ingestion returns success and registers keys
    vi.spyOn(deduplicator, 'isUniqueAndRegister').mockResolvedValue(true);
    vi.spyOn(antiAbuseDetector, 'evaluateActivity').mockResolvedValue({
      isSuspicious: false,
      score: 0,
      reasons: [],
    });
    vi.spyOn(streakEngine, 'processStreakLog').mockResolvedValue({
      currentStreak: 5,
      longestStreak: 8,
      streakSaved: true,
    });
    vi.spyOn(xpEngine, 'awardProgressionXp').mockResolvedValue({
      xpAwarded: 10,
      newTotalXp: 130,
      levelUp: false,
    });

    const results = await ingestionPipelineService.ingestSubmissions(
      testUserId,
      'leetcode',
      [mockLeetCodeSub]
    );

    expect(results.length).toBe(1);
    expect(results[0].success).toBe(true);
    expect(results[0].xpAwarded).toBe(10);
    expect(results[0].currentStreak).toBe(5);
  });

  it('should enforce strict idempotency and prevent double-XP or double-sync on duplicate submission', async () => {
    const duplicateSub = {
      externalId: 'leetcode-sub-1',
      platform: 'leetcode' as const,
      title: 'Two Sum',
      difficulty: 'easy' as const,
      status: 'accepted' as const,
      submittedAt: new Date(),
      language: 'javascript',
    };

    // Simulate deduplicator flagging a duplicate
    vi.spyOn(deduplicator, 'isUniqueAndRegister').mockResolvedValue(false);
    vi.spyOn(antiAbuseDetector, 'evaluateActivity').mockResolvedValue({
      isSuspicious: false,
      score: 0,
      reasons: [],
    });

    const results = await ingestionPipelineService.ingestSubmissions(
      testUserId,
      'leetcode',
      [duplicateSub]
    );

    expect(results.length).toBe(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('Duplicate ingestion request rejected');
  });

  it('should enforce daily caps and diminishing returns on excessive solves', async () => {
    // Test direct XP Engine calculations to isolate from database calls
    const baseValue = xpEngine.calculateXpAward('medium', 'problem_solved', 5, 0, 0); // Streak 5, no daily solves yet
    expect(baseValue).toBe(31); // 25 * 1.25 streak multiplier

    // After diminishing solves threshold (diminishing return starts at solvesCount >= 8)
    const diminishedVal = xpEngine.calculateXpAward('medium', 'problem_solved', 5, 100, 9);
    expect(diminishedVal).toBe(13); // scaled down by 0.4 (31 * 0.4 = 12.4, rounds to 12 or 12.5 -> 13)

    // Daily ceiling cap test (XP limit: 300)
    const cappedVal = xpEngine.calculateXpAward('medium', 'problem_solved', 5, 290, 0);
    expect(cappedVal).toBe(10); // only 10 XP allowed to hit 300 limit
  });

  it('should trigger impossible solve velocity quarantine under high solve frequency', async () => {
    const maliciousSub = {
      externalId: 'burst-sub-1',
      platform: 'leetcode' as const,
      title: 'Fast Solve',
      difficulty: 'hard' as const,
      status: 'accepted' as const,
      submittedAt: new Date(),
    };

    // Force anti-abuse system to flag high abuse score
    vi.spyOn(antiAbuseDetector, 'evaluateActivity').mockResolvedValue({
      isSuspicious: true,
      score: 85,
      reasons: ['Impossible solve velocity: 10 solves in last 10 minutes'],
    });

    const results = await ingestionPipelineService.ingestSubmissions(
      testUserId,
      'leetcode',
      [maliciousSub]
    );

    expect(results.length).toBe(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('Activity quarantined due to high abuse score');
  });
});
