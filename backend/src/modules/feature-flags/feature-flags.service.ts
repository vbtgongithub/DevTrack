// src/modules/feature-flags/feature-flags.service.ts — Feature flag injection system
// Environment-based flags injected into auth/session responses.

import { env } from '../../config/env.js';

// Feature flag names as specified in prompt.md
export enum FeatureFlag {
  FEAT_GAMIFICATION_ENABLED = 'FEAT_GAMIFICATION_ENABLED',
  FEAT_STREAK_ENGINE_V2 = 'FEAT_STREAK_ENGINE_V2',
  FEAT_PRODUCTIVITY_TOOLS = 'FEAT_PRODUCTIVITY_TOOLS',
  FEAT_AI_INSIGHTS = 'FEAT_AI_INSIGHTS',
  FEAT_PLACEMENT_SCORE = 'FEAT_PLACEMENT_SCORE',
}

// Feature flag configuration - controlled by environment
const FLAG_CONFIG: Record<FeatureFlag, { enabled: boolean; rolloutPercent?: number }> = {
  [FeatureFlag.FEAT_GAMIFICATION_ENABLED]: {
    enabled: env.IS_DEV || process.env.FEAT_GAMIFICATION_ENABLED === 'true',
  },
  [FeatureFlag.FEAT_STREAK_ENGINE_V2]: {
    enabled: env.IS_DEV || process.env.FEAT_STREAK_ENGINE_V2 === 'true',
  },
  [FeatureFlag.FEAT_PRODUCTIVITY_TOOLS]: {
    enabled: env.IS_DEV || process.env.FEAT_PRODUCTIVITY_TOOLS === 'true',
  },
  [FeatureFlag.FEAT_AI_INSIGHTS]: {
    enabled: env.IS_DEV || process.env.FEAT_AI_INSIGHTS === 'true',
  },
  [FeatureFlag.FEAT_PLACEMENT_SCORE]: {
    enabled: env.IS_DEV || process.env.FEAT_PLACEMENT_SCORE === 'true',
  },
};

export interface FeatureFlags extends Record<string, boolean> {
  FEAT_GAMIFICATION_ENABLED: boolean;
  FEAT_STREAK_ENGINE_V2: boolean;
  FEAT_PRODUCTIVITY_TOOLS: boolean;
  FEAT_AI_INSIGHTS: boolean;
  FEAT_PLACEMENT_SCORE: boolean;
}

// Get all feature flags for a user
export function getFeatureFlags(): FeatureFlags {
  return {
    [FeatureFlag.FEAT_GAMIFICATION_ENABLED]: FLAG_CONFIG[FeatureFlag.FEAT_GAMIFICATION_ENABLED].enabled,
    [FeatureFlag.FEAT_STREAK_ENGINE_V2]: FLAG_CONFIG[FeatureFlag.FEAT_STREAK_ENGINE_V2].enabled,
    [FeatureFlag.FEAT_PRODUCTIVITY_TOOLS]: FLAG_CONFIG[FeatureFlag.FEAT_PRODUCTIVITY_TOOLS].enabled,
    [FeatureFlag.FEAT_AI_INSIGHTS]: FLAG_CONFIG[FeatureFlag.FEAT_AI_INSIGHTS].enabled,
    [FeatureFlag.FEAT_PLACEMENT_SCORE]: FLAG_CONFIG[FeatureFlag.FEAT_PLACEMENT_SCORE].enabled,
  };
}

// Check if a specific flag is enabled
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FLAG_CONFIG[flag]?.enabled ?? false;
}

// Check if flag is enabled for a specific user (supports rollout percentage)
export function isFeatureEnabledForUser(flag: FeatureFlag, userId: string): boolean {
  const config = FLAG_CONFIG[flag];
  if (!config.enabled) return false;

  // If rollout percentage is set, use deterministic hash for consistent rollout
  if (config.rolloutPercent !== undefined && config.rolloutPercent < 100) {
    // Simple hash-based rollout
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bucket = hash % 100;
    return bucket < config.rolloutPercent;
  }

  return true;
}