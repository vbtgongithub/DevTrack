import { ReadinessScoreInput, TopicBreakdown } from '../types/dsa.types';

export class ReadinessScoreEngine {
  /**
   * Calculate DSA readiness score based on:
   * - 40% Problem Count
   * - 30% Difficulty Mix
   * - 20% Topic Coverage
   * - 10% Consistency
   * 
   * Returns a score between 0-100
   */
  calculateReadinessScore(input: ReadinessScoreInput): number {
    const { totalSolved, easySolved, mediumSolved, hardSolved, topicBreakdown, consistencyScore } = input;

    // 1. Problem Count Score (40% weight)
    const problemCountScore = this.calculateProblemCountScore(totalSolved);

    // 2. Difficulty Mix Score (30% weight)
    const difficultyMixScore = this.calculateDifficultyMixScore(easySolved, mediumSolved, hardSolved, totalSolved);

    // 3. Topic Coverage Score (20% weight)
    const topicCoverageScore = this.calculateTopicCoverageScore(topicBreakdown);

    // 4. Consistency Score (10% weight)
    const consistencyWeighted = consistencyScore * 0.1;

    // Weighted aggregation
    const totalScore = 
      (problemCountScore * 0.4) +
      (difficultyMixScore * 0.3) +
      (topicCoverageScore * 0.2) +
      consistencyWeighted;

    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  /**
   * Calculate problem count score
   * Based on total problems solved with diminishing returns
   */
  private calculateProblemCountScore(totalSolved: number): number {
    if (totalSolved === 0) return 0;
    
    // Logarithmic scaling with diminishing returns
    // 50 problems = 50% score
    // 200 problems = 80% score
    // 500+ problems = 100% score
    const maxScore = 100;
    const halfLife = 50; // problems needed for 50% score
    
    const score = maxScore * (1 - Math.exp(-totalSolved / halfLife));
    return Math.min(maxScore, score);
  }

  /**
   * Calculate difficulty mix score
   * Rewards balanced difficulty distribution with emphasis on medium/hard
   */
  private calculateDifficultyMixScore(
    easySolved: number,
    mediumSolved: number,
    hardSolved: number,
    totalSolved: number
  ): number {
    if (totalSolved === 0) return 0;

    let score = 0;

    // Easy problems: baseline (max 20 points)
    const easyRatio = easySolved / totalSolved;
    const easyScore = Math.min(20, easyRatio * 100 * 0.2);

    // Medium problems: important (max 40 points)
    const mediumRatio = mediumSolved / totalSolved;
    const mediumScore = Math.min(40, mediumRatio * 100 * 0.4);

    // Hard problems: critical (max 40 points)
    const hardRatio = hardSolved / totalSolved;
    const hardScore = Math.min(40, hardRatio * 100 * 0.4);

    score = easyScore + mediumScore + hardScore;

    // Bonus for having solved at least some hard problems
    if (hardSolved > 0) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate topic coverage score
   * Based on number of topics with meaningful solve count
   */
  private calculateTopicCoverageScore(topicBreakdown: TopicBreakdown): number {
    const topics = Object.values(topicBreakdown);
    const totalTopics = topics.length;
    
    if (totalTopics === 0) return 0;

    // Count topics with at least 5 problems solved
    const meaningfulTopics = topics.filter(count => count >= 5).length;
    
    // Calculate coverage percentage
    const coverageRatio = meaningfulTopics / totalTopics;
    
    // Scale to 0-100 with bonus for high coverage
    let score = coverageRatio * 80;
    
    // Bonus for covering all topics
    if (meaningfulTopics === totalTopics && totalTopics >= 10) {
      score += 20;
    }

    return Math.min(100, score);
  }
}

export const readinessScoreEngine = new ReadinessScoreEngine();
