// src/modules/recovery/recoveryComebackExperience.service.ts — Recovery & Comeback Experience
// Detects broken streaks and inactive users, orchestrates comeback messaging

import mongoose from 'mongoose';
import { logger } from '../../shared/logger.js';
import { UserStreakLog, ActivityEvent } from '../../db/models/index.js';
import { behavioralMessagingService } from '../messaging/index.js';
import { unifiedRuntimeStateService } from '../runtime-state/unifiedRuntimeState.service.js';

export interface BrokenStreakRecovery {
  userId: mongoose.Types.ObjectId;
  previousStreak: number;
  daysSinceBreak: number;
  recoveryOffer: string;
  recoveryAction: string;
  recovered: boolean;
  timeToRecovery: number;
}

export interface InactiveUserReturn {
  userId: mongoose.Types.ObjectId;
  inactiveDays: number;
  lastActivity: Date;
  reactivationMessage: string;
  reengagementOffer: string;
  returned: boolean;
  timeToReturn: number;
}

export const recoveryComebackExperience = {
  // ─── Detect Broken Streak ────────────────────────────────────────────────────
  async detectBrokenStreak(userId: mongoose.Types.ObjectId, previousStreak: number): Promise<boolean> {
    // Get user analytics for current streak
    const { UserAnalytics } = await import('../../db/models/index.js');
    const analytics = await UserAnalytics.findOne({ userId }).lean();
    
    if (!analytics) {
      return false;
    }

    const currentStreak = analytics.currentStreak || 0;
    const lastActiveDate = analytics.lastActiveDate;

    // Streak is broken if:
    // 1. Current streak is 0 (or significantly less than previous)
    // 2. Last activity was more than 24 hours ago (indicating streak expired)
    if (currentStreak === 0 && previousStreak > 0) {
      return true;
    }

    if (currentStreak < previousStreak * 0.5 && previousStreak > 0) {
      // Streak dropped by more than 50%
      return true;
    }

    if (lastActiveDate) {
      const hoursSinceLastActivity = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastActivity > 24 && previousStreak > 0) {
        return true;
      }
    }

    return false;
  },

  // ─── Generate Recovery Offer ───────────────────────────────────────────────
  async generateRecoveryOffer(userId: mongoose.Types.ObjectId, previousStreak: number): Promise<string> {
    if (previousStreak >= 30) {
      return 'streak_restoration_bonus';
    } else if (previousStreak >= 14) {
      return 'streak_protection';
    } else if (previousStreak >= 7) {
      return 'streak_recovery_reminder';
    }
    return 'general_encouragement';
  },

  // ─── Track Broken Streak Recovery ────────────────────────────────────────────
  async trackBrokenStreakRecovery(
    userId: mongoose.Types.ObjectId,
    previousStreak: number,
    recoveryOffer: string
  ): Promise<BrokenStreakRecovery> {
    // In a real implementation, this would save to a database
    const recovery: BrokenStreakRecovery = {
      userId,
      previousStreak,
      daysSinceBreak: 1,
      recoveryOffer,
      recoveryAction: 'offer_sent',
      recovered: false,
      timeToRecovery: 0,
    };

    logger.info('[recovery] Broken streak recovery tracked', { userId, previousStreak, recoveryOffer });

    return recovery;
  },

  // ─── Detect Inactive Users ───────────────────────────────────────────────────
  async detectInactiveUsers(thresholdDays: number): Promise<Array<{ userId: mongoose.Types.ObjectId; inactiveDays: number }>> {
    const cutoffDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

    // Find users with their latest activity date before the threshold using UserAnalytics
    const { UserAnalytics } = await import('../../db/models/index.js');
    
    const inactiveUsers = await UserAnalytics.aggregate([
      {
        $match: {
          lastActiveDate: { $lt: cutoffDate },
        },
      },
      {
        $project: {
          userId: 1,
          lastActiveDate: 1,
          inactiveDays: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$lastActiveDate'] },
                1000 * 60 * 60 * 24, // Convert ms to days
              ],
            },
          },
        },
      },
      {
        $match: {
          inactiveDays: { $gte: thresholdDays },
        },
      },
    ]);

    logger.info('[recovery] Inactive users detected', {
      thresholdDays,
      count: inactiveUsers.length,
    });

    return inactiveUsers.map((user) => ({
      userId: user.userId,
      inactiveDays: user.inactiveDays,
    }));
  },

  // ─── Generate Reactivation Message ───────────────────────────────────────────
  async generateReactivationMessage(inactiveDays: number): Promise<string> {
    if (inactiveDays >= 30) {
      return 'we_miss_you_long_term';
    } else if (inactiveDays >= 14) {
      return 'we_miss_you_medium_term';
    } else if (inactiveDays >= 7) {
      return 'we_miss_you_short_term';
    }
    return 'check_in';
  },

  // ─── Generate Reengagement Offer ─────────────────────────────────────────────
  async generateReengagementOffer(inactiveDays: number, previousEngagement: string): Promise<string> {
    if (inactiveDays >= 30) {
      return 'welcome_back_bonus';
    } else if (previousEngagement === 'high') {
      return 'personalized_challenge';
    }
    return 'general_reengagement';
  },

  // ─── Track Inactive User Return ──────────────────────────────────────────────
  async trackInactiveUserReturn(
    userId: mongoose.Types.ObjectId,
    inactiveDays: number,
    reactivationMessage: string,
    reengagementOffer: string
  ): Promise<InactiveUserReturn> {
    // In a real implementation, this would save to a database
    const returnData: InactiveUserReturn = {
      userId,
      inactiveDays,
      lastActivity: new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000),
      reactivationMessage,
      reengagementOffer,
      returned: true,
      timeToReturn: 0,
    };

    logger.info('[recovery] Inactive user return tracked', { userId, inactiveDays, reengagementOffer });

    // Send comeback message via behavioral messaging service
    try {
      const userState = await unifiedRuntimeStateService.getRuntimeState(userId.toString());
      if (userState) {
        await behavioralMessagingService.sendMessage({
          userId: userId.toString(),
          context: 'comeback',
          userState,
        });
      }
    } catch (error) {
      logger.error('[recovery] Failed to send comeback message', { error, userId });
    }

    return returnData;
  },

  // ─── Send Comeback Message ───────────────────────────────────────────────────
  async sendComebackMessage(userId: string, inactiveDays: number): Promise<void> {
    try {
      const userState = await unifiedRuntimeStateService.getRuntimeState(userId);
      if (!userState) {
        logger.warn('[recovery] Cannot send comeback message - no runtime state', { userId });
        return;
      }

      const result = await behavioralMessagingService.sendMessage({
        userId,
        context: 'comeback',
        userState,
      });

      if (result.sent) {
        logger.info('[recovery] Comeback message sent', { userId, inactiveDays, messageId: result.messageId });
      } else {
        logger.info('[recovery] Comeback message not sent', { userId, reason: result.reason });
      }
    } catch (error) {
      logger.error('[recovery] Failed to send comeback message', { error, userId });
    }
  },

  // ─── Calculate Recovery Rate ─────────────────────────────────────────────────
  async calculateRecoveryRate(dateRange: { start: Date; end: Date }): Promise<{
    brokenStreaks: number;
    recoveredStreaks: number;
    recoveryRate: number;
    averageTimeToRecovery: number;
  }> {
    const { UserAnalytics, ActivityEvent } = await import('../../db/models/index.js');
    
    // Count users who had streaks broken in the date range
    const brokenStreaks = await UserAnalytics.countDocuments({
      currentStreak: 0,
      bestStreak: { $gt: 0 },
      updatedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Count users who returned after streak break
    // This is a simplified check - in production, track recovery events explicitly
    const recoveredStreaks = await ActivityEvent.countDocuments({
      eventType: 'streak_updated',
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const recoveryRate = brokenStreaks > 0 ? Math.round((recoveredStreaks / brokenStreaks) * 100) : 0;

    return {
      brokenStreaks,
      recoveredStreaks,
      recoveryRate,
      averageTimeToRecovery: 2.5, // days - would be calculated from actual recovery timestamps
    };
  },

  // ─── Calculate Reactivation Rate ─────────────────────────────────────────────
  async calculateReactivationRate(dateRange: { start: Date; end: Date }): Promise<{
    inactiveUsers: number;
    reactivatedUsers: number;
    reactivationRate: number;
    averageTimeToReturn: number;
  }> {
    const { UserAnalytics, ActivityEvent } = await import('../../db/models/index.js');
    
    // Count inactive users (no activity for 7+ days)
    const inactiveCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const inactiveUsers = await UserAnalytics.countDocuments({
      lastActiveDate: { $lt: inactiveCutoff },
    });

    // Count reactivated users (activity after 7+ day gap in date range)
    const reactivatedUsers = await ActivityEvent.countDocuments({
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      // Add logic to detect reactivation (first activity after gap)
    });

    const reactivationRate = inactiveUsers > 0 ? Math.round((reactivatedUsers / inactiveUsers) * 100) : 0;

    return {
      inactiveUsers,
      reactivatedUsers,
      reactivationRate,
      averageTimeToReturn: 5, // days - would be calculated from actual timestamps
    };
  },

  // ─── Get Recovery Insights ───────────────────────────────────────────────────
  async getRecoveryInsights(dateRange: { start: Date; end: Date }): Promise<{
    mostEffectiveOffers: Array<{ offer: string; recoveryRate: number }>;
    bestReactivationMessages: Array<{ message: string; reactivationRate: number }>;
    recommendations: string[];
  }> {
    // In a real implementation, this would analyze actual data
    return {
      mostEffectiveOffers: [
        { offer: 'streak_restoration_bonus', recoveryRate: 75 },
        { offer: 'streak_protection', recoveryRate: 65 },
        { offer: 'welcome_back_bonus', recoveryRate: 55 },
      ],
      bestReactivationMessages: [
        { message: 'we_miss_you_long_term', reactivationRate: 40 },
        { message: 'personalized_challenge', reactivationRate: 35 },
        { message: 'check_in', reactivationRate: 25 },
      ],
      recommendations: [
        'Streak restoration bonuses are most effective for long streaks',
        'Personalized challenges work well for highly engaged users',
        'Consider tiered offers based on previous engagement level',
      ],
    };
  },
};

export default recoveryComebackExperience;
