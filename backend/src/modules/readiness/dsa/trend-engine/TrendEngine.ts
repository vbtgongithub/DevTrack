import { TrendInput, TrendStatus } from '../types/dsa.types';

export class TrendEngine {
  /**
   * Calculate trend status based on:
   * - Recent activity pattern
   * - Current streak
   * - Hard problem growth trend
   * 
   * Returns: 'improving' | 'stable' | 'declining'
   */
  calculateTrend(input: TrendInput): TrendStatus {
    const { recentActivity, currentStreak, hardGrowthTrend } = input;

    // Calculate individual trend scores
    const activityTrend = this.calculateActivityTrend(recentActivity);
    const streakTrend = this.calculateStreakTrend(currentStreak);
    const hardGrowthTrendScore = this.calculateHardGrowthTrend(hardGrowthTrend);

    // Aggregate trend scores
    const trendScore = (activityTrend + streakTrend + hardGrowthTrendScore) / 3;

    // Determine overall trend status
    if (trendScore >= 0.3) return 'improving';
    if (trendScore >= -0.3) return 'stable';
    return 'declining';
  }

  /**
   * Calculate activity trend from recent activity array
   * Returns a score between -1 (declining) to 1 (improving)
   */
  private calculateActivityTrend(recentActivity: number[]): number {
    if (recentActivity.length < 2) return 0;

    // Calculate simple linear regression slope
    const n = recentActivity.length;
    const xSum = recentActivity.reduce((sum, _, i) => sum + i, 0);
    const ySum = recentActivity.reduce((sum, val) => sum + val, 0);
    const xySum = recentActivity.reduce((sum, val, i) => sum + (i * val), 0);
    const xSqSum = recentActivity.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * xySum - xSum * ySum) / (n * xSqSum - xSum * xSum);

    // Normalize slope to -1 to 1 range
    return Math.max(-1, Math.min(1, slope / 10)); // Assuming max 10 problems/day change
  }

  /**
   * Calculate streak trend
   * Returns a score between -1 (declining) to 1 (improving)
   */
  private calculateStreakTrend(currentStreak: number): number {
    // High current streak indicates improving trend
    if (currentStreak >= 30) return 1;
    if (currentStreak >= 14) return 0.7;
    if (currentStreak >= 7) return 0.4;
    if (currentStreak >= 3) return 0.1;
    if (currentStreak >= 1) return 0;
    return -0.5; // No streak indicates declining
  }

  /**
   * Calculate hard growth trend
   * Returns a score between -1 (declining) to 1 (improving)
   */
  private calculateHardGrowthTrend(hardGrowthTrend: number): number {
    // Hard growth trend is already normalized to -1 to 1
    return hardGrowthTrend;
  }
}

export const trendEngine = new TrendEngine();
