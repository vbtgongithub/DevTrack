// src/modules/streak/index.ts — Streak module barrel export
export { streakController } from './streak.controller.js';
export { streakRoutes } from './streak.routes.js';
export {
  getStreakStatus,
  recordActivity,
  activateStreakFreeze,
  getUnifiedStreak,
  recalculateStreak,
  type StreakStatus,
  type RecordActivityPayload,
} from './streak.service.js';
export type { StreakType } from '../../db/models/index.js';