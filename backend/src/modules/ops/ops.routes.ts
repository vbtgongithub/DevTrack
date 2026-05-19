// src/modules/ops/ops.routes.ts — Operational routes (admin)
import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';
import opsController from './ops.controller.js';

const router = Router();

// Health check remains public for load balancers
router.get('/health', opsController.health);

// Metrics and ops require admin
router.get('/metrics', authMiddleware, adminMiddleware, opsController.metrics);

// Queue management (admin only)
router.get('/queues/:queueName', authMiddleware, adminMiddleware, opsController.queueStatus);
router.get('/queues/:queueName/jobs', authMiddleware, adminMiddleware, opsController.recentJobs);
router.post('/queues/:queueName/jobs/:jobId/replay', authMiddleware, adminMiddleware, opsController.replayDlqJob);

// Cache management (admin only)
router.get('/cache/stats', authMiddleware, adminMiddleware, opsController.cacheStats);
router.delete('/cache/users/:userId', authMiddleware, adminMiddleware, opsController.clearUserCache);

// Logging (admin only)
router.post('/logging', authMiddleware, adminMiddleware, opsController.setLogLevel);

export const opsRoutes = router;