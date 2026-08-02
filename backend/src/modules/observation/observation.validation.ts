// src/modules/observation/observation.validation.ts
import { z } from 'zod';

export const sessionStartSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    viewport: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
    }).optional(),
    deviceType: z.string().optional(),
  }).optional().default({}),
});

export const sessionEndSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

export const telemetryEventsSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  events: z.array(
    z.object({
      timestamp: z.union([z.string(), z.number()]).optional(),
      event: z.string().min(1),
      properties: z.record(z.string(), z.unknown()).optional(),
    })
  ).min(1, 'events array cannot be empty'),
});
