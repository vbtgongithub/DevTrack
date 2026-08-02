// src/modules/readiness/readiness.validation.ts
import { z } from 'zod';

export const setCareerIntentSchema = z.object({
  dreamRole: z.string().optional(),
  targetRole: z.string().optional(),
  goal: z.string().optional(),
  experienceLevel: z.string().optional(),
  weeklyHours: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  targetPackage: z.string().optional(),
  targetCompanyTier: z.string().optional(),
  timelineGoals: z.any().optional(),
});

export const setSkillProgressSchema = z.object({
  skill: z.string().min(1, 'Skill is required'),
  completed: z.boolean().optional(),
});
