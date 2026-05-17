// src/modules/feature-flags/index.ts — Feature flags module barrel export
export {
  FeatureFlag,
  getFeatureFlags,
  isFeatureEnabled,
  isFeatureEnabledForUser,
  type FeatureFlags,
} from './feature-flags.service.js';