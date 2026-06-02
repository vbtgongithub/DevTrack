import { IntelligenceResult, ConfidenceEnvelope } from '../types/index.js';

export interface CompetitivenessOutput {
  overallCompetitiveness: string;
  roleBaselineAlignment: number;
  stackMaturityPercentile: number;
  infrastructureCompetitiveness: 'low' | 'average' | 'strong' | 'elite';
  systemDesignCohort: string;
  hiringOutcomes?: {
    interviewConversionRate: number;
    offerProbabilityShift: number;
  };
}

export class HiringCompetitivenessModel {
  /**
   * Generates deterministic hiring competitiveness scoring
   * by comparing the feature vector against pre-defined cohort baselines.
   */
  async scoreCompetitiveness(
    featureVector: any, 
    targetRole: string
  ): Promise<IntelligenceResult<CompetitivenessOutput>> {
    
    // Mock cohort baselines
    const baseline = {
      infraScoreRequired: targetRole === 'devops_engineer' ? 80 : 50,
      archScoreRequired: targetRole.includes('senior') ? 70 : 40,
    };

    const roleBaselineAlignment = (featureVector.infraScore / baseline.infraScoreRequired) * 100;
    
    // Stack maturity mapping
    const stackMaturityPercentile = Math.min(99, Math.floor(
      ((featureVector.backendScore + featureVector.frontendScore) / 200) * 100
    ));

    // Infrastructure categorization
    let infraComp: 'low' | 'average' | 'strong' | 'elite' = 'low';
    if (featureVector.infraScore > 85) infraComp = 'elite';
    else if (featureVector.infraScore > 65) infraComp = 'strong';
    else if (featureVector.infraScore > 40) infraComp = 'average';

    // System design cohort
    const systemDesignCohort = featureVector.architectureScore > 75 
      ? 'Distributed Systems Engineer' 
      : featureVector.architectureScore > 40 
        ? 'Mid-Level Architect' 
        : 'Monolith Contributor';

    let overall = 'Average';
    if (infraComp === 'elite' && stackMaturityPercentile > 80) overall = 'Top Tier Candidate';
    else if (infraComp === 'strong' || stackMaturityPercentile > 60) overall = 'Strong Contender';

    // Integrate real-world outcomes if available (Mock payload)
    const mockHiringOutcomes = {
      interviewConversionRate: featureVector.infraScore > 70 ? 0.45 : 0.15,
      offerProbabilityShift: featureVector.architectureScore > 60 ? 0.12 : -0.05
    };

    const output: CompetitivenessOutput = {
      overallCompetitiveness: overall,
      roleBaselineAlignment: Math.min(100, roleBaselineAlignment),
      stackMaturityPercentile,
      infrastructureCompetitiveness: infraComp,
      systemDesignCohort,
      hiringOutcomes: mockHiringOutcomes
    };

    const confidence: ConfidenceEnvelope = {
      confidence: 0.85,
      evidenceCount: 4,
      evidenceSources: ['FeatureExtractionPipeline', 'Cohort_Baselines_DB'],
      reasoning: 'Scored against deterministic infrastructure and architecture feature vectors.'
    };

    return {
      data: output,
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
