// src/modules/daily-challenge/daily-challenge.controller.ts
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/index.js';
import { getTodayChallenge } from './daily-challenge.service.js';

export async function handleGetTodayChallenge(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.id;
  try {
    const data = await getTodayChallenge(userId);
    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
}
