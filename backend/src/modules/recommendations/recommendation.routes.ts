// src/modules/recommendations/recommendation.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { RecommendationIntelligenceService } from './recommendation.service.js';

const router = Router();

// Phase 12: Realism Report Endpoint
router.get('/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await RecommendationIntelligenceService.getRealismReport();
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// Generate and Fetch Intelligence Recommendations
router.get('/intelligence/:resumeProfileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeProfileId } = req.params;
    const userId = (req as any).user?.id || '000000000000000000000000'; // Default for testing if auth not wired
    
    // In a real flow, this generation might happen asynchronously when a resume is uploaded.
    // For this implementation, we can trigger it on read if empty, or just regenerate.
    await RecommendationIntelligenceService.generateIntelligence(userId as string, resumeProfileId as string);
    
    const recommendations = await RecommendationIntelligenceService.getActiveRecommendations(resumeProfileId as string);
    
    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

export default router;
