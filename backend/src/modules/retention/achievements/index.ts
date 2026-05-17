// src/modules/retention/achievements/index.ts — Achievement Engine barrel export
export { Achievement, type IAchievement, type AchievementRarity, type AchievementCategory } from './achievement.model.js';
export { ACHIEVEMENT_TEMPLATES, getTemplateById, getTemplatesByCategory, getTemplatesByRarity, getHiddenTemplates, type AchievementTemplate } from './achievement.templates.js';
export { achievementService, type AchievementEvaluationResult, type RarityBreakdown } from './achievement.service.js';