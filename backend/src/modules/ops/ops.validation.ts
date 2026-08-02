// src/modules/ops/ops.validation.ts
import { z } from 'zod';

export const setLogLevelSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']),
});
