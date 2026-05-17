// src/modules/retention/goals/index.ts — Goal Engine barrel export
export { Goal, type IGoal, type GoalType, type GoalCategory, type GoalDifficulty, type GoalStatus } from './goal.model.js';
export { goalGenerator, type UserStats } from './goal.generator.js';
export { goalService, type GoalProgressSummary, type GoalCompletionResult } from './goal.service.js';