import { Request, Response } from 'express';
import { CoachingService } from './coaching.service.js';
import { ReflectionService } from './reflection.service.js';
import { momentumEngine } from '../observation/momentumEngine.service.js';
import { FocusIntelligenceService } from '../observation/focusIntelligence.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

export class CoachingController {
  static async getInsights(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const insights = await CoachingService.generateCoachingInsights(userId);
    const emotionalState = await CoachingService.detectEmotionalState(userId);

    res.json({
      success: true,
      data: {
        insights,
        emotionalState
      }
    });
  }

  static async getReflections(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const reflection = await ReflectionService.generateWeeklyReflection(userId);

    res.json({
      success: true,
      data: reflection
    });
  }

  static async getMomentum(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const momentum = await momentumEngine.getFullIntelligence(userId);

    res.json({
      success: true,
      data: momentum
    });
  }

  static async getFocusAnalytics(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const focus = await FocusIntelligenceService.analyzeUserFocus(userId);

    res.json({
      success: true,
      data: focus
    });
  }
}
