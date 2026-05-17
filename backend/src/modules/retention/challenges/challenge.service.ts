// src/modules/retention/challenges/challenge.service.ts — Challenge Engine service
// Phase-C2: Challenge lifecycle management and async evaluation

import { Types } from 'mongoose';
import { Challenge, type IChallenge, type ChallengeType } from './challenge.model.js';
import { challengeGenerator, type ChallengeAssignmentOptions } from './challenge.generator.js';
import { UserAnalytics, UserXp } from '../../../db/models/index.js';
import { logger } from '../../../shared/logger.js';
import { eventBus } from '../../../shared/sse/index.js';
import { getXpProcessingQueue } from '../../../shared/jobs/index.js';
import { eventOrchestration } from '../orchestration/index.js';
import { trustScoreEngine } from '../../anti-fraud/trustScore.js';

export interface ChallengeProgressSummary {
  active: IChallenge[];
  completed: number;
  totalXpEarned: number;
}

export interface ChallengeCompletionResult {
  challengeId: string;
  completed: boolean;
  xpAwarded: number;
  badgeEarned?: string;
}

export const challengeService = {
  // ─── Assign challenges to user ─────────────────────────────────────────
  async assignChallengesForUser(userId: string): Promise<IChallenge[]> {
    const userObjId = new Types.ObjectId(userId);

    // Get user stats for assignment
    const [analytics, userXp, recentChallenges, trustResult] = await Promise.all([
      UserAnalytics.findOne({ userId: userObjId }),
      UserXp.findOne({ userId: userObjId }),
      Challenge.find({ userId: userObjId, status: 'completed' }).sort({ completedAt: -1 }).limit(20),
      trustScoreEngine.calculateTrustScore(userId).catch(() => ({ score: 50 })),
    ]);

    const options: ChallengeAssignmentOptions = {
      userStreak: analytics?.currentStreak ?? 0,
      trustScore: trustResult.score,
      daysInactive: analytics?.lastActiveDate
        ? Math.floor((Date.now() - analytics.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30,
      recentCompletedChallenges: recentChallenges.map((c) => c.challengeTemplateId),
    };

    const assigned: IChallenge[] = [];

    // Check if daily challenges need assignment
    const activeDaily = await Challenge.countDocuments({
      userId: userObjId,
      type: 'daily',
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    if (activeDaily === 0) {
      const dailyTemplates = challengeGenerator.getDailyChallenges(options);
      for (const template of dailyTemplates) {
        const challenge = await this.createChallenge(userId, template);
        assigned.push(challenge);
      }
    }

    // Check if weekly challenges need assignment
    const activeWeekly = await Challenge.countDocuments({
      userId: userObjId,
      type: 'weekly',
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    if (activeWeekly === 0) {
      const weeklyTemplates = challengeGenerator.getWeeklyChallenges(options);
      for (const template of weeklyTemplates) {
        const challenge = await this.createChallenge(userId, template);
        assigned.push(challenge);
      }
    }

    // Check for comeback challenges
    if (options.daysInactive >= 3) {
      const activeComeback = await Challenge.countDocuments({
        userId: userObjId,
        type: 'comeback',
        status: 'active',
      });

      if (activeComeback === 0) {
        const comebackTemplates = challengeGenerator.getComebackChallenges(options);
        for (const template of comebackTemplates) {
          const challenge = await this.createChallenge(userId, template);
          assigned.push(challenge);
        }
      }
    }

    logger.info('[challenges] Challenges assigned', {
      userId,
      count: assigned.length,
      types: assigned.map((c) => c.type),
    });

    return assigned;
  },

  // Create a single challenge from template
  async createChallenge(
    userId: string,
    template: ReturnType<typeof challengeGenerator.getDailyChallenges>[0]
  ): Promise<IChallenge> {
    const userObjId = new Types.ObjectId(userId);

    // Get real trust score from trust score engine
    const trustResult = await trustScoreEngine.calculateTrustScore(userId);
    const trustScore = trustResult.score;

    const xpReward = challengeGenerator.calculateXpReward(template, trustScore);
    const expiresAt = challengeGenerator.calculateExpiration(template.type);

    const challenge = await Challenge.create({
      userId: userObjId,
      challengeTemplateId: template.id,
      type: template.type,
      title: template.title,
      description: template.description,
      category: template.category,
      targetValue: template.targetValue,
      currentValue: 0,
      rarity: template.rarity,
      xpReward,
      badgeReward: template.badgeReward,
      status: 'active',
      startedAt: new Date(),
      expiresAt,
      completedAt: null,
      completionCount: 0,
      trustScoreAtCreation: trustScore,
    });

    // Emit challenge started event
    const event = eventOrchestration.createEvent(
      'challenge_started',
      userId,
      {
        challengeId: challenge._id.toString(),
        challengeTitle: template.title,
        type: template.type,
        targetValue: template.targetValue,
      },
      'system'
    );
    await eventOrchestration.handleEvent(event);

    return challenge;
  },

  // ─── Update challenge progress ─────────────────────────────────────────
  async updateProgress(userId: string, category: string, delta: number): Promise<void> {
    const userObjId = new Types.ObjectId(userId);

    const activeChallenges = await Challenge.find({
      userId: userObjId,
      status: 'active',
      category: { $in: [category, 'mixed'] },
      expiresAt: { $gt: new Date() },
    });

    for (const challenge of activeChallenges) {
      const newValue = Math.min(challenge.currentValue + delta, challenge.targetValue);
      const wasComplete = challenge.currentValue >= challenge.targetValue;
      const nowComplete = newValue >= challenge.targetValue;

      challenge.currentValue = newValue;

      if (nowComplete && !wasComplete) {
        await this.completeChallenge(challenge);
      } else {
        await challenge.save();
      }
    }
  },

  // ─── Complete a challenge ───────────────────────────────────────────────
  async completeChallenge(challenge: IChallenge): Promise<ChallengeCompletionResult> {
    // Anti-farming: check completion count
    if (challenge.completionCount >= 1) {
      logger.warn('[challenges] Challenge completion rejected - already completed', {
        challengeId: challenge._id,
        completionCount: challenge.completionCount,
      });
      return {
        challengeId: challenge._id.toString(),
        completed: false,
        xpAwarded: 0,
      };
    }

    challenge.status = 'completed';
    challenge.completedAt = new Date();
    challenge.completionCount += 1;
    await challenge.save();

    // Queue XP award
    try {
      const queue = getXpProcessingQueue();
      await queue.add('challenge-completion', {
        userId: challenge.userId.toString(),
        sourceType: 'challenge_completed',
        sourceId: `challenge_${challenge._id}`,
        metadata: {
          challengeId: challenge._id.toString(),
          challengeType: challenge.type,
          category: challenge.category,
          badgeReward: challenge.badgeReward,
        },
      });
    } catch (err) {
      logger.warn('[challenges] Failed to queue XP award', { error: err, challengeId: challenge._id });
    }

    // Emit completion event
    const event = eventOrchestration.createEvent(
      'challenge_completed',
      challenge.userId.toString(),
      {
        challengeId: challenge._id.toString(),
        challengeTitle: challenge.title,
        type: challenge.type,
        rarity: challenge.rarity,
        xpEarned: challenge.xpReward,
        badgeEarned: challenge.badgeReward,
      },
      'system'
    );
    await eventOrchestration.handleEvent(event);

    logger.info('[challenges] Challenge completed', {
      userId: challenge.userId,
      challengeId: challenge._id,
      title: challenge.title,
      xpAwarded: challenge.xpReward,
      badgeEarned: challenge.badgeReward,
    });

    return {
      challengeId: challenge._id.toString(),
      completed: true,
      xpAwarded: challenge.xpReward,
      badgeEarned: challenge.badgeReward,
    };
  },

  // ─── Get active challenges ───────────────────────────────────────────────
  async getActiveChallenges(userId: string, type?: ChallengeType): Promise<IChallenge[]> {
    const userObjId = new Types.ObjectId(userId);
    const query: Record<string, unknown> = {
      userId: userObjId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    };

    if (type) {
      query.type = type;
    }

    return Challenge.find(query).sort({ expiresAt: 1 });
  },

  // ─── Get challenge progress ──────────────────────────────────────────────
  async getChallengeProgress(userId: string): Promise<ChallengeProgressSummary> {
    const userObjId = new Types.ObjectId(userId);

    const [active, completed] = await Promise.all([
      this.getActiveChallenges(userId),
      Challenge.countDocuments({ userId: userObjId, status: 'completed' }),
    ]);

    const completedChallenges = await Challenge.find({ userId: userObjId, status: 'completed' });
    const totalXpEarned = completedChallenges.reduce((sum, c) => sum + c.xpReward, 0);

    return {
      active,
      completed,
      totalXpEarned,
    };
  },

  // ─── Check and expire challenges ────────────────────────────────────────
  async expireOldChallenges(): Promise<number> {
    const result = await Challenge.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info('[challenges] Expired old challenges', { count: result.modifiedCount });
    }

    return result.modifiedCount;
  },

  // ─── Rebuild challenges for replay ───────────────────────────────────────
  async rebuildChallengesForUser(userId: string): Promise<void> {
    const userObjId = new Types.ObjectId(userId);

    // Clear expired challenges
    await Challenge.deleteMany({
      userId: userObjId,
      status: 'expired',
    });

    // Regenerate active challenges
    await this.assignChallengesForUser(userId);

    logger.info('[challenges] Challenges rebuilt for user', { userId });
  },
};

export default challengeService;