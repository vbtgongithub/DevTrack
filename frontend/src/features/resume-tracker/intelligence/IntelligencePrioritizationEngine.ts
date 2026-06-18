import type { EngineeringSignal, CredibilityGap, ResumeRecommendation } from '../types/resumeContracts';

// Utility functions to sort and prioritize intelligence items

export const prioritizeSignals = (signals: EngineeringSignal[]): EngineeringSignal[] => {
  const strengthWeight: Record<EngineeringSignal['strength'], number> = { strong: 3, moderate: 2, weak: 1 };
  return [...signals].sort((a, b) => strengthWeight[b.strength] - strengthWeight[a.strength]);
};

export const prioritizeCredibilityGaps = (gaps: CredibilityGap[]): CredibilityGap[] => {
  const severityWeight: Record<CredibilityGap['severity'], number> = { high: 3, medium: 2, low: 1 };
  return [...gaps].sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
};

export const prioritizeRecommendations = (recommendations: ResumeRecommendation[]): ResumeRecommendation[] => {
  const impactWeight: Record<ResumeRecommendation['impact'], number> = { high: 3, medium: 2, low: 1 };
  return [...recommendations].sort((a, b) => impactWeight[b.impact] - impactWeight[a.impact]);
};
