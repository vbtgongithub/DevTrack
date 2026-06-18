import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { logger } from '../../shared/logger.js';
import { CareerIntent } from '../../db/models/careerIntent.model.js';
import { ReadinessCore } from '../../db/models/readinessCore.model.js';
import { ReadinessDsa } from '../../db/models/readinessDsa.model.js';
import { ReadinessSkills } from '../../db/models/readinessSkills.model.js';
import { ReadinessProjects } from '../../db/models/readinessProjects.model.js';
import { ReadinessRoadmap } from '../../db/models/readinessRoadmap.model.js';
import { ReadinessBenchmarks } from '../../db/models/readinessBenchmarks.model.js';
import { ReadinessOrchestratorService } from './engine/ReadinessOrchestratorService.js';
import { DomainIntelligenceService } from './engine/ReadinessOrchestratorService.js';
import { UserSkillProgress } from '../../db/models/userSkillProgress.model.js';
import { normalizeSkill } from './role/roleSkills.js';

export const ReadinessController = {
  async getSnapshot(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Delegate to Orchestrator for dynamic intelligence synthesis
      const dynamicSnapshot = await ReadinessOrchestratorService.computeDynamicSnapshot(userId);

      return res.json({
        success: true,
        data: dynamicSnapshot
      });
    } catch (error) {
      logger.error('Failed to get readiness snapshot', { error });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async getDomainIntelligence(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const domain = req.params.domain as string;
      const validDomains = ['dsa', 'engineering', 'roadmap', 'evolution', 'copilot'];
      if (!validDomains.includes(domain)) {
        return res.status(400).json({ success: false, error: `Invalid domain: ${domain}` });
      }

      const intelligence = await DomainIntelligenceService.computeDomainIntelligence(userId, domain);

      // Roadmap Intelligence: normalize to required top-level schema
      if (domain === 'roadmap') {
        const roadmapIntelligence = (intelligence as any)?.intelligence ?? (intelligence as any);

        const normalizedRoadmap = {
          domain: 'roadmap',
          currentStage: roadmapIntelligence?.currentStage ?? 'Unknown',
          roadmapProgress: roadmapIntelligence?.roadmapProgress ?? 0,
          verifiedSkills: roadmapIntelligence?.verifiedSkills ?? [],
          completedRoadmapSkills: roadmapIntelligence?.completedRoadmapSkills ?? [],
          missingSkills: roadmapIntelligence?.missingSkills ?? [],
          prioritySkills: roadmapIntelligence?.prioritySkills ?? [],
          nextSkill: roadmapIntelligence?.nextSkill ?? '',
          nextThreeSkills: roadmapIntelligence?.nextThreeSkills ?? [],
          highestImpactSkill: roadmapIntelligence?.highestImpactSkill ?? '',
          readinessGain: roadmapIntelligence?.readinessGain ?? 0,
          estimatedWeeksToNextMilestone: roadmapIntelligence?.estimatedWeeksToNextMilestone ?? 0,
          nextSkillResource: roadmapIntelligence?.nextSkillResource ?? null,
        };

        return res.json({
          success: true,
          data: normalizedRoadmap
        });
      }

      // Evolution Intelligence: V2 Redesign pass-through
      if (domain === 'evolution') {
        const evo = (intelligence as any)?.intelligence ?? (intelligence as any);
        return res.json({
          success: true,
          data: evo
        });
      }

      return res.json({
        success: true,
        data: intelligence
      });
    } catch (error) {
      logger.error('Failed to get domain intelligence', { error, domain: req.params.domain as string });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async setCareerIntent(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const SetCareerIntentSchema = z.object({
        dreamRole: z.string().optional(),
        targetRole: z.string().optional(),
        goal: z.string().optional(),
        experienceLevel: z.string().optional(),
        weeklyHours: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
        targetPackage: z.string().optional(),
        targetCompanyTier: z.string().optional(),
        timelineGoals: z.any().optional(),
      });

      const validationResult = SetCareerIntentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ success: false, error: 'Invalid payload data', details: validationResult.error.errors });
      }

      const { dreamRole, targetRole, goal, experienceLevel, weeklyHours, targetPackage, targetCompanyTier, timelineGoals } = validationResult.data;
      const resolvedRole = dreamRole || targetRole || '';

      const intent = await CareerIntent.findOneAndUpdate(
        { userId },
        {
          dreamRole: resolvedRole,
          targetPackage: targetPackage || '',
          targetCompanyTier: targetCompanyTier || '',
          timelineGoals: timelineGoals || '',
          goal: goal || '',
          experienceLevel: experienceLevel || '',
          weeklyHours: weeklyHours !== undefined ? Number(weeklyHours) : 0
        },
        { upsert: true, new: true }
      );

      return res.json({ success: true, data: intent });
    } catch (error) {
      logger.error('Failed to set career intent', { error });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async setSkillProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { skill, completed } = req.body;
      if (!skill) {
        return res.status(400).json({ success: false, error: 'Skill is required' });
      }

      const normalized = normalizeSkill(skill);

      await UserSkillProgress.findOneAndUpdate(
        { userId, skill: normalized },
        {
          userId,
          skill: normalized,
          completed,
          completedAt: completed ? new Date() : undefined,
          source: 'manual'
        },
        { upsert: true, new: true }
      );

      return res.json({ success: true });
    } catch (error) {
      logger.error('Failed to set skill progress', { error });
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
};

