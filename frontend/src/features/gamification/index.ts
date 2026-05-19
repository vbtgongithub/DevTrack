// ============================================================================
// gamification/index.ts — Gamification Feature Exports
// ============================================================================

// Components
export { XpProgressWidget } from './components/XpProgressWidget';
export { WeeklyMomentumBar } from './components/WeeklyMomentumBar';
export { XpGainFloat } from './components/XpGainFloat';

// Overlays
export { LevelUpOverlay } from './overlays/LevelUpOverlay';
export { StreakMilestoneOverlay } from './overlays/StreakMilestoneOverlay';
export { AchievementUnlockOverlay } from './overlays/AchievementUnlockOverlay';

// Hooks
export {
  useXpState,
  useXpHistory,
  useXpTransactions,
  xpQueryKeys,
  useStreakState,
  useStreakHistory,
  useStreakMilestones,
  streakQueryKeys,
  useGamificationSSE,
} from './hooks';

export type { UseXpStateReturn, UseStreakStateReturn } from './hooks';
