import type { Types } from 'mongoose';
import { ReadinessDsa } from '../../../db/models/readinessDsa.model.js';
import { CredibilitySignal } from './credibility.schema.js';

export interface DSACredibilityResult {
  score: number;
  signals: CredibilitySignal[];
}

export class DSACredibilityEngine {
  async evaluate(userId: Types.ObjectId | undefined): Promise<DSACredibilityResult> {
    if (!userId) {
      return {
        score: 0,
        signals: [{
          type: 'dsa',
          title: 'Missing Platform Data',
          description: 'No synced platform data available to verify DSA claims.',
          evidence: 'User account lacks LeetCode or Codeforces connection.',
          impact: 0 // Neutral impact if no data exists, handled by aggregator
        }]
      };
    }

    const dsaData = await ReadinessDsa.findOne({ userId });
    
    if (!dsaData) {
      return {
        score: 0,
        signals: [{
          type: 'dsa',
          title: 'No DSA Activity Detected',
          description: 'User has connected a platform but has zero recorded DSA activity.',
          evidence: 'ReadinessDsa profile is empty.',
          impact: 0
        }]
      };
    }

    const signals: CredibilitySignal[] = [];
    let score = 0;
    
    const solved = dsaData.totalSolves || 0;
    const hard = dsaData.difficultyDistribution?.hard || 0;
    const solveConsistency = dsaData.solveConsistency || 0;

    // Evaluate Solved Count
    if (solved > 500) {
      score += 40;
      signals.push({ type: 'dsa', title: 'Exceptional Problem Solving Volume', description: 'User has solved a massive number of problems.', evidence: `${solved} problems solved`, impact: 40 });
    } else if (solved > 200) {
      score += 25;
      signals.push({ type: 'dsa', title: 'Strong Problem Solving Volume', description: 'User has a solid foundation of problem-solving.', evidence: `${solved} problems solved`, impact: 25 });
    } else if (solved > 50) {
      score += 10;
      signals.push({ type: 'dsa', title: 'Moderate Problem Solving Volume', description: 'User is actively practicing but lacks deep volume.', evidence: `${solved} problems solved`, impact: 10 });
    }

    // Evaluate Hard Ratio
    const hardRatio = solved > 0 ? hard / solved : 0;
    if (hardRatio > 0.15 && solved > 100) {
      score += 20;
      signals.push({ type: 'dsa', title: 'High Advanced Problem Ratio', description: 'User tackles complex algorithmic challenges consistently.', evidence: `${(hardRatio * 100).toFixed(1)}% of solved problems are Hard`, impact: 20 });
    } else if (hard > 20) {
      score += 10;
    }

    // Evaluate Consistency
    if (solveConsistency > 80) {
      score += 20;
      signals.push({ type: 'dsa', title: 'Highly Consistent Solver', description: 'Maintains long problem-solving streaks.', evidence: `Consistency Score: ${solveConsistency}`, impact: 20 });
    } else if (solveConsistency > 50) {
      score += 10;
      signals.push({ type: 'dsa', title: 'Regular Practice', description: 'Shows regular engagement with DSA.', evidence: `Consistency Score: ${solveConsistency}`, impact: 10 });
    }

    return {
      score: Math.min(100, score),
      signals
    };
  }
}
