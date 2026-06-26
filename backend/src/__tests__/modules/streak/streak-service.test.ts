// src/__tests__/modules/streak/streak-service.test.ts
// Unit tests for the streak service — activity recording, recalculation,
// deduplication, anti-cheat, and freeze mechanics.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { recordActivity, recalculateStreak, activateStreakFreeze, getStreakHistory } from '../../../modules/streak/streak.service.js';
import { UserStreakLog, UserAnalytics, User } from '../../../db/models/index.js';

// Mock non-DB dependencies
vi.mock('../../../shared/sse/index.js', () => ({
  eventBus: {
    emitStreakMilestone: vi.fn(),
    emitStreakAtRisk: vi.fn(),
  },
}));

vi.mock('../../../shared/jobs/index.js', () => ({
  getXpProcessingQueue: vi.fn().mockReturnValue({
    add: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock('../../../shared/cache/cacheManager.js', () => ({
  cacheManager: {
    invalidateUserStreak: vi.fn().mockResolvedValue(undefined),
    invalidateDashboard: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../modules/runtime-state/unifiedRuntimeState.service.js', () => ({
  unifiedRuntimeStateService: {
    updateFromEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Streak Service — recordActivity', () => {
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    vi.clearAllMocks();
    // Create a user doc so getUserTimezone can find it
    await User.create({ _id: new Types.ObjectId(userId), username: 'testuser', email: 'test@example.com', displayName: 'Test User', clerkId: `clerk_${userId}` });
  });

  it('should record a new activity and create a streak log', async () => {
    await recordActivity({
      userId,
      streakType: 'dsa',
      source: 'problem-123',
      activityDate: new Date(),
      timezone: 'UTC',
    });

    const logs = await UserStreakLog.find({ userId: new Types.ObjectId(userId) });
    expect(logs.length).toBe(1);
    expect(logs[0].sources).toContain('problem-123');
    expect(logs[0].activityCount).toBe(1);
    expect(logs[0].streakType).toBe('dsa');
  });

  it('should deduplicate same source on same day', async () => {
    const today = new Date();

    await recordActivity({
      userId,
      streakType: 'dsa',
      source: 'dup-source',
      activityDate: today,
      timezone: 'UTC',
    });

    await recordActivity({
      userId,
      streakType: 'dsa',
      source: 'dup-source',
      activityDate: today,
      timezone: 'UTC',
    });

    const logs = await UserStreakLog.find({ userId: new Types.ObjectId(userId) });
    expect(logs.length).toBe(1);
    expect(logs[0].activityCount).toBe(1); // Not incremented for duplicate source
  });

  it('should add multiple sources to same day', async () => {
    const today = new Date();

    await recordActivity({
      userId,
      streakType: 'dsa',
      source: 'source-a',
      activityDate: today,
      timezone: 'UTC',
    });

    await recordActivity({
      userId,
      streakType: 'dsa',
      source: 'source-b',
      activityDate: today,
      timezone: 'UTC',
    });

    const logs = await UserStreakLog.find({ userId: new Types.ObjectId(userId) });
    expect(logs.length).toBe(1);
    expect(logs[0].activityCount).toBe(2);
    expect(logs[0].sources).toContain('source-a');
    expect(logs[0].sources).toContain('source-b');
  });

  it('should reject activities older than 2 days (anti-cheat)', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await recordActivity({
      userId,
      streakType: 'dsa',
      source: 'old-activity',
      activityDate: threeDaysAgo,
      timezone: 'UTC',
    });

    const logs = await UserStreakLog.find({ userId: new Types.ObjectId(userId) });
    expect(logs.length).toBe(0); // Rejected
  });

  it('should accept activities within 2-day window', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await recordActivity({
      userId,
      streakType: 'dsa',
      source: 'yesterday-activity',
      activityDate: yesterday,
      timezone: 'UTC',
    });

    const logs = await UserStreakLog.find({ userId: new Types.ObjectId(userId) });
    expect(logs.length).toBe(1);
  });
});

describe('Streak Service — recalculateStreak', () => {
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    vi.clearAllMocks();
    await User.create({ _id: new Types.ObjectId(userId), username: 'testuser2', email: 'test2@example.com', displayName: 'Test User 2', clerkId: `clerk_${userId}` });
  });

  it('should return 0 streak when no logs exist', async () => {
    const status = await recalculateStreak(userId, 'dsa');

    expect(status.currentStreak).toBe(0);
    expect(status.isActiveToday).toBe(false);
    expect(status.lastActiveDate).toBeNull();
  });

  it('should calculate streak of 1 for a single day activity', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await UserStreakLog.create({
      userId: new Types.ObjectId(userId),
      date: today,
      streakType: 'dsa',
      activityCount: 1,
      sources: ['source-1'],
      timezone: 'UTC',
    });

    const status = await recalculateStreak(userId, 'dsa');
    expect(status.currentStreak).toBe(1);
    expect(status.isActiveToday).toBe(true);
  });

  it('should calculate consecutive day streaks correctly', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await UserStreakLog.insertMany([
      { userId: new Types.ObjectId(userId), date: today, streakType: 'dsa', activityCount: 1, sources: ['s1'], timezone: 'UTC' },
      { userId: new Types.ObjectId(userId), date: yesterday, streakType: 'dsa', activityCount: 1, sources: ['s2'], timezone: 'UTC' },
      { userId: new Types.ObjectId(userId), date: twoDaysAgo, streakType: 'dsa', activityCount: 1, sources: ['s3'], timezone: 'UTC' },
    ]);

    const status = await recalculateStreak(userId, 'dsa');
    expect(status.currentStreak).toBe(3);
    expect(status.isActiveToday).toBe(true);
  });

  it('should break streak on a gap day', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Active today and 3 days ago but not yesterday
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await UserStreakLog.insertMany([
      { userId: new Types.ObjectId(userId), date: today, streakType: 'dsa', activityCount: 1, sources: ['s1'], timezone: 'UTC' },
      { userId: new Types.ObjectId(userId), date: threeDaysAgo, streakType: 'dsa', activityCount: 1, sources: ['s2'], timezone: 'UTC' },
    ]);

    const status = await recalculateStreak(userId, 'dsa');
    expect(status.currentStreak).toBe(1); // Only today counts
  });

  it('should update bestStreak when current exceeds it', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Set an existing bestStreak of 1
    await UserAnalytics.create({
      userId: new Types.ObjectId(userId),
      bestStreak: 1,
      currentStreak: 1,
    });

    await UserStreakLog.insertMany([
      { userId: new Types.ObjectId(userId), date: today, streakType: 'dsa', activityCount: 1, sources: ['s1'], timezone: 'UTC' },
      { userId: new Types.ObjectId(userId), date: yesterday, streakType: 'dsa', activityCount: 1, sources: ['s2'], timezone: 'UTC' },
    ]);

    const status = await recalculateStreak(userId, 'dsa');
    expect(status.currentStreak).toBe(2);
    expect(status.bestStreak).toBe(2);
  });
});

describe('Streak Service — activateStreakFreeze', () => {
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    vi.clearAllMocks();
    await User.create({ _id: new Types.ObjectId(userId), username: 'testuser3', email: 'test3@example.com', displayName: 'Test User 3', clerkId: `clerk_${userId}` });
  });

  it('should set streakFreezeUntil in UserAnalytics', async () => {
    await activateStreakFreeze(userId);

    const analytics = await UserAnalytics.findOne({ userId: new Types.ObjectId(userId) });
    expect(analytics).not.toBeNull();
    expect(analytics!.streakFreezeUntil).not.toBeNull();
    // Freeze should be ~1 day from now
    const diff = analytics!.streakFreezeUntil!.getTime() - Date.now();
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000); // 1 day + 1s tolerance
  });
});

describe('Streak Service — getStreakHistory', () => {
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    vi.clearAllMocks();
    await User.create({ _id: new Types.ObjectId(userId), username: 'testuser4', email: 'test4@example.com', displayName: 'Test User 4', clerkId: `clerk_${userId}` });
  });

  it('should return 30-day history with empty days filled', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Create a log for today
    await UserStreakLog.create({
      userId: new Types.ObjectId(userId),
      date: today,
      streakType: 'dsa',
      activityCount: 2,
      sources: ['s1', 's2'],
      timezone: 'UTC',
    });

    const history = await getStreakHistory(userId);
    expect(history.length).toBeGreaterThanOrEqual(30);

    // Last entry should be today and active
    const todayEntry = history.find(h => h.date === today.toISOString().split('T')[0]);
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.active).toBe(true);
    expect(todayEntry!.count).toBe(2);

    // Most other entries should be inactive
    const inactiveDays = history.filter(h => !h.active);
    expect(inactiveDays.length).toBeGreaterThanOrEqual(29);
  });
});
