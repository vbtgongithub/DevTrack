import { Request, Response, NextFunction } from 'express';
import { dsaService } from '../service/dsa.service.js';
import { GetDSAIntelligenceQuerySchema, DSAIntelligenceResponseSchema } from '../dto/dsa.dto.js';

export class DSAController {
  /**
   * GET /api/readiness/dsa
   * Get comprehensive DSA intelligence for a user
   */
  async getDSAIntelligence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const query = GetDSAIntelligenceQuerySchema.parse(req.query);

      // Generate DSA intelligence
      const intelligence = await dsaService.generateDSAIntelligence({
        userId: query.userId,
        platform: query.platform,
      });

      // Validate response
      const validatedResponse = DSAIntelligenceResponseSchema.parse(intelligence);

      res.json({
        success: true,
        data: validatedResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/readiness/dsa
   * Update DSA profile data
   */
  async updateDSAProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, platform, ...data } = req.body;

      if (!userId || !platform) {
        res.status(400).json({
          success: false,
          error: 'userId and platform are required',
        });
        return;
      }

      await dsaService.updateDSAProfile(userId, platform, data);

      res.json({
        success: true,
        message: 'DSA profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/readiness/dsa/profile
   * Get DSA profile for a user
   */
  async getDSAProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, platform } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const profile = await dsaService.getDSAProfile(
        userId as string,
        platform as string
      );

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dsaController = new DSAController();
