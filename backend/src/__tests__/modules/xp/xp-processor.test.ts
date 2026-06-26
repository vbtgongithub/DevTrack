// src/__tests__/modules/xp/xp-processor.test.ts
// Integration-style unit tests for the XP processor with in-memory MongoDB.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { processXpEvent, processMilestoneXp, getUserXp } from '../../../modules/xp/processor.js';
import { UserXp, XpTransaction } from '../../../db/models/index.js';

// Mock non-DB dependencies that the processor calls
vi.mock('../../../shared/sse/index.js', () => ({
  eventBus: {
    emitXpUpdated: vi.fn(),
    emitLevelUp: vi.fn(),
  },
}));

vi.mock('../../../modules/missions/missionProgress.service.js', () => ({
  updateMissionProgress: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../shared/cache/cacheManager.js', () => ({
  cacheManager: {
    invalidateAllUserCache: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../modules/runtime-state/unifiedRuntimeState.service.js', () => ({
  unifiedRuntimeStateService: {
    updateFromEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('XP Processor — processXpEvent', () => {
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should award XP for a dsa_accepted event (easy)', async () => {
    const result = await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'problem-1',
      difficulty: 'easy',
    });

    expect(result.awarded).toBe(true);
    expect(result.xpAwarded).toBe(10); // easy = 10 XP
    expect(result.duplicate).toBe(false);
    expect(result.levelBefore).toBe(1);
    expect(result.levelAfter).toBe(1);
    expect(result.newTotalXp).toBe(10);
  });

  it('should award correct XP for medium difficulty', async () => {
    const result = await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'problem-2',
      difficulty: 'medium',
    });

    expect(result.awarded).toBe(true);
    expect(result.xpAwarded).toBe(25); // medium = 25 XP
  });

  it('should award correct XP for hard difficulty', async () => {
    const result = await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'problem-3',
      difficulty: 'hard',
    });

    expect(result.awarded).toBe(true);
    expect(result.xpAwarded).toBe(50); // hard = 50 XP
  });

  it('should reject duplicate XP events (idempotency)', async () => {
    // Award once
    await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'dup-problem',
      difficulty: 'easy',
    });

    // Try to award again
    const result = await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'dup-problem',
      difficulty: 'easy',
    });

    expect(result.awarded).toBe(false);
    expect(result.duplicate).toBe(true);
    expect(result.xpAwarded).toBe(0);
  });

  it('should accumulate XP across multiple events', async () => {
    await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'acc-1',
      difficulty: 'hard',
    });

    const result = await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'acc-2',
      difficulty: 'hard',
    });

    expect(result.newTotalXp).toBe(100); // 50 + 50
    expect(result.levelAfter).toBe(2); // 100 XP reaches level 2
    expect(result.leveledUp).toBe(true);
  });

  it('should award contest XP', async () => {
    const result = await processXpEvent({
      userId,
      sourceType: 'dsa_contest',
      sourceId: 'contest-1',
    });

    expect(result.awarded).toBe(true);
    expect(result.xpAwarded).toBe(40); // contestParticipated = 40
  });

  it('should award daily streak XP', async () => {
    const result = await processXpEvent({
      userId,
      sourceType: 'daily_streak',
      sourceId: 'streak-day-5',
    });

    expect(result.awarded).toBe(true);
    expect(result.xpAwarded).toBe(15); // dailyStreak = 15
  });

  it('should award sync XP', async () => {
    const result = await processXpEvent({
      userId,
      sourceType: 'sync_completed',
      sourceId: 'sync-1',
    });

    expect(result.awarded).toBe(true);
    expect(result.xpAwarded).toBe(5); // syncCompleted = 5
  });

  it('should award challenge XP from metadata', async () => {
    const result = await processXpEvent({
      userId,
      sourceType: 'challenge_completed',
      sourceId: 'challenge-1',
      metadata: { xpReward: 100 },
    });

    expect(result.awarded).toBe(true);
    expect(result.xpAwarded).toBe(100);
  });

  it('should use default challenge XP when metadata has no xpReward', async () => {
    const result = await processXpEvent({
      userId,
      sourceType: 'challenge_completed',
      sourceId: 'challenge-2',
    });

    expect(result.awarded).toBe(true);
    expect(result.xpAwarded).toBe(35); // default challenge reward
  });

  it('should create UserXp record if it does not exist', async () => {
    const newUserId = new Types.ObjectId().toHexString();
    const before = await UserXp.findOne({ userId: new Types.ObjectId(newUserId) });
    expect(before).toBeNull();

    await processXpEvent({
      userId: newUserId,
      sourceType: 'dsa_accepted',
      sourceId: 'first-solve',
      difficulty: 'easy',
    });

    const after = await UserXp.findOne({ userId: new Types.ObjectId(newUserId) });
    expect(after).not.toBeNull();
    expect(after!.totalXp).toBe(10);
  });

  it('should detect level-up correctly', async () => {
    // Get user to 90 XP first (need 100 for level 2)
    await processXpEvent({ userId, sourceType: 'dsa_accepted', sourceId: 'p1', difficulty: 'hard' }); // 50
    await processXpEvent({ userId, sourceType: 'dsa_contest', sourceId: 'c1' }); // 40 => total 90

    // This should level up
    const result = await processXpEvent({ userId, sourceType: 'dsa_accepted', sourceId: 'p2', difficulty: 'easy' }); // 10 => total 100

    expect(result.leveledUp).toBe(true);
    expect(result.levelBefore).toBe(1);
    expect(result.levelAfter).toBe(2);
    expect(result.newTotalXp).toBe(100);
  });

  it('should update lifetime stats for dsa_accepted', async () => {
    await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'stats-problem',
      difficulty: 'medium',
    });

    const userXp = await UserXp.findOne({ userId: new Types.ObjectId(userId) });
    expect(userXp!.lifetimeStats.totalProblemsSolved).toBe(1);
    expect(userXp!.lifetimeStats.mediumSolved).toBe(1);
  });

  it('should emit XP updated event', async () => {
    const { eventBus } = await import('../../../shared/sse/index.js');

    await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'emit-test',
      difficulty: 'easy',
    });

    expect(eventBus.emitXpUpdated).toHaveBeenCalledWith(
      userId,
      10, // newTotalXp
      10, // xpAwarded
      1,  // levelAfter
      expect.any(Number) // xpToNextLevel
    );
  });
});

describe('XP Processor — processMilestoneXp', () => {
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should not award milestone XP for less than 10 problems', async () => {
    await processMilestoneXp(userId, 5);
    const userXp = await UserXp.findOne({ userId: new Types.ObjectId(userId) });
    expect(userXp).toBeNull();
  });

  it('should award 25 XP milestone for 10 problems solved', async () => {
    // Seed a UserXp record
    await UserXp.create({ userId: new Types.ObjectId(userId) });
    await processMilestoneXp(userId, 10);

    const userXp = await UserXp.findOne({ userId: new Types.ObjectId(userId) });
    expect(userXp!.totalXp).toBe(25);
  });

  it('should be idempotent — no double milestone awards', async () => {
    await UserXp.create({ userId: new Types.ObjectId(userId) });
    await processMilestoneXp(userId, 10);
    await processMilestoneXp(userId, 10);

    const userXp = await UserXp.findOne({ userId: new Types.ObjectId(userId) });
    expect(userXp!.totalXp).toBe(25); // Only one award
  });
});

describe('XP Processor — getUserXp', () => {
  const userId = new Types.ObjectId().toHexString();

  it('should return null for nonexistent user', async () => {
    const result = await getUserXp(new Types.ObjectId().toHexString());
    expect(result).toBeNull();
  });

  it('should return XP summary after processing events', async () => {
    await processXpEvent({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: 'fetch-test-1',
      difficulty: 'medium',
    });

    const result = await getUserXp(userId);
    expect(result).not.toBeNull();
    expect(result!.totalXp).toBe(25);
    expect(result!.currentLevel).toBe(1);
    expect(result!.progressPercent).toBeGreaterThan(0);
  });
});
