// src/modules/retention/achievements/achievement.service.ts — Achievement Engine service
// Phase-C2: Async badge evaluation, unlocking, and rarity balancing

import { Types } from 'mongoose';
import { Achievement, type IAchievement, type AchievementCategory, type AchievementRarity } from './achievement.model.js';
import { ACHIEVEMENT_TEMPLATES, getTemplateById, type AchievementTemplate, type AchievementCondition } from './achievement.templates.js';
import { UserAnalytics, UserXp } from '../../../db/models/index.js';
import { logger } from '../../../shared/logger.js';
import { eventBus } from '../../../shared/sse/index.js';
import { getXpProcessingQueue } from '../../../shared/jobs/index.js';
import { eventOrchestration } from '../orchestration/index.js';

export interface AchievementEvaluationResult {
  achievementId: string;
  unlocked: boolean;
  xpAwarded: number;
}

export interface RarityBreakdown {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

export const achievementService = {
  // ─── Evaluate achievements for a trigger event ─────────────────────────────
  async evaluateAchievements(
    userId: string,
    triggerType: 'streak' | 'problems' | 'xp' | 'level' | 'challenges' | 'goals' | 'special',
    triggerValue: number
  ): Promise<AchievementEvaluationResult[]> {
    const userObjId = new Types.ObjectId(userId);

    // Get user's current stats
    const [analytics, userXp, unlockedAchievements] = await Promise.all([
      UserAnalytics.findOne({ userId: userObjId }),
      UserXp.findOne({ userId: userObjId }),
      Achievement.find({ userId: userObjId }),
    ]);

    const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievementTemplateId));
    const results: AchievementEvaluationResult[] = [];

    // Find matching templates
    const matchingTemplates = ACHIEVEMENT_TEMPLATES.filter((template) => {
      // Skip if already unlocked
      if (unlockedIds.has(template.id)) return false;

      // Skip if condition type doesn't match
      if (template.condition.type !== triggerType) return false;

      // Check if user meets the condition
      if (!this.meetsCondition(template.condition, triggerValue)) return false;

      // Check prerequisites
      if (!this.prerequisitesMet(template.prerequisites, unlockedIds)) return false;

      return true;
    });

    // Unlock matching achievements
    for (const template of matchingTemplates) {
      const result = await this.unlockAchievement(userId, template);
      results.push(result);
    }

    return results;
  },

  // ─── Check if user meets achievement condition ───────────────────────────
  meetsCondition(condition: AchievementCondition, value: number): boolean {
    const { type, value: threshold, operator } = condition;

    // We use the triggerValue which should represent user's current stat
    switch (operator) {
      case 'gte':
        return value >= threshold;
      case 'eq':
        return value === threshold;
      case 'lte':
        return value <= threshold;
      default:
        return value >= threshold;
    }
  },

  // ─── Check if prerequisites are met ───────────────────────────────────────
  prerequisitesMet(prerequisites: string[], unlockedIds: Set<string>): boolean {
    if (prerequisites.length === 0) return true;
    return prerequisites.every((p) => unlockedIds.has(p));
  },

  // ─── Unlock an achievement ───────────────────────────────────────────────
  async unlockAchievement(userId: string, template: AchievementTemplate): Promise<AchievementEvaluationResult> {
    const userObjId = new Types.ObjectId(userId);

    // Check for duplicate (idempotency)
    const existing = await Achievement.findOne({
      userId: userObjId,
      achievementTemplateId: template.id,
    });

    if (existing) {
      return {
        achievementId: template.id,
        unlocked: false,
        xpAwarded: 0,
      };
    }

    // Create achievement record
    const achievement = await Achievement.create({
      userId: userObjId,
      achievementTemplateId: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      category: template.category,
      rarity: template.rarity,
      isHidden: template.isHidden,
      isPrestige: template.isPrestige,
      isSeasonal: false,
      unlockedAt: new Date(),
      xpReward: template.xpReward,
      prerequisites: template.prerequisites,
    });

    // Queue XP award
    if (template.xpReward > 0) {
      try {
        const queue = getXpProcessingQueue();
        await queue.add('achievement-unlocked', {
          userId,
          sourceType: 'achievement',
          sourceId: `achievement_${template.id}`,
          metadata: {
            achievementId: template.id,
            achievementName: template.name,
            rarity: template.rarity,
          },
        });
      } catch (err) {
        logger.warn('[achievements] Failed to queue XP award', { error: err, templateId: template.id });
      }
    }

    // Emit achievement unlocked event
    const event = eventOrchestration.createEvent(
      'achievement_unlocked',
      userId,
      {
        achievementId: template.id,
        achievementName: template.name,
        rarity: template.rarity,
        icon: template.icon,
        xpEarned: template.xpReward,
        isHidden: template.isHidden,
      },
      'system'
    );
    await eventOrchestration.handleEvent(event);

    // Emit SSE event
    eventBus.emitBadgeEarned(userId, template.id, template.name);

    logger.info('[achievements] Achievement unlocked', {
      userId,
      achievementId: template.id,
      name: template.name,
      rarity: template.rarity,
      xpReward: template.xpReward,
    });

    return {
      achievementId: template.id,
      unlocked: true,
      xpAwarded: template.xpReward,
    };
  },

  // ─── Get all unlocked achievements ────────────────────────────────────────
  async getUnlockedAchievements(userId: string): Promise<IAchievement[]> {
    return Achievement.find({ userId: new Types.ObjectId(userId) })
      .sort({ unlockedAt: -1 });
  },

  // ─── Get available (not yet unlocked) achievements ────────────────────────
  async getAvailableAchievements(userId: string): Promise<AchievementTemplate[]> {
    const userObjId = new Types.ObjectId(userId);

    const unlocked = await Achievement.find({ userId: userObjId });
    const unlockedIds = new Set(unlocked.map((a) => a.achievementTemplateId));

    return ACHIEVEMENT_TEMPLATES.filter((t) => !unlockedIds.has(t.id) && !t.isHidden);
  },

  // ─── Get hidden achievements for user ───────────────────────────────────
  async getHiddenAchievements(userId: string): Promise<AchievementTemplate[]> {
    const userObjId = new Types.ObjectId(userId);

    const unlocked = await Achievement.find({ userId: userObjId });
    const unlockedIds = new Set(unlocked.map((a) => a.achievementTemplateId));

    // Return hidden templates that are now revealed (unlocked)
    const hiddenTemplates = ACHIEVEMENT_TEMPLATES.filter((t) => t.isHidden);
    return hiddenTemplates.filter((t) => unlockedIds.has(t.id));
  },

  // ─── Get rarity distribution ───────────────────────────────────────────────
  async getRarityDistribution(userId: string): Promise<RarityBreakdown> {
    const achievements = await Achievement.find({ userId: new Types.ObjectId(userId) });

    const distribution: RarityBreakdown = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    for (const achievement of achievements) {
      if (achievement.rarity in distribution) {
        distribution[achievement.rarity as keyof RarityBreakdown]++;
      }
    }

    return distribution;
  },

  // ─── Evaluate all achievements for user (full scan) ───────────────────────
  async evaluateAllAchievements(userId: string): Promise<AchievementEvaluationResult[]> {
    const userObjId = new Types.ObjectId(userId);

    // Get user's current stats
    const [analytics, userXp] = await Promise.all([
      UserAnalytics.findOne({ userId: userObjId }),
      UserXp.findOne({ userId: userObjId }),
    ]);

    const stats = {
      streak: analytics?.currentStreak ?? 0,
      problems: analytics?.dsaSolveCount ?? userXp?.lifetimeStats?.totalProblemsSolved ?? 0,
      xp: userXp?.totalXp ?? 0,
      level: userXp?.currentLevel ?? 1,
      challenges: 0, // Would need challenge completion count
      goals: 0, // Would need goal completion count
    };

    // Evaluate all achievement types
    const allResults: AchievementEvaluationResult[] = [];

    for (const [type, value] of Object.entries(stats)) {
      if (value > 0) {
        const results = await this.evaluateAchievements(
          userId,
          type as 'streak' | 'problems' | 'xp' | 'level' | 'challenges' | 'goals' | 'special',
          value
        );
        allResults.push(...results);
      }
    }

    return allResults;
  },

  // ─── Rebuild achievements for replay ────────────────────────────────────
  async rebuildAchievementsForUser(userId: string): Promise<void> {
    logger.info('[achievements] Rebuild started for user', { userId });

    // Evaluate all achievements
    const results = await this.evaluateAllAchievements(userId);

    logger.info('[achievements] Rebuild completed', {
      userId,
      newlyUnlocked: results.filter((r) => r.unlocked).length,
    });
  },
};

export default achievementService;