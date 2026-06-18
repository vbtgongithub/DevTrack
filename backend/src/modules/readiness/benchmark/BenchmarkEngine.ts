import { ReadinessBenchmarks } from '../../../db/models/readinessBenchmarks.model.js';
import { ReadinessCore } from '../../../db/models/readinessCore.model.js';
import { CareerIntent } from '../../../db/models/careerIntent.model.js';
import { ReadinessDsa } from '../../../db/models/readinessDsa.model.js';
import { ReadinessSkills } from '../../../db/models/readinessSkills.model.js';
import { ReadinessProjects } from '../../../db/models/readinessProjects.model.js';
import { logger } from '../../../shared/logger.js';

export interface CombinedUserMetrics {
  totalSolves: number;
  hardProblemProgression: number;
  solveConsistency: number;
  overallEngineeringDepth: number;
  projectCredibilityScore: number;
  infrastructureSophistication: number;
  engineeringMaturity: number;
}

export interface CohortData {
  totalSolves: number[];
  hardProblemProgression: number[];
  solveConsistency: number[];
  overallEngineeringDepth: number[];
  projectCredibilityScore: number[];
  infrastructureSophistication: number[];
  engineeringMaturity: number[];
  sampleSize: number;
}

export interface BenchmarkInput {
  userId: string;
}

export interface CohortSegment {
  cohortId: string;
  cohortName: string;
  criteria: {
    targetRole?: string;
    experienceLevel?: 'fresher' | 'mid' | 'senior';
    graduationYear?: number;
    targetCompanyTier?: string;
  };
  sampleSize: number;
}

export interface PercentileRanking {
  metric: string;
  value: number;
  percentile: number; // 0-100
  cohortAverage: number;
  cohortMedian: number;
  cohortP90: number;
  cohortP75: number;
  cohortP25: number;
  cohortP10: number;
}

export interface RelativeComparison {
  metric: string;
  userValue: number;
  cohortPercentile: number;
  interpretation: 'above_average' | 'average' | 'below_average';
  gapToAverage: number;
  gapToP90: number;
}

export const BenchmarkEngine = {
  /**
   * Generate cohort-based benchmark intelligence with percentile rankings.
   * Uses deterministic statistical methods for fair comparisons.
   */
  async generateBenchmarks(input: BenchmarkInput): Promise<void> {
    try {
      const { userId } = input;
      
      // Fetch user's career intent for cohort segmentation
      const careerIntent = await CareerIntent.findOne({ userId });
      if (!careerIntent) {
        logger.warn('[BenchmarkEngine] No career intent found for user', { userId });
        return;
      }
      
      // Fetch user's readiness data
      const readinessCore = await ReadinessCore.findOne({ userId });
      if (!readinessCore) {
        logger.warn('[BenchmarkEngine] No readiness data found for user', { userId });
        return;
      }

      // Fetch user's detailed domain readiness records
      const [dsaRecord, skillsRecord, projectsRecord] = await Promise.all([
        ReadinessDsa.findOne({ userId }),
        ReadinessSkills.findOne({ userId }),
        ReadinessProjects.findOne({ userId }),
      ]);

      const combinedUserMetrics: CombinedUserMetrics = {
        totalSolves: dsaRecord?.totalSolves || 0,
        hardProblemProgression: dsaRecord?.hardProblemProgression || 0,
        solveConsistency: dsaRecord?.solveConsistency || 0,
        overallEngineeringDepth: skillsRecord?.overallEngineeringDepth || 0,
        projectCredibilityScore: projectsRecord?.projectCredibilityScore || 0,
        infrastructureSophistication: projectsRecord?.infrastructureSophistication || 0,
        engineeringMaturity: projectsRecord?.engineeringMaturity || 0,
      };
      
      // Determine cohort segment
      const cohortSegment = this.determineCohortSegment(careerIntent);
      
      // Fetch cohort data (in production, this would query aggregated cohort data)
      const cohortData = await this.fetchCohortData(cohortSegment);
      
      // Calculate percentile rankings for key metrics
      const percentileRankings = this.calculatePercentileRankings(combinedUserMetrics, cohortData);
      
      // Generate relative comparisons
      const relativeComparisons = this.generateRelativeComparisons(combinedUserMetrics, cohortData);
      
      // Calculate confidence level based on sample size
      const confidenceLevel = this.calculateConfidenceLevel(cohortData.sampleSize);
      
      // Calculate freshness timestamp
      const freshnessTimestamp = new Date();
      
      await ReadinessBenchmarks.findOneAndUpdate(
        { userId },
        {
          cohortSegments: [cohortSegment],
          percentileRankings,
          relativeComparisons,
          confidenceLevel,
          freshnessTimestamp,
          snapshotVersion: '1.0.0',
          analyticsVersion: '1.0.0',
          computedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      logger.info('[BenchmarkEngine] Successfully generated benchmarks', { 
        userId, 
        cohortId: cohortSegment.cohortId,
        sampleSize: cohortData.sampleSize 
      });
    } catch (error) {
      logger.error('[BenchmarkEngine] Failed to generate benchmarks', { input, error });
      throw error;
    }
  },

  /**
   * Determine cohort segment based on career intent
   */
  determineCohortSegment(careerIntent: any): CohortSegment {
    const { dreamRole, targetCompanyTier, timelineGoals } = careerIntent;
    
    // Determine experience level from timeline
    let experienceLevel: 'fresher' | 'mid' | 'senior' = 'fresher';
    if (timelineGoals?.graduationYear) {
      const currentYear = new Date().getFullYear();
      const yearsSinceGraduation = currentYear - timelineGoals.graduationYear;
      if (yearsSinceGraduation < 1) experienceLevel = 'fresher';
      else if (yearsSinceGraduation < 3) experienceLevel = 'mid';
      else experienceLevel = 'senior';
    }
    
    // Generate cohort ID
    const cohortId = `${dreamRole?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}-${experienceLevel}-${targetCompanyTier?.toLowerCase() || 'any'}`;
    
    return {
      cohortId,
      cohortName: `${dreamRole || 'Unknown'} - ${experienceLevel} - ${targetCompanyTier || 'Any Tier'}`,
      criteria: {
        targetRole: dreamRole,
        experienceLevel,
        graduationYear: timelineGoals?.graduationYear,
        targetCompanyTier,
      },
      sampleSize: 0, // Will be populated by fetchCohortData
    };
  },

  async fetchCohortData(cohortSegment: CohortSegment): Promise<CohortData> {
    // Note: In a fully scaled production environment, this should query a pre-aggregated collection
    // or use a targeted $match for the specific cohort criteria to limit memory footprint.
    // For now, we pull real data from ReadinessDsa, ReadinessSkills, and ReadinessProjects.
    const [dsaData, skillsData, projectsData] = await Promise.all([
      ReadinessDsa.find({}, 'totalSolves hardProblemProgression solveConsistency').lean(),
      ReadinessSkills.find({}, 'overallEngineeringDepth').lean(),
      ReadinessProjects.find({}, 'projectCredibilityScore infrastructureSophistication engineeringMaturity').lean(),
    ]);

    const sampleSize = Math.max(dsaData.length, skillsData.length, projectsData.length, 1);

    return {
      totalSolves: dsaData.map(d => d.totalSolves || 0),
      hardProblemProgression: dsaData.map(d => d.hardProblemProgression || 0),
      solveConsistency: dsaData.map(d => d.solveConsistency || 0),
      overallEngineeringDepth: skillsData.map(s => s.overallEngineeringDepth || 0),
      projectCredibilityScore: projectsData.map(p => p.projectCredibilityScore || 0),
      infrastructureSophistication: projectsData.map(p => p.infrastructureSophistication || 0),
      engineeringMaturity: projectsData.map(p => p.engineeringMaturity || 0),
      sampleSize,
    };
  },

  /**
   * Calculate percentile rankings for key metrics
   */
  calculatePercentileRankings(readinessCore: CombinedUserMetrics, cohortData: CohortData): PercentileRanking[] {
    const rankings: PercentileRanking[] = [];
    
    const metrics: Array<{ key: keyof CombinedUserMetrics; name: string }> = [
      { key: 'totalSolves', name: 'Total DSA Solves' },
      { key: 'hardProblemProgression', name: 'Hard Problem Progression' },
      { key: 'solveConsistency', name: 'Solve Consistency' },
      { key: 'overallEngineeringDepth', name: 'Overall Engineering Depth' },
      { key: 'projectCredibilityScore', name: 'Project Credibility' },
      { key: 'infrastructureSophistication', name: 'Infrastructure Sophistication' },
      { key: 'engineeringMaturity', name: 'Engineering Maturity' },
    ];
    
    for (const metric of metrics) {
      const userValue = readinessCore[metric.key] || 0;
      const cohortValues = cohortData[metric.key] || [];
      
      if (cohortValues.length === 0) continue;
      
      const percentile = this.calculatePercentile(userValue, cohortValues);
      const cohortAverage = this.calculateAverage(cohortValues);
      const cohortMedian = this.calculateMedian(cohortValues);
      const cohortP90 = this.calculatePercentileValue(cohortValues, 90);
      const cohortP75 = this.calculatePercentileValue(cohortValues, 75);
      const cohortP25 = this.calculatePercentileValue(cohortValues, 25);
      const cohortP10 = this.calculatePercentileValue(cohortValues, 10);
      
      rankings.push({
        metric: metric.name,
        value: userValue,
        percentile,
        cohortAverage,
        cohortMedian,
        cohortP90,
        cohortP75,
        cohortP25,
        cohortP10,
      });
    }
    
    return rankings;
  },

  /**
   * Calculate percentile for a value in a distribution
   */
  calculatePercentile(value: number, distribution: number[]): number {
    if (distribution.length === 0) return 0;
    
    const sorted = [...distribution].sort((a, b) => a - b);
    const rank = sorted.filter(v => v <= value).length;
    const percentile = (rank / sorted.length) * 100;
    
    return Math.round(percentile);
  },

  /**
   * Calculate percentile value at a given percentile
   */
  calculatePercentileValue(distribution: number[], percentile: number): number {
    if (distribution.length === 0) return 0;
    
    const sorted = [...distribution].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  },

  /**
   * Calculate average of a distribution
   */
  calculateAverage(distribution: number[]): number {
    if (distribution.length === 0) return 0;
    const sum = distribution.reduce((a, b) => a + b, 0);
    return Math.round(sum / distribution.length);
  },

  /**
   * Calculate median of a distribution
   */
  calculateMedian(distribution: number[]): number {
    if (distribution.length === 0) return 0;
    
    const sorted = [...distribution].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    } else {
      return sorted[mid];
    }
  },

  /**
   * Generate relative comparisons
   */
  generateRelativeComparisons(readinessCore: CombinedUserMetrics, cohortData: CohortData): RelativeComparison[] {
    const comparisons: RelativeComparison[] = [];
    
    const metrics: Array<{ key: keyof CombinedUserMetrics; name: string }> = [
      { key: 'totalSolves', name: 'Total DSA Solves' },
      { key: 'hardProblemProgression', name: 'Hard Problem Progression' },
      { key: 'overallEngineeringDepth', name: 'Overall Engineering Depth' },
      { key: 'engineeringMaturity', name: 'Engineering Maturity' },
    ];
    
    for (const metric of metrics) {
      const userValue = readinessCore[metric.key] || 0;
      const cohortValues = cohortData[metric.key] || [];
      
      if (cohortValues.length === 0) continue;
      
      const percentile = this.calculatePercentile(userValue, cohortValues);
      const cohortAverage = this.calculateAverage(cohortValues);
      const cohortP90 = this.calculatePercentileValue(cohortValues, 90);
      
      let interpretation: 'above_average' | 'average' | 'below_average';
      if (percentile >= 70) interpretation = 'above_average';
      else if (percentile >= 30) interpretation = 'average';
      else interpretation = 'below_average';
      
      comparisons.push({
        metric: metric.name,
        userValue,
        cohortPercentile: percentile,
        interpretation,
        gapToAverage: userValue - cohortAverage,
        gapToP90: userValue - cohortP90,
      });
    }
    
    return comparisons;
  },

  /**
   * Calculate confidence level based on sample size
   */
  calculateConfidenceLevel(sampleSize: number): number {
    // Confidence level increases with sample size
    // Using a sigmoid-like function for smooth transitions
    if (sampleSize < 30) return 50;
    if (sampleSize < 100) return 70;
    if (sampleSize < 300) return 85;
    return 95;
  },
};
