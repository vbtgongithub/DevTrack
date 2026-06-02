import { IntelligenceResult, ConfidenceEnvelope } from '../types/index.js';
import { ATSCalibrationOutput } from './ATSCalibrationEngine.js';

export interface BenchmarkOutput {
  formattedOutput: string;
  hiringCompetitiveness: string;
  marketComparison: string;
}

export class BenchmarkIntelligence {
  /**
   * Translates quantitative percentiles into qualitative benchmark narratives.
   */
  async generateBenchmark(calibration: ATSCalibrationOutput, role: string): Promise<IntelligenceResult<BenchmarkOutput>> {
    
    let competitiveness = 'Low';
    if (calibration.percentileRanking <= 10) competitiveness = 'Elite';
    else if (calibration.percentileRanking <= 25) competitiveness = 'Strong';
    else if (calibration.percentileRanking <= 50) competitiveness = 'Average';

    let resumeStrength = 'General Software Engineering';
    if (role.includes('backend')) resumeStrength = 'Production Backend Systems';
    if (role.includes('fullstack')) resumeStrength = 'End-to-End Product Engineering';

    const formattedOutput = `ATS Score: ${calibration.rawScore}\n${calibration.benchmarkRange} among ${role.replace('_', ' ')} resumes\nConfidence: High\nResume Strength: ${resumeStrength}`;
    
    const marketComparison = `Relative to a highly competitive pool of engineering applicants, this resume is in the ${calibration.percentileRanking}th percentile, demonstrating ${competitiveness.toLowerCase()} hiring competitiveness.`;

    const output: BenchmarkOutput = {
      formattedOutput,
      hiringCompetitiveness: competitiveness,
      marketComparison
    };

    const confidence: ConfidenceEnvelope = {
      confidence: 0.90,
      evidenceCount: 1,
      evidenceSources: ['ATSCalibrationEngine'],
      reasoning: 'Derived directly from deterministic percentile rankings.'
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
