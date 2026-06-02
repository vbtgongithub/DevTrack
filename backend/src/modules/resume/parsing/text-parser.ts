// src/modules/resume-intelligence/parsing/text-parser.ts
import { promises as fs } from 'fs';
import { logger } from '../../../shared/logger.js';

export interface IParsedText {
  text: string;
  sections: { [key: string]: string };
  headings: string[];
  bullets: { level: number; text: string }[];
  links: string[];
  isMarkdown: boolean;
}

/**
 * TextParser
 * 
 * Parses TXT and MD files with markdown-aware parsing, heading extraction, bullet extraction, and section grouping
 */
export class TextParser {
  /**
   * Parse text file
   */
  async parse(filePath: string): Promise<IParsedText> {
    logger.info(`[TextParser] Parsing text file: ${filePath}`);

    try {
      const text = await fs.readFile(filePath, 'utf-8');
      const isMarkdown = filePath.endsWith('.md');

      // Extract information
      const sections = this.extractSections(text);
      const headings = this.extractHeadings(text, isMarkdown);
      const bullets = this.extractBullets(text, isMarkdown);
      const links = this.extractLinks(text);

      const parsed: IParsedText = {
        text,
        sections,
        headings,
        bullets,
        links,
        isMarkdown,
      };

      logger.info(`[TextParser] Parsed ${text.length} characters, ${headings.length} headings, markdown: ${isMarkdown}`);

      return parsed;
    } catch (error) {
      logger.error('[TextParser] Error parsing text file:', error);
      throw new Error(`Text parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  private extractHeadings(text: string, isMarkdown: boolean): string[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const headings: string[] = [];

    for (const line of lines) {
      // Markdown headings (# ## ###)
      if (isMarkdown && line.startsWith('#')) {
        const heading = line.replace(/^#+\s*/, '').trim();
        headings.push(heading);
        continue;
      }

      // Regular headings
      const lowerLine = line.toLowerCase();
      const headingPatterns = [
        /\b(summary|profile|about|objective)\b/i,
        /\b(experience|work history|employment)\b/i,
        /\b(projects|portfolio)\b/i,
        /\b(skills|technologies|technical skills)\b/i,
        /\b(education|academic)\b/i,
        /\b(certifications|certificates)\b/i,
      ];

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
  private extractBullets(text: string, isMarkdown: boolean): { level: number; text: string }[] {
    const lines = text.split('\n');
    const bullets: { level: number; text: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (isMarkdown) {
        // Markdown bullets (-, *, +)
        if (/^[-*+]\s/.test(trimmed)) {
          bullets.push({ level: 0, text: trimmed.replace(/^[-*+]\s/, '') });
          continue;
        }

        // Markdown numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          bullets.push({ level: 0, text: trimmed.replace(/^\d+\.\s/, '') });
          continue;
        }

        // Nested bullets (indentation)
        if (/^\s{2,}[-*+]\s/.test(trimmed)) {
          const indent = trimmed.match(/^\s*/)?.[0]?.length || 0;
          const level = Math.floor(indent / 2);
          bullets.push({ level, text: trimmed.replace(/^\s+[-*+]\s/, '') });
          continue;
        }
      } else {
        // Plain text bullets
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          bullets.push({ level: 0, text: trimmed.substring(1).trim() });
        } else if (/^\d+\./.test(trimmed)) {
          bullets.push({ level: 0, text: trimmed.replace(/^\d+\.\s*/, '') });
        } else if (trimmed.startsWith('\t')) {
          const level = (trimmed.match(/^\t*/)?.[0]?.length || 0);
          bullets.push({ level, text: trimmed.replace(/^\t*/, '') });
        }
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

  /**
   * Clean text
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
      .trim();
  }
}
