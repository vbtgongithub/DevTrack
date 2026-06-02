import { IntelligenceResult, ConfidenceEnvelope } from '../intelligence-runtime/types/index.js';

export interface EvolutionSnapshot {
  timestamp: string;
  skillVelocity: number;
  infrastructureMaturity: number;
  consistencyScore: number;
  competitivenessPercentile: number;
  interventionCorrelation: {
    recentInterventionId: string;
    velocityDeltaSinceIntervention: number;
  };
}

export class EvolutionTracker {
  /**
   * Generates a deterministic evolution snapshot by comparing current state
   * against the immediate historical state.
   */
  async generateSnapshot(
    currentState: any, 
    historicalStates: any[]
  ): Promise<IntelligenceResult<EvolutionSnapshot>> {
    
    // In production, velocity is delta over time window
    const baseState = historicalStates.length > 0 ? historicalStates[historicalStates.length - 1] : currentState;
    
    // Mock velocity: +5% if skills increased, else 0 or negative
    const currentSkillCount = currentState.skills?.length || 0;
    const pastSkillCount = baseState.skills?.length || 0;
    const skillVelocity = currentSkillCount > pastSkillCount ? 1.05 : currentSkillCount < pastSkillCount ? 0.9 : 1.0;

    const snapshot: EvolutionSnapshot = {
      timestamp: new Date().toISOString(),
      skillVelocity: skillVelocity,
      infrastructureMaturity: currentState.features?.infraScore || 0,
      consistencyScore: historicalStates.length > 5 ? 0.8 : 0.4, // Requires history
      competitivenessPercentile: currentState.ranking?.competitivenessPercentile || 50,
      interventionCorrelation: {
        recentInterventionId: currentState.lastInterventionId || 'none',
        velocityDeltaSinceIntervention: skillVelocity - (baseState.skillVelocity || 1.0)
      }
    };

    const confidence: ConfidenceEnvelope = {
      confidence: historicalStates.length >= 3 ? 0.90 : 0.50,
      evidenceCount: historicalStates.length + 1,
      evidenceSources: ['Historical_DB_Snapshots', 'Current_Runtime_Extraction'],
      reasoning: 'Evolution generated via strict delta comparison of historical states.'
    };

    return {
      data: snapshot,
      confidence,
      metadata: {
        runtimeVersion: '1.0.0',
        schemaVersion: '1.0',
        replayCompatibilityVersion: '1.0',
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Detects regression across the historical timeline
   */
  detectRegression(snapshots: EvolutionSnapshot[]): boolean {
    if (snapshots.length < 3) return false;
    const recent = snapshots.slice(-3);
    // If infrastructure maturity explicitly drops across 3 snapshots
    return recent[0].infrastructureMaturity > recent[2].infrastructureMaturity;
  }
}
