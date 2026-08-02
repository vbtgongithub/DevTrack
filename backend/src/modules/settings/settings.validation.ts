// src/modules/settings/settings.validation.ts
import { z } from 'zod';

const platformFieldSchema = z.object({
  username: z.string().max(100).optional(),
  handle: z.string().max(100).optional(),
}).strict();

export const updateSettingsSchema = z.object({
  platforms: z.object({
    github: platformFieldSchema.optional(),
    codeforces: platformFieldSchema.optional(),
    leetcode: platformFieldSchema.optional(),
    codechef: platformFieldSchema.optional(),
  }).strict().optional(),
}).strict();
