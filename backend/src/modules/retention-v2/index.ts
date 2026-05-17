// src/modules/retention-v2/index.ts — Retention Tuning + Live Operations barrel
// Phase-D: Behavioral operations layer

// Profile
export { RetentionProfile, type BehavioralState } from './profile/retentionProfile.model.js';
export { retentionProfileService } from './profile/retentionProfile.service.js';

// Fatigue
export { fatigueSuppressionService, type SuppressionConfig, type FatigueIndicators } from './fatigue/fatigueSuppression.service.js';

// Pacing
export { emotionalPacingService, type PacingConfig, type RewardTiming } from './pacing/emotionalPacing.service.js';

// Economy
export { liveEconomyControl, DEFAULT_TUNING, TUNING_PRESETS, type EconomyTuning } from './economy/liveEconomyControl.service.js';

// Notifications
export { notificationFatigueService, type NotificationDecision, type NotificationHealth } from './notifications/notificationFatigue.service.js';

// Safety
export { retentionSafetyService, type SafetyViolation, type SafetyCheckResult } from './safety/retentionSafety.service.js';