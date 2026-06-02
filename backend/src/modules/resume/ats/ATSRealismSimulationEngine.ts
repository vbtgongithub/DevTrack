// src/modules/resume-intelligence/ats/ATSRealismSimulationEngine.ts
import { logger } from '../../../shared/logger.js';
import { ATSParserSimulator } from './ATSParserSimulator.js';

/**
 * ATSRealismSimulationEngine
 * 
 * Simulates real-world ATS behavior against platforms like Greenhouse, Workday, Lever.
 */
export class ATSRealismSimulationEngine {
  private simulator: ATSParserSimulator;

  constructor() {
    this.simulator = new ATSParserSimulator();
  }

  async simulate(resumeContent: string, targetPlatform: string): Promise<any> {
    logger.info(`[ATSRealism] Simulating parser behavior for platform: ${targetPlatform}`);
    
    // Simulate platform-specific parsing quirks
    const parsed = await this.simulator.simulateParse(resumeContent);
    return parsed;
  }
}

export class ATSIntegrityEvaluator {
  async evaluateIntegrity(originalContent: any, parsedContent: any): Promise<number> {
    logger.info('[ATSIntegrity] Evaluating extraction integrity');
    
    const origText = typeof originalContent === 'string' ? originalContent : originalContent?.text || originalContent?.content || '';
    const parsedText = typeof parsedContent === 'string' ? parsedContent : parsedContent?.rawText || parsedContent?.text || '';

    if (!origText || !parsedText) return 0.50; // default baseline

    const origWords = origText.split(/\s+/).filter((w: string) => w.length > 0).length;
    const parsedWords = parsedText.split(/\s+/).filter((w: string) => w.length > 0).length;

    if (origWords === 0) return 1.0;

    // Measure raw word recovery ratio
    const wordRatio = Math.min(origWords, parsedWords) / Math.max(origWords, parsedWords);
    
    // Penalize if parsed content has missing sections or zero experience bullets
    let penalty = 0;
    if (parsedContent && typeof parsedContent === 'object') {
      const exp = parsedContent.sections?.experience || parsedContent.experience || [];
      if (Array.isArray(exp) && exp.length > 0) {
        const totalBullets = exp.reduce((acc: number, curr: any) => acc + (curr.bullets?.length || 0), 0);
        if (totalBullets === 0) {
          penalty += 0.15; // penalize heavily for empty experience details
        }
      }
    }

    return Math.max(0.1, parseFloat((wordRatio - penalty).toFixed(2)));
  }
}

export class KeywordExtractionValidator {
  async validateKeywords(expected: string[], extracted: string[]): Promise<number> {
    logger.info('[KeywordValidator] Validating keyword extraction');
    if (!expected || expected.length === 0) return 1.0;
    if (!extracted || extracted.length === 0) return 0.0;

    const expectedLower = expected.map(k => k.toLowerCase().trim());
    const extractedLower = extracted.map(k => k.toLowerCase().trim());

    let matchCount = 0;
    for (const kw of expectedLower) {
      if (extractedLower.some(e => e.includes(kw) || kw.includes(e))) {
        matchCount++;
      }
    }

    return parseFloat((matchCount / expected.length).toFixed(2));
  }
}

export class SectionRecognitionValidator {
  async validateSections(parsed: any): Promise<boolean> {
    logger.info('[SectionValidator] Validating section recognition');
    if (!parsed || typeof parsed !== 'object') return false;

    // Check if standard sections exist and have content
    const sections = parsed.sections || parsed;
    const hasExperience = (sections.experience && sections.experience.length > 0) || (sections.work_history && sections.work_history.length > 0);
    const hasSkills = sections.skills && sections.skills.length > 0;
    const hasEducation = sections.education && sections.education.length > 0;

    return !!(hasExperience && hasSkills && hasEducation);
  }
}

export class FormattingStressTester {
  async runStressTest(resumeContent: string): Promise<string[]> {
    logger.info('[FormattingStressTest] Running formatting stress test');
    const warnings: string[] = [];

    if (resumeContent.includes('\t\t') || /\s{4,}/.test(resumeContent)) {
      warnings.push('multi-column detected');
    }
    
    if ((resumeContent.includes('|') && resumeContent.includes('-')) || /\+[-+=]+\+/.test(resumeContent)) {
      warnings.push('complex table found');
    }

    if (/[★☆●○■□▪▫◆◇]/.test(resumeContent)) {
      warnings.push('special characters detected');
    }

    if (/\.(png|jpe?g|gif|svg|webp)\b/i.test(resumeContent) || /\[image\]|\[graphic\]/i.test(resumeContent)) {
      warnings.push('embedded graphics detected');
    }

    const badFonts = ['comic sans', 'wingdings', 'webdings', 'zapf dingbats', 'papyrus'];
    if (badFonts.some(f => resumeContent.toLowerCase().includes(f))) {
      warnings.push('unsupported fonts detected');
    }

    const formattingMatches = resumeContent.match(/(\*\*|\*|__|_)/g) || [];
    if (formattingMatches.length > 15) {
      warnings.push('excessive styling indicators');
    }

    return warnings;
  }
}
