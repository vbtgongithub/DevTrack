import { ReadinessCore } from '../../../db/models/readinessCore.model.js';
import { ReadinessDsa } from '../../../db/models/readinessDsa.model.js';
import { ReadinessSkills } from '../../../db/models/readinessSkills.model.js';
import { ReadinessProjects } from '../../../db/models/readinessProjects.model.js';
import { ReadinessRoadmap } from '../../../db/models/readinessRoadmap.model.js';
import { ReadinessBenchmarks } from '../../../db/models/readinessBenchmarks.model.js';
import { CareerIntent } from '../../../db/models/careerIntent.model.js';
import { logger } from '../../../shared/logger.js';

export interface ScoringInput {
  userId: string;
}

export interface ReadinessScore {
  overallScore: number; // 0-100
  dsaScore: number;
  skillsScore: number;
  projectsScore: number;
  roadmapScore: number;
  benchmarkPercentile: number;
  confidenceLevel: number; // 0-100
  isDegraded: boolean;
  staleProviders: string[];
  scoringExplanation: string[];
  evidenceChain: string[];
  roleAlignmentScore: number;
  readinessTier: 'not_ready' | 'early' | 'developing' | 'ready' | 'strong';
}

export const TrustAwareReadinessScoringEngine = {
  /**
   * Calculate trust-aware, deterministic readiness score.
   * Aggregates all intelligence fragments with confidence-weighted scoring.
   * NO AI predictions - only objective, evidence-based metrics.
   */
  async calculateReadinessScore(input: ScoringInput): Promise<ReadinessScore> {
    try {
      const { userId } = input;
      
      // Fetch all readiness intelligence fragments
      const [core, dsa, skills, projects, roadmap, benchmarks, careerIntent] = await Promise.all([
        ReadinessCore.findOne({ userId }),
        ReadinessDsa.findOne({ userId }),
        ReadinessSkills.findOne({ userId }),
        ReadinessProjects.findOne({ userId }),
        ReadinessRoadmap.findOne({ userId }),
        ReadinessBenchmarks.findOne({ userId }),
        CareerIntent.findOne({ userId }),
      ]);
      
      // Check for degraded mode conditions
      const degradationCheck = this.checkDegradation(core, dsa, skills, projects, roadmap, benchmarks);
      const isDegraded = degradationCheck.isDegraded;
      const staleProviders = degradationCheck.staleProviders;
      
      // Calculate component scores with confidence weighting
      const dsaScore = this.calculateDSAScore(dsa, isDegraded);
      const skillsScore = this.calculateSkillsScore(skills, isDegraded);
      const projectsScore = this.calculateProjectsScore(projects, isDegraded);
      const roadmapScore = this.calculateRoadmapScore(roadmap, isDegraded);
      
      // Calculate benchmark percentile
      const benchmarkPercentile = this.calculateBenchmarkPercentile(benchmarks);
      
      // Calculate role alignment
      const roleAlignmentScore = this.calculateRoleAlignment(careerIntent, skills, projects);
      
      // Calculate overall score with weighted aggregation
      const overallScore = this.calculateOverallScore(
        dsaScore,
        skillsScore,
        projectsScore,
        roadmapScore,
        benchmarkPercentile,
        roleAlignmentScore,
        isDegraded
      );
      
      // Calculate confidence level
      const confidenceLevel = this.calculateConfidenceLevel(
        dsa,
        skills,
        projects,
        roadmap,
        benchmarks,
        isDegraded
      );
      
      // Generate scoring explanation
      const scoringExplanation = this.generateScoringExplanation(
        overallScore,
        dsaScore,
        skillsScore,
        projectsScore,
        roadmapScore,
        benchmarkPercentile,
        roleAlignmentScore,
        isDegraded
      );
      
      // Generate evidence chain
      const evidenceChain = this.generateEvidenceChain(
        dsa,
        skills,
        projects,
        roadmap
      );
      
      // Determine readiness tier
      const readinessTier = this.determineReadinessTier(overallScore, confidenceLevel);
      
      // Update core readiness model
      await ReadinessCore.findOneAndUpdate(
        { userId },
        {
          overallScore,
          dsaScore,
          skillsScore,
          projectsScore,
          roadmapScore,
          benchmarkPercentile,
          roleAlignmentScore,
          confidenceLevel,
          isDegraded,
          staleProviders,
          scoringExplanation,
          evidenceChain,
          readinessTier,
          snapshotVersion: '1.0.0',
          analyticsVersion: '1.0.0',
          scoringVersion: '1.0.0',
          computedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      logger.info('[TrustAwareReadinessScoringEngine] Successfully calculated readiness score', { 
        userId, 
        overallScore,
        readinessTier 
      });
      
      return {
        overallScore,
        dsaScore,
        skillsScore,
        projectsScore,
        roadmapScore,
        benchmarkPercentile,
        confidenceLevel,
        isDegraded,
        staleProviders,
        scoringExplanation,
        evidenceChain,
        roleAlignmentScore,
        readinessTier,
      };
    } catch (error) {
      logger.error('[TrustAwareReadinessScoringEngine] Failed to calculate score', { input, error });
      throw error;
    }
  },

  /**
   * Check for degradation conditions
   */
  checkDegradation(
    core: any,
    dsa: any,
    skills: any,
    projects: any,
    roadmap: any,
    benchmarks: any
  ): { isDegraded: boolean; staleProviders: string[] } {
    const staleProviders: string[] = [];
    const now = new Date();
    const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    
    const checkFreshness = (model: any, providerName: string) => {
      if (!model) return true;
      const computedAt = model.computedAt ? new Date(model.computedAt) : new Date(0);
      const isStale = (now.getTime() - computedAt.getTime()) > staleThreshold;
      if (isStale) staleProviders.push(providerName);
      return isStale;
    };
    
    const dsaStale = checkFreshness(dsa, 'DSA');
    const skillsStale = checkFreshness(skills, 'Skills');
    const projectsStale = checkFreshness(projects, 'Projects');
    const roadmapStale = checkFreshness(roadmap, 'Roadmap');
    const benchmarksStale = checkFreshness(benchmarks, 'Benchmarks');
    
    const isDegraded = dsaStale || skillsStale || projectsStale || roadmapStale || benchmarksStale;
    
    return { isDegraded, staleProviders };
  },

  /**
   * Calculate DSA score with confidence weighting
   */
  calculateDSAScore(dsa: any, isDegraded: boolean): number {
    if (!dsa || isDegraded) return 0;
    
    let score = 0;
    
    // Total solves contributes (max 30 points)
    score += Math.min(30, (dsa.totalSolves || 0) * 0.3);
    
    // Hard problem progression contributes (max 25 points)
    score += Math.min(25, dsa.hardProblemProgression * 0.25);
    
    // Solve consistency contributes (max 20 points)
    score += Math.min(20, dsa.solveConsistency * 0.2);
    
    // Confidence score contributes (max 15 points)
    score += Math.min(15, (dsa.confidenceScore || 0) * 0.15);
    
    // Evidence coverage contributes (max 10 points)
    score += Math.min(10, (dsa.evidenceCoverage || 0) * 0.1);
    
    return Math.min(100, Math.round(score));
  },

  /**
   * Calculate Skills score with confidence weighting
   */
  calculateSkillsScore(skills: any, isDegraded: boolean): number {
    if (!skills || isDegraded) return 0;
    
    let score = 0;
    
    // Overall engineering depth contributes (max 40 points)
    score += Math.min(40, (skills.overallEngineeringDepth || 0) * 0.4);
    
    // Confidence score contributes (max 30 points)
    score += Math.min(30, (skills.confidenceScore || 0) * 0.3);
    
    // Evidence coverage contributes (max 20 points)
    score += Math.min(20, (skills.evidenceCoverage || 0) * 0.2);
    
    // Domain diversity contributes (max 10 points)
    const domainCount = skills.domains?.length || 0;
    score += Math.min(10, domainCount * 2);
    
    return Math.min(100, Math.round(score));
  },

  /**
   * Calculate Projects score with confidence weighting
   */
  calculateProjectsScore(projects: any, isDegraded: boolean): number {
    if (!projects || isDegraded) return 0;
    
    let score = 0;
    
    // Project credibility score contributes (max 35 points)
    score += Math.min(35, (projects.projectCredibilityScore || 0) * 0.35);
    
    // Engineering maturity contributes (max 25 points)
    score += Math.min(25, (projects.engineeringMaturity || 0) * 0.25);
    
    // Infrastructure sophistication contributes (max 20 points)
    score += Math.min(20, (projects.infrastructureSophistication || 0) * 0.2);
    
    // Confidence score contributes (max 10 points)
    score += Math.min(10, (projects.confidenceScore || 0) * 0.1);
    
    // Deployment evidence contributes (max 10 points)
    score += Math.min(10, (projects.deploymentEvidence || 0) * 0.1);
    
    return Math.min(100, Math.round(score));
  },

  /**
   * Calculate Roadmap score with confidence weighting
   */
  calculateRoadmapScore(roadmap: any, isDegraded: boolean): number {
    if (!roadmap || isDegraded) return 0;
    
    let score = 0;
    
    // Verified nodes count contributes (max 40 points)
    const verifiedCount = roadmap.verifiedNodes?.length || 0;
    score += Math.min(40, verifiedCount * 5);
    
    // Confidence score contributes (max 30 points)
    score += Math.min(30, (roadmap.confidenceScore || 0) * 0.3);
    
    // Evidence coverage contributes (max 20 points)
    score += Math.min(20, (roadmap.evidenceCoverage || 0) * 0.2);
    
    // Next best actions completeness (max 10 points)
    const actionCount = roadmap.nextBestActions?.length || 0;
    score += Math.min(10, actionCount * 2);
    
    return Math.min(100, Math.round(score));
  },

  /**
   * Calculate benchmark percentile
   */
  calculateBenchmarkPercentile(benchmarks: any): number {
    if (!benchmarks) return 0;
    
    // Use the average percentile across all metrics
    const rankings = benchmarks.percentileRankings || [];
    if (rankings.length === 0) return 0;
    
    const totalPercentile = rankings.reduce((sum: number, r: any) => sum + r.percentile, 0);
    return Math.round(totalPercentile / rankings.length);
  },

  /**
   * Calculate role alignment score
   */
  calculateRoleAlignment(careerIntent: any, skills: any, projects: any): number {
    if (!careerIntent) return 0;
    
    let score = 0;
    
    // Check if skills match target role
    const targetRole = careerIntent.dreamRole?.toLowerCase() || '';
    const domains = skills?.domains || [];
    
    // Role-specific skill matching
    const roleSkillMap: Record<string, string[]> = {
      'backend': ['backend', 'database', 'system-design'],
      'frontend': ['frontend'],
      'full stack': ['frontend', 'backend', 'database'],
      'devops': ['devops', 'cloud', 'infrastructure'],
    };
    
    const relevantCategories = roleSkillMap[targetRole] || [];
    const matchingDomains = domains.filter((d: any) => 
      relevantCategories.some(cat => d.name.toLowerCase().includes(cat))
    );
    
    score += Math.min(50, matchingDomains.length * 15);
    
    // Check project alignment with target role
    const engineeringMaturity = projects?.engineeringMaturity || 0;
    score += Math.min(30, engineeringMaturity * 0.3);
    
    // Check confidence state
    const confidenceState = careerIntent.confidenceState || 'exploring';
    if (confidenceState === 'committed') score += 20;
    else if (confidenceState === 'exploring') score += 10;
    
    return Math.min(100, Math.round(score));
  },

  /**
   * Calculate overall score with weighted aggregation
   */
  calculateOverallScore(
    dsaScore: number,
    skillsScore: number,
    projectsScore: number,
    roadmapScore: number,
    benchmarkPercentile: number,
    roleAlignmentScore: number,
    isDegraded: boolean
  ): number {
    if (isDegraded) {
      // In degraded mode, reduce score by 20%
      const baseScore = (dsaScore * 0.25) + (skillsScore * 0.3) + (projectsScore * 0.25) + (roadmapScore * 0.2);
      return Math.round(baseScore * 0.8);
    }
    
    // Weighted aggregation
    let score = 0;
    score += dsaScore * 0.2; // 20% weight
    score += skillsScore * 0.3; // 30% weight
    score += projectsScore * 0.25; // 25% weight
    score += roadmapScore * 0.15; // 15% weight
    score += roleAlignmentScore * 0.1; // 10% weight
    
    // Adjust based on benchmark percentile (bonus for high performers)
    if (benchmarkPercentile >= 80) score += 5;
    else if (benchmarkPercentile >= 60) score += 2;
    else if (benchmarkPercentile < 20) score -= 5;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  },

  /**
   * Calculate confidence level
   */
  calculateConfidenceLevel(
    dsa: any,
    skills: any,
    projects: any,
    roadmap: any,
    benchmarks: any,
    isDegraded: boolean
  ): number {
    if (isDegraded) return 50; // Reduced confidence in degraded mode
    
    let confidence = 0;
    let componentCount = 0;
    
    const addComponentConfidence = (model: any) => {
      if (model && model.confidenceScore) {
        confidence += model.confidenceScore;
        componentCount++;
      }
    };
    
    addComponentConfidence(dsa);
    addComponentConfidence(skills);
    addComponentConfidence(projects);
    addComponentConfidence(roadmap);
    addComponentConfidence(benchmarks);
    
    if (componentCount === 0) return 0;
    
    return Math.round(confidence / componentCount);
  },

  /**
   * Generate scoring explanation
   */
  generateScoringExplanation(
    overallScore: number,
    dsaScore: number,
    skillsScore: number,
    projectsScore: number,
    roadmapScore: number,
    benchmarkPercentile: number,
    roleAlignmentScore: number,
    isDegraded: boolean
  ): string[] {
    const explanation: string[] = [];
    
    if (isDegraded) {
      explanation.push('Score calculated in degraded mode due to stale data');
    }
    
    explanation.push(`Overall readiness score: ${overallScore}/100`);
    explanation.push(`DSA performance: ${dsaScore}/100`);
    explanation.push(`Skills depth: ${skillsScore}/100`);
    explanation.push(`Projects credibility: ${projectsScore}/100`);
    explanation.push(`Roadmap progress: ${roadmapScore}/100`);
    explanation.push(`Role alignment: ${roleAlignmentScore}/100`);
    
    if (benchmarkPercentile > 0) {
      explanation.push(`Cohort percentile: ${benchmarkPercentile}%`);
    }
    
    // Add tier explanation
    if (overallScore >= 80) explanation.push('Strong readiness for target role');
    else if (overallScore >= 60) explanation.push('Ready for target role with minor gaps');
    else if (overallScore >= 40) explanation.push('Developing readiness - continue building');
    else if (overallScore >= 20) explanation.push('Early stage - foundational work needed');
    else explanation.push('Not ready - significant gaps identified');
    
    return explanation;
  },

  /**
   * Generate evidence chain
   */
  generateEvidenceChain(
    dsa: any,
    skills: any,
    projects: any,
    roadmap: any
  ): string[] {
    const chain: string[] = [];
    
    if (dsa?.totalSolves > 0) {
      chain.push(`DSA: ${dsa.totalSolves} problems solved with ${dsa.confidenceScore}% confidence`);
    }
    
    if (skills?.overallEngineeringDepth > 0) {
      chain.push(`Skills: ${skills.overallEngineeringDepth}% engineering depth across ${skills.domains?.length || 0} domains`);
    }
    
    if (projects?.projectCredibilityScore > 0) {
      chain.push(`Projects: ${projects.projectCredibilityScore}% credibility with ${projects.engineeringMaturity}% engineering maturity`);
    }
    
    if (roadmap?.verifiedNodes?.length > 0) {
      chain.push(`Roadmap: ${roadmap.verifiedNodes.length} skill nodes verified`);
    }
    
    if (chain.length === 0) {
      chain.push('No evidence available - complete onboarding to generate readiness score');
    }
    
    return chain;
  },

  /**
   * Determine readiness tier
   */
  determineReadinessTier(overallScore: number, confidenceLevel: number): 'not_ready' | 'early' | 'developing' | 'ready' | 'strong' {
    // Require minimum confidence for higher tiers
    if (confidenceLevel < 50) {
      if (overallScore >= 40) return 'developing';
      return 'not_ready';
    }
    
    if (overallScore >= 80) return 'strong';
    if (overallScore >= 60) return 'ready';
    if (overallScore >= 40) return 'developing';
    if (overallScore >= 20) return 'early';
    return 'not_ready';
  },
};
