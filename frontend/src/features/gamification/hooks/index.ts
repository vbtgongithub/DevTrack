// ============================================================================
// hooks/index.ts — Gamification Hooks Exports
// ============================================================================

export { useXpState, useXpHistory, useXpTransactions, xpQueryKeys } from './useXpState';
export { useStreakState, useStreakHistory, useStreakMilestones, streakQueryKeys } from './useStreakState';
export { useGamificationSSE } from './useGamificationSSE';

export type { UseXpStateReturn } from './useXpState';
export type { UseStreakStateReturn } from './useStreakState';
