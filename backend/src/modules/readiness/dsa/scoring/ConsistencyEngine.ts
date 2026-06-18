import { ConsistencyScoreInput } from '../types/dsa.types';

export class ConsistencyEngine {
  /**
   * Calculate consistency score based on:
   * - Current streak
   * - Last 30 days activity
   * - Solve frequency
   * 
   * Returns a score between 0-100
   */
  calculateConsistencyScore(input: ConsistencyScoreInput): number {
    const { currentStreak, longestStreak, lastSolvedDate, totalSolved } = input;

    // 1. Current Streak Score (40% weight)
    const streakScore = this.calculateStreakScore(currentStreak, longestStreak);

    // 2. Recent Activity Score (35% weight)
    const activityScore = this.calculateRecentActivityScore(lastSolvedDate);

    // 3. Solve Frequency Score (25% weight)
    const frequencyScore = this.calculateFrequencyScore(totalSolved, lastSolvedDate);

    // Weighted aggregation
    const totalScore = 
      (streakScore * 0.4) +
      (activityScore * 0.35) +
      (frequencyScore * 0.25);

    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  /**
   * Calculate streak score
   * Rewards consistent daily activity
   */
  private calculateStreakScore(currentStreak: number, longestStreak: number): number {
    if (currentStreak === 0) return 0;

    // Base score from current streak (max 70 points)
    const streakScore = Math.min(70, currentStreak * 5);

    // Bonus for maintaining long streaks (max 30 points)
    const streakRatio = currentStreak / (longestStreak || 1);
    const consistencyBonus = Math.min(30, streakRatio * 30);

    return streakScore + consistencyBonus;
  }

  /**
   * Calculate recent activity score
   * Based on how recently the user solved problems
   */
  private calculateRecentActivityScore(lastSolvedDate: Date | null): number {
    if (!lastSolvedDate) return 0;

    const now = new Date();
    const daysSinceLastSolve = Math.floor((now.getTime() - lastSolvedDate.getTime()) / (1000 * 60 * 60 * 24));

    // Score decreases as days since last solve increases
    if (daysSinceLastSolve === 0) return 100; // Solved today
    if (daysSinceLastSolve === 1) return 90;  // Solved yesterday
    if (daysSinceLastSolve <= 3) return 75;   // Solved within 3 days
    if (daysSinceLastSolve <= 7) return 50;   // Solved within a week
    if (daysSinceLastSolve <= 14) return 30;  // Solved within 2 weeks
    if (daysSinceLastSolve <= 30) return 15;  // Solved within a month
    return 5; // Solved more than a month ago
  }

  /**
   * Calculate solve frequency score
   * Based on average problems solved per day
   */
  private calculateFrequencyScore(totalSolved: number, lastSolvedDate: Date | null): number {
    if (totalSolved === 0 || !lastSolvedDate) return 0;

    const now = new Date();
    const daysActive = Math.max(1, Math.floor((now.getTime() - lastSolvedDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate problems per day (capped at reasonable max)
    const problemsPerDay = totalSolved / daysActive;
    
    // Score based on frequency (1+ problems/day is good)
    if (problemsPerDay >= 3) return 100;
    if (problemsPerDay >= 2) return 85;
    if (problemsPerDay >= 1) return 70;
    if (problemsPerDay >= 0.5) return 50; // 1 problem every 2 days
    if (problemsPerDay >= 0.3) return 30; // 1 problem every 3-4 days
    if (problemsPerDay >= 0.1) return 15; // 1 problem per week
    return 5; // Very low frequency
  }
}

export const consistencyEngine = new ConsistencyEngine();
