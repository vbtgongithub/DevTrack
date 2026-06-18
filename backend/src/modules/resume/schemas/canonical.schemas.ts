// src/modules/resume-intelligence/schemas/canonical.schemas.ts
import { z } from 'zod';

/**
 * InfrastructureSignalSchema
 * Canonical features for infrastructure maturity
 */
export const InfrastructureSignalSchema = z.object({
  dockerUsage: z.boolean(),
  cicdPipeline: z.boolean(),
  cloudDeployment: z.boolean(),
  monitoring: z.boolean(),
  testing: z.boolean(),
  orchestration: z.boolean(),
  iacUsage: z.boolean(),
  score: z.number().min(0).max(100),
});

/**
 * EngineeringSignalSchema
 * Standardized engineering activity features
 */
export const EngineeringSignalSchema = z.object({
  commitFrequency: z.number(),
  prQuality: z.number().min(0).max(10),
  codeComplexity: z.number().min(0).max(10),
  documentationMaturity: z.number().min(0).max(10),
  architectureDiversity: z.number().min(0).max(10),
  score: z.number().min(0).max(100),
});

/**
 * ProjectMaturitySchema
 * Canonical features for individual project depth
 */
export const ProjectMaturitySchema = z.object({
  depth: z.number().min(0).max(10),
  completeness: z.number().min(0).max(10),
  productionReadiness: z.number().min(0).max(10),
  communityValidation: z.number().min(0).max(10),
  stackModernity: z.number().min(0).max(10),
  totalCommits: z.number(),
  daysActive: z.number(),
});

/**
 * ATSFeatureSchema
 * Standardized features for ATS compatibility
 */
export const ATSFeatureSchema = z.object({
  parsingSuccess: z.boolean(),
  keywordDensity: z.record(z.string(), z.number()),
  sectionIntegrity: z.number().min(0).max(100),
  formattingSafety: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
});

/**
 * ResumeFeatureSchema
 * Aggregated features of a generated resume
 */
export const ResumeFeatureSchema = z.object({
  contentDepth: z.number().min(0).max(100),
  roleAlignment: z.number().min(0).max(100),
  recruiterClarity: z.number().min(0).max(100),
  actionVerbDensity: z.number(),
  impactClaimCount: z.number(),
  totalEvidenceLinkage: z.number(),
});

/**
 * RoadmapFeatureSchema
 * Progression features from user roadmap
 */
export const RoadmapFeatureSchema = z.object({
  completionRate: z.number().min(0).max(100),
  velocity: z.number(),
  skillProgression: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100),
});

/**
 * CredibilityFeatureSchema
 * Canonical features for engineering trust
 */
export const CredibilityFeatureSchema = z.object({
  evidenceCoverage: z.number().min(0).max(100),
  verifiedClaimRatio: z.number().min(0).max(1),
  unsupportedClaimCount: z.number(),
  sourceTraceability: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

/**
 * PlacementSignalSchema
 * Standardized signals for placement success
 */
export const PlacementSignalSchema = z.object({
  interviewRate: z.number().min(0).max(1),
  offerRate: z.number().min(0).max(1),
  marketDemand: z.number().min(0).max(100),
  salaryBenchmarkPercentile: z.number().min(0).max(100),
});

// Infer types
export type IInfrastructureSignal = z.infer<typeof InfrastructureSignalSchema>;
export type IEngineeringSignal = z.infer<typeof EngineeringSignalSchema>;
export type IProjectMaturity = z.infer<typeof ProjectMaturitySchema>;
export type IATSFeature = z.infer<typeof ATSFeatureSchema>;
export type IResumeFeature = z.infer<typeof ResumeFeatureSchema>;
export type IRoadmapFeature = z.infer<typeof RoadmapFeatureSchema>;
export type ICredibilityFeature = z.infer<typeof CredibilityFeatureSchema>;
export type IPlacementSignal = z.infer<typeof PlacementSignalSchema>;
