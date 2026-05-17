// src/modules/retention/index.ts — Retention Engine barrel export
// Phase-C: Complete Retention + Engagement Engine

// Goals - Phase-C1
export { goalService, goalGenerator, Goal, type IGoal, type GoalType, type GoalCategory, type GoalDifficulty } from './goals/index.js';

// Economy - Phase-C1
export { progressionEconomy, DEFAULT_ECONOMY_CONFIG, type EconomyConfig, type UserEconomyState } from './economy/index.js';

// Orchestration - Phase-C1
export { eventOrchestration, type RetentionEvent, type RetentionEventType } from './orchestration/index.js';

// Challenges - Phase-C2
export { challengeService, challengeGenerator, Challenge, type IChallenge, type ChallengeType, type ChallengeRarity } from './challenges/index.js';

// Achievements - Phase-C2
export { achievementService, ACHIEVEMENT_TEMPLATES, Achievement, type IAchievement, type AchievementRarity } from './achievements/index.js';

// Psychology - Phase-C3 (placeholder exports for remaining phases)
export { retentionPsychology } from './psychology/index.js';

// Analytics - Phase-C3
export { momentumAnalytics } from './analytics/index.js';

// Onboarding - Phase-C3
export { onboardingService } from './onboarding/index.js';

// Experiments - Phase-C5
export { experimentationService } from './experiments/index.js';