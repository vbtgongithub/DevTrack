import { IntelligenceResult, ConfidenceEnvelope, CredibilitySignal } from '../types/index.js';

export class VerificationSystems {
  /**
   * Cross-verifies claims against actual data sources (e.g., GitHub, LeetCode)
   */
  async verify(resumeSkills: string[], dsaData: any, githubData: any): Promise<IntelligenceResult<CredibilitySignal[]>> {
    const signals: CredibilitySignal[] = [];

    // 1. Verify GitHub Language Consistency
    if (githubData && githubData.languages) {
      const gitLanguages = githubData.languages.map((l: string) => l.toLowerCase());
      const overlapping = resumeSkills.filter(s => gitLanguages.includes(s.toLowerCase()));
      
      signals.push({
        source: 'github_languages',
        consistency: overlapping.length > 0 ? (overlapping.length / Math.min(5, resumeSkills.length)) * 100 : 0,
        verificationStatus: overlapping.length > 2 ? 'verified' : overlapping.length > 0 ? 'partial' : 'weak'
      });
    } else {
      signals.push({
        source: 'github_languages',
        consistency: 0,
        verificationStatus: 'weak'
      });
    }

    // 2. Verify DSA problem solving claims (if they claim C++ or algorithms)
    if (dsaData && dsaData.totalSolved > 0) {
      signals.push({
        source: 'dsa_platform',
        consistency: dsaData.totalSolved > 50 ? 100 : dsaData.totalSolved > 10 ? 50 : 20,
        verificationStatus: dsaData.totalSolved > 50 ? 'verified' : 'partial'
      });
    } else {
       signals.push({
        source: 'dsa_platform',
        consistency: 0,
        verificationStatus: 'weak'
      });
    }

    const confidence: ConfidenceEnvelope = {
      confidence: githubData && dsaData ? 0.9 : 0.5,
      evidenceCount: signals.length,
      evidenceSources: ['GitHub_API', 'DSA_Platform'],
      reasoning: 'Verified through deterministic cross-referencing against external profiles.'
    };

    return {
      data: signals,
      confidence,
      metadata: {
        runtimeVersion: '1.0.0',
        schemaVersion: '1.0',
        replayCompatibilityVersion: '1.0',
        generatedAt: new Date().toISOString()
      }
    };
  }
}
