// src/modules/streak/streak.controller.ts — Streak API controller
import { Response } from 'express';
import { getStreakStatus, recordActivity, activateStreakFreeze } from './streak.service.js';
import type { StreakType } from '../../db/models/index.js';
import { ApiResponse } from '../../shared/response.js';
import { logger } from '../../shared/logger.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

const VALID_STREAK_TYPES = ['dsa', 'github', 'unified', 'focus'] as const;

export const streakController = {
  async getStreak(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    try {
      const status = await getStreakStatus(userId);
      ApiResponse.success(res, status);
    } catch (err) {
      logger.error('[streak] Failed to get streak', err as Error, { userId });
      ApiResponse.error(res, 'Failed to get streak status');
    }
  },

  async getStreakByType(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const { type } = req.params;

    if (!VALID_STREAK_TYPES.includes(type as StreakType)) {
      ApiResponse.badRequest(res, 'Invalid streak type. Use: dsa, github, unified, or focus');
      return;
    }

    try {
      const status = await getStreakStatus(userId, type as StreakType);
      ApiResponse.success(res, status);
    } catch (err) {
      logger.error('[streak] Failed to get streak by type', err as Error, { userId, type });
      ApiResponse.error(res, 'Failed to get streak status');
    }
  },

  async recordActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const { streakType, source, activityDate, timezone, metadata } = req.body as {
      streakType?: string;
      source?: string;
      activityDate?: string;
      timezone?: string;
      metadata?: Record<string, unknown>;
    };

    if (!streakType || !source) {
      ApiResponse.badRequest(res, 'streakType and source are required');
      return;
    }

    if (!VALID_STREAK_TYPES.includes(streakType as StreakType)) {
      ApiResponse.badRequest(res, 'Invalid streak type');
      return;
    }

    try {
      await recordActivity({
        userId,
        streakType: streakType as StreakType,
        source,
        activityDate: activityDate ? new Date(activityDate) : undefined,
        timezone,
        metadata,
      });
      ApiResponse.success(res, { recorded: true });
    } catch (err) {
      logger.error('[streak] Failed to record activity', err as Error, { userId, streakType });
      ApiResponse.error(res, 'Failed to record activity');
    }
  },

  async activateFreeze(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    try {
      await activateStreakFreeze(userId);
      ApiResponse.success(res, { freezeActivated: true });
    } catch (err) {
      logger.error('[streak] Failed to activate freeze', err as Error, { userId });
      ApiResponse.error(res, 'Failed to activate streak freeze');
    }
  },
};