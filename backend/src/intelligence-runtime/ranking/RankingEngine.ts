import { ResumeFeatureVector, IntelligenceResult, ConfidenceEnvelope, CredibilitySignal } from '../types/index.js';
import crypto from 'crypto';

export interface RankingOutput {
  engineering_score: number;
  backend_score: number;
  infra_score: number;
  project_depth_score: number;
  credibility_score: number;
  role_alignment: Record<string, number>;
}

export class RankingEngine {
  // In-memory cache for memoization (use Redis in prod)
  private rankingCache: Map<string, IntelligenceResult<RankingOutput>> = new Map();

  /**
   * Deterministically calculates ranking scores with memoization.
   */
  async computeRanking(
    features: ResumeFeatureVector, 
    credibilitySignals: CredibilitySignal[]
  ): Promise<IntelligenceResult<RankingOutput>> {
    
    const cacheKey = this.generateCacheKey(features, credibilitySignals);
    if (this.rankingCache.has(cacheKey)) {
      return this.rankingCache.get(cacheKey)!;
    }

    // Calculate credibility score based on signals
    const credibility_score = this.calculateCredibility(credibilitySignals);

    // Calculate core engineering score (weighted average)
    const engineering_score = Math.round(
      (features.backendScore * 0.3) + 
      (features.frontendScore * 0.2) + 
      (features.infraScore * 0.2) + 
      (features.architectureScore * 0.15) + 
      (features.deploymentScore * 0.15)
    );

    // Role Alignments
    const role_alignment = {
      backend_engineer: this.alignRole(features.backendScore, features.infraScore, features.architectureScore),
      fullstack_engineer: this.alignRole(features.backendScore, features.frontendScore, features.deploymentScore),
      devops_engineer: this.alignRole(features.infraScore, features.deploymentScore, features.architectureScore)
    };

    const output: RankingOutput = {
      engineering_score: engineering_score / 100,
      backend_score: features.backendScore / 100,
      infra_score: features.infraScore / 100,
      project_depth_score: features.projectDepthScore / 100,
      credibility_score: credibility_score / 100,
      role_alignment
    };

    const confidence: ConfidenceEnvelope = {
      confidence: 0.9,
      evidenceCount: credibilitySignals.length + 5, // Arbitrary count of core inputs
      evidenceSources: ['ranking_engine', 'feature_vector', 'credibility_signals'],
      reasoning: 'Ranking scores derived mathematically from bounded feature vectors with consistency memoization.'
    };

    const result = {
      data: output,
      confidence,
      metadata: {
        runtimeVersion: '1.0.0',
        schemaVersion: '1.0',
        replayCompatibilityVersion: '1.0',
        generatedAt: new Date().toISOString()
      }
    };
    
    this.rankingCache.set(cacheKey, result);
    return result;
  }

  private calculateCredibility(signals: CredibilitySignal[]): number {
    if (signals.length === 0) return 50; // Neutral baseline
    let score = 50;
    signals.forEach(s => {
      if (s.verificationStatus === 'verified') score += 15;
      else if (s.verificationStatus === 'partial') score += 5;
      else if (s.verificationStatus === 'weak') score -= 10;
    });
    return Math.min(100, Math.max(0, score));
  }

  private alignRole(primary: number, secondary: number, tertiary: number): number {
    const raw = (primary * 0.5) + (secondary * 0.3) + (tertiary * 0.2);
    return Math.round((raw / 100) * 100) / 100; // Return as decimal e.g. 0.85
  }

  private generateCacheKey(features: ResumeFeatureVector, signals: CredibilitySignal[]): string {
    const payload = JSON.stringify({ features, signals });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }
}
