// src/modules/ops/ops.routes.ts — Operational routes (admin)
import { Router } from 'express';
import { adminMiddleware } from '../../middleware/auth.js';
import opsController from './ops.controller.js';

const router = Router();

// Note: These routes should be protected by admin middleware in production
// For now, we'll add basic protection

// Health and metrics (public for load balancers)
router.get('/health', opsController.health);
router.get('/metrics', opsController.metrics);

// Queue management (admin only)
router.get('/queues/:queueName', adminMiddleware, opsController.queueStatus);
router.get('/queues/:queueName/jobs', adminMiddleware, opsController.recentJobs);
router.post('/queues/:queueName/jobs/:jobId/replay', adminMiddleware, opsController.replayDlqJob);

// Cache management (admin only)
router.get('/cache/stats', adminMiddleware, opsController.cacheStats);
router.delete('/cache/users/:userId', adminMiddleware, opsController.clearUserCache);

// Logging (admin only)
router.post('/logging', adminMiddleware, opsController.setLogLevel);

// Closed Beta Management (admin only)
router.get('/beta/status', adminMiddleware, opsController.getBetaStatus);
router.post('/beta/cohorts', adminMiddleware, opsController.createBetaCohort);
router.post('/beta/invites', adminMiddleware, opsController.generateInviteCode);

// Feature Gates (admin only)
router.get('/feature-gates', adminMiddleware, opsController.getFeatureGates);
router.post('/feature-gates/configure', adminMiddleware, opsController.configureFeatureGate);
router.post('/feature-gates/toggle', adminMiddleware, opsController.toggleFeatureGate);

// Kill Switches (admin only)
router.get('/kill-switches', adminMiddleware, opsController.getKillSwitches);
router.post('/kill-switches/toggle', adminMiddleware, opsController.toggleKillSwitch);

// Retention Command Center (admin only)
router.get('/retention/dashboard', adminMiddleware, opsController.getRetentionDashboard);

export const opsRoutes = router;