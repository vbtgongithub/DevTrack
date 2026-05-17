// src/modules/progression-orchestration/streakEngine.ts
// Timezone-safe streak calculation and preservation engine.
// Supports late-arriving submissions, automatic streak freezes, and unified streaks.

import { UserStreakLog } from '../../db/models/userStreakLog.model.js';
import { UnifiedRuntimeState } from '../../db/models/unifiedRuntimeState.model.js';
import { logger } from '../../shared/logger.js';
import type { CanonicalActivity } from './activityEvent.js';

export class StreakEngineClass {
  /**
   * Helper to normalize a date to midnight of the user's local timezone.
   */
  getLocalMidnight(dateInput: Date | string, timezone = 'UTC'): Date {
    const d = new Date(dateInput);
    // Format to local date string yyyy-mm-dd using internationalization API
    const localStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d); // returns "MM/DD/YYYY"

    const [month, day, year] = localStr.split('/');
    // Construct local midnight in UTC
    const localMidnight = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));
    return localMidnight;
  }

  /**
   * Updates user streak log for a given day and recalculates active streaks.
   */
  async processStreakLog(
    userId: string,
    activity: CanonicalActivity,
    userTimezone = 'Asia/Kolkata'
  ): Promise<{ currentStreak: number; longestStreak: number; streakSaved: boolean }> {
    const occurredAt = new Date(activity.audit.occurredAt);
    const localMidnight = this.getLocalMidnight(occurredAt, userTimezone);

    // Upsert streak log for the calendar day
    let streakLog = await UserStreakLog.findOne({
      userId,
      date: localMidnight,
      streakType: 'dsa',
    });

    let isNewLog = false;
    if (!streakLog) {
      isNewLog = true;
      streakLog = new UserStreakLog({
        userId,
        date: localMidnight,
        streakType: 'dsa',
        activityCount: 0,
        sources: [],
        timezone: userTimezone,
      });
    }

    // Append source and increment activity
    if (!streakLog.sources.includes(activity.activityId)) {
      streakLog.sources.push(activity.activityId);
      streakLog.activityCount += 1;
    }

    await streakLog.save();

    // Recalculate streak walking backwards from "today" in local timezone
    const nowLocalMidnight = this.getLocalMidnight(new Date(), userTimezone);
    const streakResult = await this.recalculateStreak(userId, nowLocalMidnight, userTimezone);

    // Update UnifiedRuntimeState aggregate
    let runtimeState = await UnifiedRuntimeState.findOne({ userId });
    if (!runtimeState) {
      runtimeState = new UnifiedRuntimeState({
        userId,
        xp: 0,
        level: 1,
        xpToNextLevel: 100,
        streak: 0,
        longestStreak: 0,
        lastEventId: activity.activityId,
        lastCalculatedAt: new Date(),
      });
    }

    const previousStreak = runtimeState.streak;
    runtimeState.streak = streakResult.currentStreak;
    if (streakResult.currentStreak > runtimeState.longestStreak) {
      runtimeState.longestStreak = streakResult.currentStreak;
    }
    runtimeState.lastCalculatedAt = new Date();

    await runtimeState.save();

    logger.info('[streak-engine] Streak processed', {
      userId,
      localMidnight: localMidnight.toISOString(),
      previousStreak,
      currentStreak: streakResult.currentStreak,
      longestStreak: runtimeState.longestStreak,
    });

    return {
      currentStreak: streakResult.currentStreak,
      longestStreak: runtimeState.longestStreak,
      streakSaved: isNewLog,
    };
  }

  /**
   * Recalculates streak walking backwards day-by-day.
   * Leverages freeze recovery when active days are missing.
   */
  async recalculateStreak(
    userId: string,
    anchorDate: Date,
    timezone: string
  ): Promise<{ currentStreak: number }> {
    // Retrieve last 60 streak logs to walk backward
    const logs = await UserStreakLog.find({
      userId,
      streakType: 'dsa',
    })
      .sort({ date: -1 })
      .limit(60);

    const activeDates = new Set(logs.map((l) => l.date.getTime()));

    let currentStreak = 0;
    let streakActive = true;
    let currentDate = new Date(anchorDate.getTime());
    let freezesRemaining = 2; // Default to 2 free freezes for resilience

    // Check if user solved today or yesterday to consider streak alive
    const todayTime = currentDate.getTime();
    const yesterdayTime = todayTime - 24 * 3600 * 1000;

    const hasActivityToday = activeDates.has(todayTime);
    const hasActivityYesterday = activeDates.has(yesterdayTime);

    if (!hasActivityToday && !hasActivityYesterday) {
      // Streak broken/dormant unless a freeze is applied to yesterday
      if (freezesRemaining > 0) {
        freezesRemaining--;
        // treated as active, proceed with calculation starting from yesterday
        currentDate.setTime(yesterdayTime);
      } else {
        return { currentStreak: 0 };
      }
    } else if (!hasActivityToday && hasActivityYesterday) {
      // Anchored to yesterday
      currentDate.setTime(yesterdayTime);
    }

    while (streakActive) {
      const timeVal = currentDate.getTime();
      if (activeDates.has(timeVal)) {
        currentStreak++;
      } else {
        // Missed day: try to consume a streak freeze
        if (freezesRemaining > 0) {
          freezesRemaining--;
          currentStreak++; // Streak continues
          logger.info('[streak-engine] Applied streak freeze auto-recovery', {
            userId,
            date: currentDate.toISOString(),
            freezesRemaining,
          });
        } else {
          streakActive = false;
        }
      }
      // Step back 1 day
      currentDate.setTime(currentDate.getTime() - 24 * 3600 * 1000);
    }

    return { currentStreak };
  }
}

export const streakEngine = new StreakEngineClass();
