import { CoachingService } from './coaching.service.js';
import { ReflectionService } from './reflection.service.js';
import { momentumEngine } from '../observation/momentumEngine.service.js';
import { FocusIntelligenceService } from '../observation/focusIntelligence.service.js';
import { ApiResponse } from '../../shared/response.js';
import { withAuth } from '../../shared/controllerUtils.js';

export class CoachingController {
  static getInsights = withAuth('[coaching]', 'get insights', async (userId, _req, res) => {
    const insights = await CoachingService.generateCoachingInsights(userId);
    const emotionalState = await CoachingService.detectEmotionalState(userId);
    ApiResponse.success(res, { insights, emotionalState });
  });

  static getReflections = withAuth('[coaching]', 'get reflections', async (userId, _req, res) => {
    const reflection = await ReflectionService.generateWeeklyReflection(userId);
    ApiResponse.success(res, reflection);
  });

  static getMomentum = withAuth('[coaching]', 'get momentum', async (userId, _req, res) => {
    const momentum = await momentumEngine.getFullIntelligence(userId);
    ApiResponse.success(res, momentum);
  });

  static getFocusAnalytics = withAuth('[coaching]', 'get focus analytics', async (userId, _req, res) => {
    const focus = await FocusIntelligenceService.analyzeUserFocus(userId);
    ApiResponse.success(res, focus);
  });
}
