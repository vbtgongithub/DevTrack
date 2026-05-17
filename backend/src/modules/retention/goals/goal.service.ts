// src/modules/retention/goals/goal.service.ts — Goal Engine service
// Phase-C1: Core progression loop - Goal management and evaluation

import { Types } from 'mongoose';
import { Goal, type IGoal, type GoalType, type GoalCategory } from './goal.model.js';
import { goalGenerator, type UserStats } from './goal.generator.js';
import { UserAnalytics, UserXp, User } from '../../../db/models/index.js';
import { logger } from '../../../shared/logger.js';
import { eventBus } from '../../../shared/sse/index.js';
import { getXpProcessingQueue } from '../../../shared/jobs/index.js';
import { trustScoreEngine } from '../../anti-fraud/trustScore.js';

export interface GoalProgressSummary {
  daily: IGoal[];
  weekly: IGoal[];
  totalCompleted: number;
  totalActive: number;
  totalXpEarned: number;
}

export interface GoalCompletionResult {
  goalId: string;
  completed: boolean;
  xpAwarded: number;
  streakBonusApplied: boolean;
  newTotalXp: number;
}

export const goalService = {
  // ─── Generate goals for user ─────────────────────────────────────────────
  async generateGoalsForUser(userId: string): Promise<IGoal[]> {
    const userObjId = new Types.ObjectId(userId);

    // Fetch user stats for goal generation
    const userStats = await this.getUserStats(userId);
    if (!userStats) {
      logger.warn('[goals] Cannot generate goals - user not found', { userId });
      return [];
    }

    // Generate daily goals
    const dailyTemplates = goalGenerator.generateDailyGoals(userStats);
    const dailyGoals = await Promise.all(
      dailyTemplates.map((template) => this.createGoal(userId, 'daily', template))
    );

    // Generate weekly goals (if none exist)
    const existingWeekly = await Goal.findOne({
      userId: userObjId,
      type: 'weekly',
      status: 'active',
    });

    if (!existingWeekly) {
      const weeklyTemplates = goalGenerator.generateWeeklyGoals(userStats);
      const weeklyGoals = await Promise.all(
        weeklyTemplates.map((template) => this.createGoal(userId, 'weekly', template))
      );
      return [...dailyGoals, ...weeklyGoals];
    }

    return dailyGoals;
  },

  // Create a single goal from template
  async createGoal(
    userId: string,
    type: GoalType,
    template: ReturnType<typeof goalGenerator.generateDailyGoals>[0]
  ): Promise<IGoal> {
    const userObjId = new Types.ObjectId(userId);

    // Get user's current trust score from trust score engine
    const trustResult = await trustScoreEngine.calculateTrustScore(userId);
    const trustScore = trustResult.score;

    // Calculate XP reward with trust scaling
    const xpReward = goalGenerator.calculateXpReward(
      template.baseXp,
      trustScore,
      template.difficulty
    );

    // Calculate expiration
    const expiresAt = goalGenerator.calculateExpiration(type);

    const goal = await Goal.create({
      userId: userObjId,
      type,
      category: template.category,
      targetValue: template.targetValue,
      currentValue: 0,
      title: template.title,
      description: template.description,
      difficulty: template.difficulty,
      xpReward,
      streakBonus: template.isStreakLinked,
      status: 'active',
      startedAt: new Date(),
      expiresAt,
      completedAt: null,
      isStreakLinked: template.isStreakLinked,
      isMomentumSensitive: template.isMomentumSensitive,
      trustScoreAtCreation: trustScore,
      completionCount: 0,
    });

    logger.info('[goals] Goal created', {
      userId,
      goalId: goal._id,
      type,
      category: template.category,
      targetValue: template.targetValue,
      xpReward,
    });

    return goal;
  },

  // ─── Update goal progress ───────────────────────────────────────────────
  async updateProgress(userId: string, category: GoalCategory, delta: number): Promise<void> {
    const userObjId = new Types.ObjectId(userId);

    // Get all active goals for this category
    const activeGoals = await Goal.find({
      userId: userObjId,
      status: 'active',
      category: { $in: [category, 'mixed'] },
      expiresAt: { $gt: new Date() },
    });

    for (const goal of activeGoals) {
      const newValue = Math.min(goal.currentValue + delta, goal.targetValue);
      const wasComplete = goal.currentValue >= goal.targetValue;
      const nowComplete = newValue >= goal.targetValue;

      goal.currentValue = newValue;

      // Check for completion
      if (nowComplete && !wasComplete) {
        await this.completeGoal(goal);
      } else {
        await goal.save();
      }

      // Emit progress update via SSE
      eventBus.publish(
        {
          type: 'goal_progress' as any,
          timestamp: new Date().toISOString(),
          userId,
          stats: {
            goalId: goal._id.toString(),
            currentValue: newValue,
            targetValue: goal.targetValue,
            progress: Math.round((newValue / goal.targetValue) * 100),
          },
        } as any,
        userId
      );
    }
  },

  // ─── Complete a goal ─────────────────────────────────────────────────────
  async completeGoal(goal: IGoal): Promise<GoalCompletionResult> {
    goal.status = 'completed';
    goal.completedAt = new Date();
    goal.completionCount += 1;
    await goal.save();

    // Calculate streak bonus
    const analytics = await UserAnalytics.findOne({ userId: goal.userId });
    const streakBonus = goal.isStreakLinked && analytics && analytics.currentStreak >= 3;
    const totalXp = goal.xpReward + (streakBonus ? Math.floor(goal.xpReward * 0.5) : 0);

    // Queue XP award
    try {
      const queue = getXpProcessingQueue();
      await queue.add('goal-completion', {
        userId: goal.userId.toString(),
        sourceType: 'goal_completed',
        sourceId: `goal_${goal._id}`,
        metadata: {
          goalId: goal._id.toString(),
          goalType: goal.type,
          category: goal.category,
          streakBonus: !!streakBonus,
        },
      });
    } catch (err) {
      logger.warn('[goals] Failed to queue XP award', { error: err, goalId: goal._id });
    }

    // Emit completion event via SSE
    eventBus.publish(
      {
        type: 'goal_completed' as any,
        timestamp: new Date().toISOString(),
        userId: goal.userId.toString(),
        stats: {
          goalId: goal._id.toString(),
          goalTitle: goal.title,
          xpEarned: totalXp,
          streakBonus: !!streakBonus,
        },
      } as any,
      goal.userId.toString()
    );

    logger.info('[goals] Goal completed', {
      userId: goal.userId,
      goalId: goal._id,
      title: goal.title,
      xpAwarded: totalXp,
      streakBonus: !!streakBonus,
    });

    return {
      goalId: goal._id.toString(),
      completed: true,
      xpAwarded: totalXp,
      streakBonusApplied: !!streakBonus,
      newTotalXp: 0, // Would be updated by XP processor
    };
  },

  // ─── Get active goals ───────────────────────────────────────────────────
  async getActiveGoals(userId: string, type?: GoalType): Promise<IGoal[]> {
    const userObjId = new Types.ObjectId(userId);
    const query: Record<string, unknown> = {
      userId: userObjId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    };

    if (type) {
      query.type = type;
    }

    return Goal.find(query).sort({ expiresAt: 1 });
  },

  // ─── Get goal progress summary ───────────────────────────────────────────
  async getGoalProgress(userId: string): Promise<GoalProgressSummary> {
    const userObjId = new Types.ObjectId(userId);

    const [daily, weekly, completed, active] = await Promise.all([
      this.getActiveGoals(userId, 'daily'),
      this.getActiveGoals(userId, 'weekly'),
      Goal.countDocuments({ userId: userObjId, status: 'completed' }),
      Goal.countDocuments({ userId: userObjId, status: 'active' }),
    ]);

    // Calculate total XP earned from completed goals
    const completedGoals = await Goal.find({ userId: userObjId, status: 'completed' });
    const totalXpEarned = completedGoals.reduce((sum, g) => sum + g.xpReward, 0);

    return {
      daily,
      weekly,
      totalCompleted: completed,
      totalActive: active,
      totalXpEarned,
    };
  },

  // ─── Check and expire goals ─────────────────────────────────────────────
  async expireOldGoals(): Promise<number> {
    const result = await Goal.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info('[goals] Expired old goals', { count: result.modifiedCount });
    }

    return result.modifiedCount;
  },

  // ─── Get user stats for goal generation ─────────────────────────────────
  async getUserStats(userId: string): Promise<UserStats | null> {
    const [analytics, userXp] = await Promise.all([
      UserAnalytics.findOne({ userId: new Types.ObjectId(userId) }),
      UserXp.findOne({ userId: new Types.ObjectId(userId) }),
    ]);

    if (!analytics && !userXp) {
      return null;
    }

    // Get recent goal difficulties
    const recentGoals = await Goal.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10);

    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    const recentDifficulties = recentGoals
      .filter((g) => g.status === 'completed')
      .map((g) => difficultyMap[g.difficulty]);

    // Calculate completion rate
    const totalGoals = recentGoals.length;
    const completedGoals = recentGoals.filter((g) => g.status === 'completed').length;
    const completionRate = totalGoals > 0 ? completedGoals / totalGoals : 0.5;

    return {
      trustScore: 100, // Would come from trust service
      currentStreak: analytics?.currentStreak ?? 0,
      totalXp: userXp?.totalXp ?? 0,
      currentLevel: userXp?.currentLevel ?? 1,
      dsaSolveCount: analytics?.dsaSolveCount ?? 0,
      weeklyConsistencyScore: analytics?.weeklyConsistencyScore ?? 0,
      avgGoalCompletionRate: completionRate,
      recentGoalDifficulties: recentDifficulties,
      weeklyXpHistory: analytics?.weeklyXPHistory ?? [],
    };
  },

  // ─── Rebuild goals for replay ───────────────────────────────────────────
  async rebuildGoalsForUser(userId: string): Promise<void> {
    const userObjId = new Types.ObjectId(userId);

    // Clear expired goals
    await Goal.deleteMany({
      userId: userObjId,
      status: 'expired',
    });

    // Regenerate active goals
    const activeDaily = await Goal.countDocuments({
      userId: userObjId,
      type: 'daily',
      status: 'active',
    });

    const activeWeekly = await Goal.countDocuments({
      userId: userObjId,
      type: 'weekly',
      status: 'active',
    });

    // Regenerate if missing
    if (activeDaily === 0 || activeWeekly === 0) {
      await this.generateGoalsForUser(userId);
    }

    logger.info('[goals] Goals rebuilt for user', { userId, activeDaily, activeWeekly });
  },
};

export default goalService;