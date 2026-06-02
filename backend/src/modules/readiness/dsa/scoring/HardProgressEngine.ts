import { HardProgressInput } from '../types/dsa.types';

export class HardProgressEngine {
  /**
   * Calculate hard progress score based on:
   * - Hard solved ratio
   * - Hard growth trend
   * 
   * Returns a score between 0-100
   */
  calculateHardProgressScore(input: HardProgressInput): number {
    const { hardSolved, totalSolved, hardGrowthTrend } = input;

    // 1. Hard Solved Ratio Score (70% weight)
    const hardRatioScore = this.calculateHardRatioScore(hardSolved, totalSolved);

    // 2. Hard Growth Trend Score (30% weight)
    const growthTrendScore = this.calculateGrowthTrendScore(hardGrowthTrend);

    // Weighted aggregation
    const totalScore = 
      (hardRatioScore * 0.7) +
      (growthTrendScore * 0.3);

    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  /**
   * Calculate hard ratio score
   * Based on percentage of hard problems solved
   */
  private calculateHardRatioScore(hardSolved: number, totalSolved: number): number {
    if (totalSolved === 0) return 0;

    const hardRatio = hardSolved / totalSolved;

    // Hard problems are valuable, so even a small ratio gives decent score
    if (hardRatio >= 0.3) return 100;  // 30%+ hard problems is excellent
    if (hardRatio >= 0.2) return 85;   // 20%+ hard problems is very good
    if (hardRatio >= 0.15) return 70;  // 15%+ hard problems is good
    if (hardRatio >= 0.1) return 50;   // 10%+ hard problems is decent
    if (hardRatio >= 0.05) return 30;  // 5%+ hard problems is some progress
    if (hardRatio >= 0.01) return 15;  // 1%+ hard problems is minimal
    return 5; // Very few hard problems
  }

  /**
   * Calculate growth trend score
   * Based on hard problem growth trend (-1 to 1)
   */
  private calculateGrowthTrendScore(hardGrowthTrend: number): number {
    // Growth trend ranges from -1 (declining) to 1 (improving rapidly)
    if (hardGrowthTrend >= 0.5) return 100;  // Rapid improvement
    if (hardGrowthTrend >= 0.3) return 85;   // Good improvement
    if (hardGrowthTrend >= 0.1) return 70;   // Steady improvement
    if (hardGrowthTrend >= 0) return 50;    // Stable
    if (hardGrowthTrend >= -0.1) return 30;  // Slight decline
    if (hardGrowthTrend >= -0.3) return 15;  // Moderate decline
    return 5; // Significant decline
  }
}

export const hardProgressEngine = new HardProgressEngine();
