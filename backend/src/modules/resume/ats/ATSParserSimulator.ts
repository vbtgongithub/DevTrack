// src/modules/resume-intelligence/ats/ATSParserSimulator.ts
import { logger } from '../../../shared/logger.js';

export interface IParsedResume {
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    links: string[];
  };
  sections: {
    summary?: string;
    experience: IParsedExperience[];
    projects: IParsedProject[];
    skills: string[];
    education: IParsedEducation[];
  };
  rawText: string;
}

export interface IParsedExperience {
  title?: string;
  company?: string;
  location?: string;
  dateRange?: string;
  bullets: string[];
}

export interface IParsedProject {
  name?: string;
  description?: string;
  link?: string;
  bullets: string[];
}

export interface IParsedEducation {
  degree?: string;
  institution?: string;
  location?: string;
  date?: string;
}

/**
 * ATSParserSimulator
 * 
 * Simulates how a typical ATS (Applicant Tracking System) parser would
 * process and extract information from a resume.
 */
export class ATSParserSimulator {
  /**
   * Simulate parsing of resume text
   */
  async simulateParse(text: string): Promise<IParsedResume> {
    logger.info('[ATSParserSimulator] Simulating resume parsing');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const parsed: IParsedResume = {
      contactInfo: {
        links: [],
      },
      sections: {
        experience: [],
        projects: [],
        skills: [],
        education: [],
      },
      rawText: text,
    };

    let currentSection: string | null = null;
    let currentItem: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // 1. Detect Contact Info (usually at the top)
      if (!currentSection && i < 10) {
        if (this.isEmail(line)) parsed.contactInfo.email = line;
        else if (this.isPhone(line)) parsed.contactInfo.phone = line;
        else if (this.isLink(line)) parsed.contactInfo.links.push(line);
        // First non-empty line might be the name
        else if (!parsed.contactInfo.name && line.length > 3 && line.length < 50 && !this.isCommonHeading(lowerLine)) {
          parsed.contactInfo.name = line;
        }
      }

      // 2. Detect Section Headings
      const detectedSection = this.detectSectionHeading(lowerLine);
      if (detectedSection) {
        currentSection = detectedSection;
        currentItem = null;
        continue;
      }

      // 3. Process Section Content
      if (currentSection) {
        this.processSectionLine(currentSection, line, parsed, (item) => {
          currentItem = item;
        }, currentItem);
      }
    }

    return parsed;
  }

  /**
   * Detect if a line is a common section heading
   */
  private detectSectionHeading(line: string): string | null {
    if (/\b(summary|profile|about|objective)\b/i.test(line)) return 'summary';
    if (/\b(experience|work history|employment|career history)\b/i.test(line)) return 'experience';
    if (/\b(projects|portfolio|personal projects)\b/i.test(line)) return 'projects';
    if (/\b(skills|technologies|technical skills|competencies)\b/i.test(line)) return 'skills';
    if (/\b(education|academic|studies)\b/i.test(line)) return 'education';
    return null;
  }

  /**
   * Process a line within a detected section
   */
  private processSectionLine(
    section: string,
    line: string,
    parsed: IParsedResume,
    setCurrentItem: (item: any) => void,
    currentItem: any
  ): void {
    switch (section) {
      case 'summary':
        parsed.sections.summary = (parsed.sections.summary || '') + ' ' + line;
        break;

      case 'skills':
        // Skills are often comma-separated or one per line
        const skills = line.split(/[,|;]/).map(s => s.trim()).filter(s => s.length > 0);
        parsed.sections.skills.push(...skills);
        break;

      case 'experience':
        if (this.isBulletPoint(line)) {
          if (currentItem) {
            currentItem.bullets.push(this.cleanBullet(line));
          }
        } else if (line.length > 0) {
          // Assume new experience item if not a bullet
          const newItem: IParsedExperience = {
            company: line, // Simple heuristic: first line is company
            bullets: [],
          };
          parsed.sections.experience.push(newItem);
          setCurrentItem(newItem);
        }
        break;

      case 'projects':
        if (this.isBulletPoint(line)) {
          if (currentItem) {
            currentItem.bullets.push(this.cleanBullet(line));
          }
        } else if (line.length > 0) {
          const newItem: IParsedProject = {
            name: line,
            bullets: [],
          };
          parsed.sections.projects.push(newItem);
          setCurrentItem(newItem);
        }
        break;

      case 'education':
        if (line.length > 0) {
          parsed.sections.education.push({
            institution: line,
          });
        }
        break;
    }
  }

  // Helpers
  private isEmail(text: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  }

  private isPhone(text: string): boolean {
    return /^[\d\s()+-]{7,20}$/.test(text);
  }

  private isLink(text: string): boolean {
    return /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/.test(text);
  }

  private isCommonHeading(line: string): boolean {
    return this.detectSectionHeading(line) !== null;
  }

  private isBulletPoint(line: string): boolean {
    return line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line);
  }

  private cleanBullet(line: string): string {
    return line.replace(/^[•\-*\d.]+\s*/, '').trim();
  }
}
