import { Router } from 'express';
import { z } from 'zod';
import { trackEvent, submitFeedback, getDashboardMetrics } from './analytics.controller';
import { validateBody } from '../../middleware/validation';
import { rateLimiters } from '../../middleware/rateLimitAdvanced';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';

const router = Router();

// Zod schemas for validation
const eventSchema = z.object({
  eventName: z.string().min(1).max(100),
  properties: z.record(z.any()).optional().default({}),
});

const feedbackSchema = z.object({
  rating: z.string().min(1).max(10),
  feedback: z.string().max(1000).optional(),
  page: z.string().min(1).max(100),
});

// Mount rate limiter on all analytics routes
router.use(rateLimiters.analytics);

// We allow these to be called without auth to catch early drop-offs, but you could add the authMiddleware if strict tracking is required
router.post('/event', validateBody(eventSchema), trackEvent);
router.post('/feedback', validateBody(feedbackSchema), submitFeedback);

// Dashboard exposes aggregate funnel metrics and user feedback — admin only
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardMetrics);

export default router;
