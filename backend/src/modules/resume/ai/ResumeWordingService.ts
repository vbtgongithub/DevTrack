// src/modules/resume-intelligence/ai/ResumeWordingService.ts
import type { Types } from 'mongoose';
import { AIProviderAdapter } from '../../ai/AIProviderAdapter.js';
import { ResumeAIContextBuilder } from './ResumeAIContextBuilder.js';
import { logger } from '../../../shared/logger.js';

/**
 * ResumeWordingService
 * 
 * Improves resume readability and recruiter clarity while strictly
 * prohibiting hallucinations and fake metrics.
 */
export class ResumeWordingService {
  private contextBuilder: ResumeAIContextBuilder;

  constructor() {
    this.contextBuilder = new ResumeAIContextBuilder();
  }

  /**
   * Optimize wording for a specific resume section or bullet point
   */
  async optimizeWording(userId: Types.ObjectId, sectionName: string, originalText: string): Promise<string> {
    logger.info(`[ResumeWordingService] Optimizing wording for ${sectionName}`);

    const context = await this.contextBuilder.buildWordingContext(userId, sectionName);
    
    const systemPrompt = `
      You are an expert technical recruiter and engineering manager.
      Your goal is to improve the wording of a software engineer's resume.
      
      STRICT CONSTRAINTS:
      1. IMPROVE readability and recruiter clarity ONLY.
      2. USE strong action verbs (e.g., "Architected", "Engineered", "Optimized").
      3. FOCUS on engineering outcomes.
      4. DO NOT invent metrics (e.g., "100k users", "99.9% uptime") if they are not in the context.
      5. DO NOT hallucinate technologies or experience not provided in the context.
      6. IF you see a weak claim, improve the PHRASING, not the FACT.
      7. AI assists wording ONLY. Fact integrity is canonical.
    `;

    const userPrompt = `
      CONTEXT:
      ${context}
      
      ORIGINAL TEXT TO OPTIMIZE:
      "${originalText}"
      
      Provide 3 optimized versions that are recruiter-safe and ATS-friendly.
    `;

    try {
      const response = await AIProviderAdapter.generateResponse(
        userId.toString(),
        systemPrompt,
        userPrompt
      );

      return response;
    } catch (error) {
      logger.error('[ResumeWordingService] Error optimizing wording:', error);
      return originalText; // Fallback to original
    }
  }
}
