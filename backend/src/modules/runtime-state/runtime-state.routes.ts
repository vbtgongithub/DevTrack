// src/modules/runtime-state/runtime-state.routes.ts — Runtime State API routes
import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../../middleware/index.js';
import { runtimeStateController } from './runtime-state.controller.js';

const router = Router();

// GET /api/runtime-state — get unified runtime state
router.get('/', authMiddleware, runtimeStateController.getRuntimeState.bind(runtimeStateController));

// POST /api/runtime-state/rebuild — force rebuild runtime state
router.post('/rebuild', authMiddleware, adminMiddleware, runtimeStateController.rebuildRuntimeState.bind(runtimeStateController));

// POST /api/runtime-state/invalidate — invalidate runtime state
router.post('/invalidate', authMiddleware, adminMiddleware, runtimeStateController.invalidateRuntimeState.bind(runtimeStateController));

export const runtimeStateRoutes = router;
