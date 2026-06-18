// gamificationStore.ts — Consolidated store delegator for backward compatibility
import { useProgressionStore, getLevelInfo, isMaxLevel, LEVEL_NAMES } from './progressionStore.js';
import type { AchievementPayload, ChallengeCompletedPayload, LevelUpData, OverlayItem, OverlayType } from './progressionStore.js';

export { getLevelInfo, isMaxLevel, LEVEL_NAMES };
export type { AchievementPayload, ChallengeCompletedPayload, LevelUpData, OverlayItem, OverlayType };

export const useGamificationStore = useProgressionStore;
