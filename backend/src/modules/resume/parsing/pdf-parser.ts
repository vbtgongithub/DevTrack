import { PDFParse } from 'pdf-parse';
import { promises as fs } from 'fs';
import { logger } from '../../../shared/logger.js';

export interface IParsedPDF {
  text: string;
  pages: number;
  metadata: {
    [key: string]: any;
  };
}

/**
 * PDFParser
 * 
 * Extracts text, sections, heading structure, bullet hierarchy, links, and formatting patterns from PDF files
 */
export class PDFParser {
  /**
   * Parse PDF file
   */
  async parse(filePath: string): Promise<IParsedPDF> {
    logger.info(`[PDFParser] Parsing PDF: ${filePath}`);

    try {
      const dataBuffer = await fs.readFile(filePath);
      const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });

      try {
        const textResult = await parser.getText();
        const infoResult = await parser.getInfo();

        const result: IParsedPDF = {
          text: textResult.text,
          pages: infoResult.total || 1,
          metadata: {
            info: infoResult.info || {},
            version: '2.0',
          },
        };

        logger.info(`[PDFParser] Parsed ${infoResult.total || 1} pages, ${textResult.text.length} characters`);

        return result;
      } finally {
        await parser.destroy().catch((err: any) => {
          logger.warn('[PDFParser] Error destroying parser:', err);
        });
      }
    } catch (error) {
      logger.error('[PDFParser] Error parsing PDF:', error);
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract sections from parsed text
   */
  extractSections(text: string): { [key: string]: string } {
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
   * Extract heading structure
   */
  extractHeadings(text: string): string[] {
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
  extractBullets(text: string): { level: number; text: string }[] {
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
  extractLinks(text: string): string[] {
    const urlPattern = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?/g;
    const matches = text.match(urlPattern) || [];
    return matches;
  }

  /**
   * Extract formatting patterns
   */
  extractFormattingPatterns(text: string): { [key: string]: boolean } {
    return {
      hasUppercaseHeadings: /^[A-Z\s]+$/.test(text.split('\n')[0] || ''),
      hasBulletPoints: /[•\-*]/.test(text),
      hasNumbering: /^\d+\./m.test(text),
      hasEmail: /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text),
      hasPhone: /^[\d\s()+-]{7,20}$/m.test(text),
    };
  }
}
