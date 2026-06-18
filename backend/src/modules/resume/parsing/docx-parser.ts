// src/modules/resume-intelligence/parsing/docx-parser.ts
import mammoth from 'mammoth';
import { promises as fs } from 'fs';
import { logger } from '../../../shared/logger.js';

export interface IParsedDOCX {
  text: string;
  sections: { [key: string]: string };
  headings: string[];
  bullets: { level: number; text: string }[];
  links: string[];
}

/**
 * DOCXParser
 * 
 * Extracts semantic structure, headings, bullets, formatting, and links from DOCX files
 */
export class DOCXParser {
  /**
   * Parse DOCX file
   */
  async parse(filePath: string): Promise<IParsedDOCX> {
    logger.info(`[DOCXParser] Parsing DOCX: ${filePath}`);

    try {
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });

      const text = result.value;
      
      // Extract additional information
      const sections = this.extractSections(text);
      const headings = this.extractHeadings(text);
      const bullets = this.extractBullets(text);
      const links = this.extractLinks(text);

      const parsed: IParsedDOCX = {
        text,
        sections,
        headings,
        bullets,
        links,
      };

      logger.info(`[DOCXParser] Parsed ${text.length} characters, ${headings.length} headings`);

      return parsed;
    } catch (error) {
      logger.error('[DOCXParser] Error parsing DOCX:', error);
      throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract sections from parsed text
   */
  private extractSections(text: string): { [key: string]: string } {
    const sections: { [key: string]: string } = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentSection = 'header';
    let currentContent: string[] = [];

    const sectionPatterns = {
      summary: /\b(summary|profile|about|objective|professional summary)\b/i,
      experience: /\b(experience|work history|employment|career history|work experience)\b/i,
      projects: /\b(projects|portfolio|personal projects|project experience)\b/i,
      skills: /\b(skills|technologies|technical skills|competencies|core skills)\b/i,
      education: /\b(education|academic|studies|academic background)\b/i,
      certifications: /\b(certifications|certificates|credentials)\b/i,
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      let foundSection = false;

      for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(lowerLine)) {
          // Save previous section
          if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n');
          }

          // Start new section
          currentSection = sectionName;
          currentContent = [];
          foundSection = true;
          break;
        }
      }

      if (!foundSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }

    return sections;
  }

  /**
   * Extract headings from parsed text
   */
  private extractHeadings(text: string): string[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const headings: string[] = [];

    const headingPatterns = [
      /\b(summary|profile|about|objective)\b/i,
      /\b(experience|work history|employment)\b/i,
      /\b(projects|portfolio)\b/i,
      /\b(skills|technologies|technical skills)\b/i,
      /\b(education|academic)\b/i,
      /\b(certifications|certificates)\b/i,
    ];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const pattern of headingPatterns) {
        if (pattern.test(lowerLine)) {
          headings.push(line);
          break;
        }
      }
    }

    return headings;
  }

  /**
   * Extract bullet hierarchy
   */
  private extractBullets(text: string): { level: number; text: string }[] {
    const lines = text.split('\n');
    const bullets: { level: number; text: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        bullets.push({ level: 0, text: trimmed.substring(1).trim() });
      } else if (/^\d+\./.test(trimmed)) {
        bullets.push({ level: 0, text: trimmed.replace(/^\d+\.\s*/, '') });
      } else if (trimmed.startsWith('\t')) {
        const level = (trimmed.match(/^\t*/)?.[0]?.length || 0);
        bullets.push({ level, text: trimmed.replace(/^\t*/, '') });
      }
    }

    return bullets;
  }

  /**
   * Extract links
   */
  private extractLinks(text: string): string[] {
    const urlPattern = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?/g;
    const matches = text.match(urlPattern) || [];
    return matches;
  }
}
