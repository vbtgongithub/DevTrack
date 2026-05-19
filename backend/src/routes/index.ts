// src/routes/index.ts - Route composition
import { Router } from 'express';
import { rateLimit } from '../middleware/rateLimit.js';
import { env } from '../config/index.js';
import { authRoutes } from '../modules/auth/index.js';
import { dashboardRoutes } from '../modules/dashboard/index.js';
import { dsaRoutes } from '../modules/dsa/index.js';
import { activityRoutes } from '../modules/activity/index.js';
import { projectsRoutes } from '../modules/projects/index.js';
import { profileRoutes } from '../modules/profile/index.js';
import { settingsRoutes } from '../modules/settings/index.js';
import { syncRoutes } from '../modules/platform-sync/index.js';
import { handleSseRequest } from '../shared/sse/index.js';
import { xpRoutes } from '../modules/xp/xp.routes.js';
import { streakRoutes } from '../modules/streak/index.js';
import { opsRoutes } from '../modules/ops/ops.routes.js';
import { runtimeStateRoutes } from '../modules/runtime-state/index.js';
import { observationRoutes } from '../modules/observation/index.js';
import missionsRoutes from '../modules/missions/missions.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import onboardingRoutes from '../modules/onboarding/onboarding.routes.js';

const router = Router();

// Global rate limit for all API endpoints (less strict than auth endpoints)
const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests. Please slow down.',
});

// Apply global rate limiting to all routes
router.use(globalRateLimit);

// Auth routes (no auth required for login/register)
router.use('/auth', authRoutes);

// SSE endpoint — auth via ?token= query param (EventSource limitation)
router.get('/events', handleSseRequest);

// Protected routes
router.use('/dashboard', dashboardRoutes);
router.use('/dsa', dsaRoutes);
router.use('/activity', activityRoutes);
router.use('/projects', projectsRoutes);
router.use('/profile', profileRoutes);
router.use('/settings', settingsRoutes);
router.use('/platforms', syncRoutes);
router.use('/xp', xpRoutes);
router.use('/streak', streakRoutes);
router.use('/ops', opsRoutes);
router.use('/runtime-state', runtimeStateRoutes);
router.use('/observation', observationRoutes);
router.use('/missions', missionsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/onboarding', onboardingRoutes);

export default router;