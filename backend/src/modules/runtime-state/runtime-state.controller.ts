// src/modules/runtime-state/runtime-state.controller.ts — Runtime State Controller
// Exposes unified runtime state API endpoint

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { unifiedRuntimeStateService } from './unifiedRuntimeState.service.js';
import { logger } from '../../shared/logger.js';

export class RuntimeStateController {
  /**
   * GET /api/runtime-state
   * Get the unified runtime state for the authenticated user
   */
  async getRuntimeState(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const state = await unifiedRuntimeStateService.getRuntimeStateFresh(userId);
      
      res.json({
        success: true,
        data: state,
      });
    } catch (error) {
      logger.error('[runtime-state] Failed to get runtime state', { error });
      next(error);
    }
  }

  /**
   * POST /api/runtime-state/rebuild
   * Force rebuild of runtime state (for debugging or manual sync)
   */
  async rebuildRuntimeState(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const state = await unifiedRuntimeStateService.rebuildRuntimeState(userId);
      
      res.json({
        success: true,
        data: state,
      });
    } catch (error) {
      logger.error('[runtime-state] Failed to rebuild runtime state', { error });
      next(error);
    }
  }

  /**
   * POST /api/runtime-state/invalidate
   * Invalidate runtime state (force rebuild on next access)
   */
  async invalidateRuntimeState(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await unifiedRuntimeStateService.invalidateState(userId);
      
      res.json({
        success: true,
        message: 'Runtime state invalidated',
      });
    } catch (error) {
      logger.error('[runtime-state] Failed to invalidate runtime state', { error });
      next(error);
    }
  }
}

export const runtimeStateController = new RuntimeStateController();
