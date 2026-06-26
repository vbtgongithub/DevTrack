// src/shared/controllerUtils.ts — Shared controller helpers to eliminate
// duplicated auth-guard + try/catch + error-logging boilerplate.

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { ApiResponse } from './response.js';
import { logger } from './logger.js';

type AuthHandler = (userId: string, req: AuthenticatedRequest, res: Response) => Promise<void>;

/**
 * Wraps an authenticated controller method:
 *  1. Extracts `userId` from `req.user` (returns 401 if missing).
 *  2. Catches any thrown error, logs it, and returns a 500 via `ApiResponse`.
 *
 * Usage:
 *   getStreak: withAuth('[streak]', 'get streak', async (userId, req, res) => {
 *     const status = await getStreakStatus(userId);
 *     ApiResponse.success(res, status);
 *   }),
 */
export function withAuth(tag: string, action: string, handler: AuthHandler) {
  return async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    try {
      await handler(userId, req, res);
    } catch (err) {
      logger.error(`${tag} Failed to ${action}`, err, { userId });
      ApiResponse.error(res, `Failed to ${action}`);
    }
  };
}
