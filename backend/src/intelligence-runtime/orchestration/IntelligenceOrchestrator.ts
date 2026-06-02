import { ResumeParsingEngine } from '../parsing/ResumeParsingEngine.js';
import { FeatureExtractionPipeline } from '../feature-extraction/FeatureExtractionPipeline.js';
import { RankingEngine, RankingOutput } from '../ranking/RankingEngine.js';
import { ATSCalibrationEngine } from '../calibration/ATSCalibrationEngine.js';
import { BenchmarkIntelligence } from '../calibration/BenchmarkIntelligence.js';
import { VerificationSystems } from '../credibility/VerificationSystems.js';
import { ConfidenceEvaluator } from '../confidence/ConfidenceEvaluator.js';
import { IntelligenceResult } from '../types/index.js';

export class IntelligenceOrchestrator {
  private parser = new ResumeParsingEngine();
  private extractor = new FeatureExtractionPipeline();
  private ranker = new RankingEngine();
  private atsCalibration = new ATSCalibrationEngine();
  private benchmark = new BenchmarkIntelligence();
  private verification = new VerificationSystems();
  private confidenceEval = new ConfidenceEvaluator();

  /**
   * Main runtime entry point for transforming a resume buffer into structured, evidence-backed intelligence.
   */
  async processResumeIntelligence(
    buffer: Buffer, 
    mimeType: string, 
    dsaData: any, 
    githubData: any, 
    targetRole: string = 'backend_engineer'
  ): Promise<IntelligenceResult<any>> {
    
    // 1. Deterministic Parsing
    const parsedRes = await this.parser.parseFromBuffer(buffer, mimeType);
    const parsed = parsedRes.data;

    // 2. Verification & Credibility
    const skillList = parsed.skills.map(s => s.value);
    const credibilityRes = await this.verification.verify(skillList, dsaData, githubData);

    // 3. Feature Extraction
    const featureRes = await this.extractor.extractFeatures(parsed, dsaData);

    // 4. Ranking & Scoring
    const rankingRes = await this.ranker.computeRanking(featureRes.data, credibilityRes.data);

    // 5. ATS Calibration & Benchmarking
    // Convert 0-1 score to 0-100 for ATS calibration
    const rawAtsScore = Math.round(rankingRes.data.engineering_score * 100);
    const atsRes = await this.atsCalibration.calibrate(rawAtsScore, targetRole);
    const benchRes = await this.benchmark.generateBenchmark(atsRes.data, targetRole);

    // 6. Aggregate Confidence
    const aggregatedConfidence = this.confidenceEval.aggregate([
      parsedRes.confidence,
      credibilityRes.confidence,
      featureRes.confidence,
      rankingRes.confidence,
      atsRes.confidence,
      benchRes.confidence
    ], 'Aggregated confidence across all deterministic extraction and ranking pipelines.');

    // Runtime Governance: Intelligence Payload Compatibility & Confidence Caps
    if (aggregatedConfidence.confidence < 0.4) {
      throw new Error(`[Governance] Intelligence payload rejected: Aggregate confidence (${aggregatedConfidence.confidence}) is below the required 0.4 threshold.`);
    }

    return {
      data: {
        parsedResume: parsed,
        features: featureRes.data,
        ranking: rankingRes.data,
        calibration: atsRes.data,
        benchmark: benchRes.data,
        credibility: credibilityRes.data
      },
      confidence: aggregatedConfidence,
      metadata: {
        runtimeVersion: '1.0.0',
        schemaVersion: '1.0',
        replayCompatibilityVersion: '1.0',
        generatedAt: new Date().toISOString()
      }
    };
  }
}
