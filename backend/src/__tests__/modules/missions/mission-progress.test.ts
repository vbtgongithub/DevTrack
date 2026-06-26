// src/__tests__/modules/missions/mission-progress.test.ts
// Unit tests for mission progress tracking — progress updates,
// activity-to-category mapping, difficulty filtering, and completion handling.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { updateMissionProgress, getUserMissions } from '../../../modules/missions/missionProgress.service.js';
import { Mission } from '../../../db/models/index.js';

// Mock XP processor
vi.mock('../../../modules/xp/processor.js', () => ({
  processXpEvent: vi.fn().mockResolvedValue({
    awarded: true,
    xpAwarded: 50,
    duplicate: false,
    levelBefore: 1,
    levelAfter: 1,
    leveledUp: false,
    newTotalXp: 50,
  }),
}));

vi.mock('../../../shared/sse/index.js', () => ({
  eventBus: {
    emitMissionProgress: vi.fn(),
    emitNotificationCreated: vi.fn(),
    emitXpUpdated: vi.fn(),
    emitLevelUp: vi.fn(),
  },
}));

describe('Mission Progress — updateMissionProgress', () => {
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  function createMission(overrides: Partial<{
    title: string;
    category: string;
    targetCount: number;
    currentCount: number;
    type: string;
    status: string;
    expiresAt: Date;
  }> = {}) {
    const future = new Date();
    future.setDate(future.getDate() + 7);

    return Mission.create({
      userId: new Types.ObjectId(userId),
      title: overrides.title ?? 'Solve 3 DSA problems',
      description: 'Solve any 3 DSA problems',
      type: overrides.type ?? 'daily',
      category: overrides.category ?? 'dsa',
      targetCount: overrides.targetCount ?? 3,
      currentCount: overrides.currentCount ?? 0,
      xpReward: 50,
      status: overrides.status ?? 'pending',
      expiresAt: overrides.expiresAt ?? future,
    });
  }

  it('should increment progress for matching DSA mission', async () => {
    await createMission({ title: 'Solve 3 DSA problems', category: 'dsa', targetCount: 3 });

    await updateMissionProgress(userId, 'dsa_solve', { difficulty: 'medium' });

    const mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(1);
    expect(mission!.status).toBe('in_progress');
  });

  it('should complete mission when target is reached', async () => {
    await createMission({ title: 'Solve 1 DSA problem', category: 'dsa', targetCount: 1 });

    await updateMissionProgress(userId, 'dsa_solve', { difficulty: 'easy' });

    const mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(1);
    expect(mission!.status).toBe('completed');
    expect(mission!.completedAt).not.toBeNull();
  });

  it('should not progress expired missions', async () => {
    const expired = new Date();
    expired.setDate(expired.getDate() - 1);

    await createMission({ title: 'Solve DSA', category: 'dsa', targetCount: 3, expiresAt: expired });

    await updateMissionProgress(userId, 'dsa_solve', { difficulty: 'easy' });

    const mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(0); // No progress
  });

  it('should filter by difficulty when mission title specifies it', async () => {
    await createMission({ title: 'Solve 2 hard problems', category: 'dsa', targetCount: 2 });

    // Easy should not count
    await updateMissionProgress(userId, 'dsa_solve', { difficulty: 'easy' });
    let mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(0);

    // Hard should count
    await updateMissionProgress(userId, 'dsa_solve', { difficulty: 'hard' });
    mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(1);
  });

  it('should progress contest missions for dsa_contest activity', async () => {
    await createMission({ title: 'Join a contest', category: 'dsa', targetCount: 1 });

    await updateMissionProgress(userId, 'dsa_contest');

    const mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(1);
  });

  it('should progress streak missions for streak_day activity', async () => {
    await createMission({ title: 'Maintain a 5-day streak', category: 'consistency', targetCount: 5 });

    await updateMissionProgress(userId, 'streak_day');

    const mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(1);
    expect(mission!.status).toBe('in_progress');
  });

  it('should progress project missions for project_task activity', async () => {
    await createMission({ title: 'Complete 3 project tasks', category: 'project', targetCount: 3 });

    await updateMissionProgress(userId, 'project_task');

    const mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(1);
  });

  it('should emit SSE event on progress update', async () => {
    const { eventBus } = await import('../../../shared/sse/index.js');
    await createMission({ title: 'Solve 5 DSA problems', category: 'dsa', targetCount: 5 });

    await updateMissionProgress(userId, 'dsa_solve', { difficulty: 'medium' });

    expect(eventBus.emitMissionProgress).toHaveBeenCalledWith(userId, expect.objectContaining({
      currentCount: 1,
      targetCount: 5,
      completed: false,
    }));
  });

  it('should award XP on mission completion', async () => {
    const { processXpEvent } = await import('../../../modules/xp/processor.js');
    await createMission({ title: 'Solve 1 DSA problem', category: 'dsa', targetCount: 1 });

    await updateMissionProgress(userId, 'dsa_solve', { difficulty: 'medium' });

    expect(processXpEvent).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      sourceType: 'manual',
      sourceId: expect.stringContaining('mission_'),
    }));
  });

  it('should not count completed missions', async () => {
    await createMission({ title: 'Solve 3 DSA problems', category: 'dsa', targetCount: 3, status: 'completed', currentCount: 3 });

    await updateMissionProgress(userId, 'dsa_solve', { difficulty: 'easy' });

    const mission = await Mission.findOne({ userId: new Types.ObjectId(userId) });
    expect(mission!.currentCount).toBe(3); // Unchanged
  });
});

describe('Mission Progress — getUserMissions', () => {
  const userId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should return empty array for user with no missions', async () => {
    const missions = await getUserMissions(userId);
    expect(missions).toEqual([]);
  });

  it('should return active missions with progress info', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);

    await Mission.create({
      userId: new Types.ObjectId(userId),
      title: 'Solve 5 problems',
      description: 'Complete 5 DSA problems',
      type: 'daily',
      category: 'dsa',
      targetCount: 5,
      currentCount: 2,
      xpReward: 100,
      status: 'in_progress',
      expiresAt: future,
    });

    const missions = await getUserMissions(userId);
    expect(missions.length).toBe(1);
    expect(missions[0].title).toBe('Solve 5 problems');
    expect(missions[0].currentCount).toBe(2);
    expect(missions[0].targetCount).toBe(5);
    expect(missions[0].progressPercent).toBe(40);
    expect(missions[0].xpReward).toBe(100);
  });

  it('should not return completed missions', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);

    await Mission.create({
      userId: new Types.ObjectId(userId),
      title: 'Completed mission',
      description: 'Already done',
      type: 'daily',
      category: 'dsa',
      targetCount: 1,
      currentCount: 1,
      xpReward: 50,
      status: 'completed',
      expiresAt: future,
      completedAt: new Date(),
    });

    const missions = await getUserMissions(userId);
    expect(missions.length).toBe(0);
  });

  it('should not return expired missions', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);

    await Mission.create({
      userId: new Types.ObjectId(userId),
      title: 'Expired mission',
      description: 'Too late',
      type: 'daily',
      category: 'dsa',
      targetCount: 3,
      currentCount: 1,
      xpReward: 50,
      status: 'in_progress',
      expiresAt: past,
    });

    const missions = await getUserMissions(userId);
    expect(missions.length).toBe(0);
  });
});
