import { ReadinessCore } from '../../db/models/readinessCore.model.js';
import { ReadinessDsa } from '../../db/models/readinessDsa.model.js';
import { ReadinessRoadmap } from '../../db/models/readinessRoadmap.model.js';
import { ReadinessBenchmarks } from '../../db/models/readinessBenchmarks.model.js';

export const ReadinessContextBuilder = {
  /**
   * Constructs strict, deterministic context for AI prompts.
   * NEVER passes raw platform state to prevent hallucinations.
   */
  async buildContext(userId: string): Promise<string> {
    const [core, dsa, roadmap, benchmarks] = await Promise.all([
      ReadinessCore.findOne({ userId }).lean(),
      ReadinessDsa.findOne({ userId }).lean(),
      ReadinessRoadmap.findOne({ userId }).lean(),
      ReadinessBenchmarks.findOne({ userId }).lean()
    ]);

    let context = `[DETERMINISTIC CONTEXT START]\n`;
    context += `User Score: ${core?.overallScore || 0}\n`;
    context += `Confidence: ${core?.confidence || 0}% (Is Degraded: ${core?.isDegraded || false})\n`;
    
    if (dsa) {
      context += `DSA Weaknesses: ${dsa.weakTopics.join(', ') || 'None'}\n`;
      context += `Hard Problem Maturity: ${dsa.hardProblemProgression || 0}%\n`;
    }

    if (roadmap) {
      context += `Missing Dependencies: ${roadmap.missingDependencies.map(d => d.nodeId).join(', ') || 'None'}\n`;
      context += `Verified Nodes: ${roadmap.verifiedNodes.map(d => d.nodeId).join(', ') || 'None'}\n`;
    }

    if (benchmarks?.cohortSegments?.length) {
      const seg = benchmarks.cohortSegments[0];
      context += `Cohort: ${seg.cohortName}, Ranking: Top ${100 - seg.percentileRanking}%\n`;
    }

    context += `[DETERMINISTIC CONTEXT END]`;
    return context;
  }
};
