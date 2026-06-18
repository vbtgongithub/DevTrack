import { z } from 'zod';

export const recommendationItemZodSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  priority: z.number().min(0).max(100),
  actionableSteps: z.array(z.string()),
  estimatedImpact: z.string(),
  category: z.enum(['Resume Improvements', 'Skill Gaps', 'Career Alignment', 'Interview Readiness'])
});

export const recommendationOutputZodSchema = z.object({
  recommendations: z.array(recommendationItemZodSchema),
  priorityScore: z.number().min(0).max(100)
});

export type RecommendationItem = z.infer<typeof recommendationItemZodSchema>;
export type RecommendationOutput = z.infer<typeof recommendationOutputZodSchema>;
