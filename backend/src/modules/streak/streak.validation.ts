// src/modules/streak/streak.validation.ts
import { z } from 'zod';

export const recordActivitySchema = z.object({
  streakType: z.enum(['dsa', 'github', 'unified', 'focus']),
  source: z.string().min(1),
  activityDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  timezone: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
