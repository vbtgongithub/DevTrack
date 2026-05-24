import { Request, Response } from 'express';
import { CoachingService } from './coaching.service.js';
import { ReflectionService } from './reflection.service.js';
import { momentumEngine } from '../observation/momentumEngine.service.js';
import { FocusIntelligenceService } from '../observation/focusIntelligence.service.js';

export class CoachingController {
  static async getInsights(req: Request, res: Response) {
    const userId = req.context?.userId;
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

  static async getReflections(req: Request, res: Response) {
    const userId = req.context?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const reflection = await ReflectionService.generateWeeklyReflection(userId);

    res.json({
      success: true,
      data: reflection
    });
  }

  static async getMomentum(req: Request, res: Response) {
    const userId = req.context?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const momentum = await momentumEngine.getFullIntelligence(userId);

    res.json({
      success: true,
      data: momentum
    });
  }

  static async getFocusAnalytics(req: Request, res: Response) {
    const userId = req.context?.userId;
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
