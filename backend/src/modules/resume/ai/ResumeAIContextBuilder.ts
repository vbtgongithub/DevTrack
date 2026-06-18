// src/modules/resume-intelligence/ai/ResumeAIContextBuilder.ts
import type { Types } from 'mongoose';
import { Project } from '../../../db/models/project.model.js';
import { ResumeProfile } from '../../../db/models/resumeProfile.model.js';
import { ATSAnalysis } from '../../../db/models/atsAnalysis.model.js';
import { logger } from '../../../shared/logger.js';

/**
 * ResumeAIContextBuilder
 * 
 * Constructs bounded deterministic AI context for resume optimization.
 * Prohibits unbounded generation context to prevent hallucinations.
 */
export class ResumeAIContextBuilder {
  /**
   * Build context for AI wording optimization
   */
  async buildWordingContext(userId: Types.ObjectId, sectionName: string): Promise<string> {
    logger.info(`[ResumeAIContextBuilder] Building context for ${sectionName} wording optimization`);

    const profile = await ResumeProfile.findOne({ userId });
    const projects = await Project.find({ userId, _id: { $in: profile?.selectedProjects || [] } });
    const latestATS = await ATSAnalysis.findOne({ userId }).sort({ createdAt: -1 });

    const contextParts: string[] = [];

    // 1. Core Engineering Facts
    contextParts.push('CORE ENGINEERING FACTS (DO NOT HALLUCINATE):');
    if (profile) {
      contextParts.push(`- Target Role: ${profile.targetRole}`);
      contextParts.push(`- Verified Skills: ${profile.selectedSkills.join(', ')}`);
      contextParts.push(`- Infrastructure Maturity: Docker=${profile.infraSignals.dockerUsage}, CI/CD=${profile.infraSignals.cicdPipeline}, Cloud=${profile.infraSignals.cloudDeployment}`);
    }

    // 2. Project Details
    contextParts.push('\nSELECTED PROJECTS:');
    projects.forEach(p => {
      contextParts.push(`- Project: ${p.name || (p as any).title || ''}`);
      contextParts.push(`  Description: ${p.description}`);
      contextParts.push(`  Tech Stack: ${p.techStack?.join(', ')}`);
    });

    // 3. ATS Constraints
    if (latestATS) {
      contextParts.push('\nATS CONSTRAINTS:');
      latestATS.parserWarnings.forEach(w => {
        contextParts.push(`- WARNING: ${w.message} in ${w.section}. Suggestion: ${w.suggestion}`);
      });
      const missingKeywords = latestATS.keywordCoverage.filter(k => !k.found).map(k => k.keyword);
      if (missingKeywords.length > 0) {
        contextParts.push(`- MISSING KEYWORDS TO INCLUDE: ${missingKeywords.join(', ')}`);
      }
    }

    // 4. Constraints
    contextParts.push('\nSTRICT CONSTRAINTS:');
    contextParts.push('- Use strong action verbs.');
    contextParts.push('- Focus on engineering outcomes.');
    contextParts.push('- Keep bullet points concise and recruiter-safe.');
    contextParts.push('- NEVER invent metrics, traffic numbers, or scaling claims not present in the facts.');
    contextParts.push('- If no data exists for a claim, do not make it.');

    return contextParts.join('\n');
  }
}
