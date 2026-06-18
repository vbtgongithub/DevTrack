import { ParsedResume, ResumeFeatureVector, IntelligenceResult, ConfidenceEnvelope } from '../types/index.js';

export class FeatureExtractionPipeline {
  /**
   * Extracts quantitative engineering features deterministically
   */
  async extractFeatures(parsed: ParsedResume, dsaData?: any): Promise<IntelligenceResult<ResumeFeatureVector>> {
    const backendScore = this.calculateBackendMaturity(parsed);
    const frontendScore = this.calculateFrontendMaturity(parsed);
    const infraScore = this.calculateInfraExposure(parsed);
    const architectureScore = this.calculateArchitectureComplexity(parsed);
    const deploymentScore = this.calculateDeploymentMaturity(parsed);
    const projectDepthScore = this.calculateProjectDepth(parsed);
    const dsaScore = this.calculateDSAScore(dsaData);

    const vector: ResumeFeatureVector = {
      backendScore,
      frontendScore,
      infraScore,
      architectureScore,
      deploymentScore,
      projectDepthScore,
      dsaScore
    };

    const confidence: ConfidenceEnvelope = {
      confidence: parsed.skills.length > 5 ? 0.9 : 0.4,
      evidenceCount: parsed.skills.length + parsed.projects.length,
      evidenceSources: ['deterministic_extraction_pipeline'],
      reasoning: 'Features calculated deterministically from known skill mappings.'
    };

    return {
      data: vector,
      confidence,
      metadata: {
        runtimeVersion: '1.0.0',
        schemaVersion: '1.0',
        replayCompatibilityVersion: '1.0',
        generatedAt: new Date().toISOString()
      }
    };
  }

  private calculateBackendMaturity(parsed: ParsedResume): number {
    const backendKeywords = ['node.js', 'python', 'java', 'go', 'express', 'django', 'spring', 'mongodb', 'postgresql'];
    const count = parsed.skills.filter(s => backendKeywords.includes(s.value.toLowerCase())).length;
    return Math.min(100, count * 15);
  }

  private calculateFrontendMaturity(parsed: ParsedResume): number {
    const frontendKeywords = ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html'];
    const count = parsed.skills.filter(s => frontendKeywords.includes(s.value.toLowerCase())).length;
    return Math.min(100, count * 15);
  }

  private calculateInfraExposure(parsed: ParsedResume): number {
    const infraKeywords = ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'redis', 'elasticsearch', 'nginx'];
    const count = parsed.skills.filter(s => infraKeywords.includes(s.value.toLowerCase())).length;
    return Math.min(100, count * 20);
  }

  private calculateArchitectureComplexity(parsed: ParsedResume): number {
    // Basic heuristic: Presence of microservices, caching, or message queues keywords in projects
    const archKeywords = ['microservice', 'queue', 'cache', 'kafka', 'rabbitmq', 'scalable'];
    let score = 0;
    parsed.projects.forEach(p => {
      if (archKeywords.some(k => p.value.toLowerCase().includes(k))) {
        score += 25;
      }
    });
    return Math.min(100, score);
  }

  private calculateDeploymentMaturity(parsed: ParsedResume): number {
    const deployKeywords = ['ci/cd', 'github actions', 'jenkins', 'vercel', 'netlify', 'deploy'];
    let score = 0;
    parsed.projects.forEach(p => {
      if (deployKeywords.some(k => p.value.toLowerCase().includes(k))) {
        score += 20;
      }
    });
    const skillScore = parsed.skills.filter(s => deployKeywords.includes(s.value.toLowerCase())).length * 15;
    return Math.min(100, score + skillScore);
  }

  private calculateProjectDepth(parsed: ParsedResume): number {
    // Heuristic based on number of projects and length of description
    return Math.min(100, parsed.projects.length * 20);
  }

  private calculateDSAScore(dsaData: any): number {
    if (!dsaData) return 0;
    return dsaData.overallScore || 0;
  }
}
