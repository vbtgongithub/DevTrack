import * as _pdf from 'pdf-parse';
import mammoth from 'mammoth';

const pdf = (_pdf as any).default || _pdf;
import { IntelligenceResult, ParsedResume, ParsedSection, ExtractedEntity, ConfidenceEnvelope } from '../types/index.js';

const SECTION_HEADERS = [
  'education', 'experience', 'employment', 'work history', 'projects',
  'skills', 'certifications', 'achievements', 'internships', 'summary', 'objective'
];

const KNOWN_TECHNOLOGIES = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust',
  'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'django', 'flask',
  'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'docker', 'kubernetes',
  'aws', 'gcp', 'azure'
];

const TECH_ALIASES: Record<string, string> = {
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'node': 'Node.js',
  'reactjs': 'React',
  'react.js': 'React',
  'mongo db': 'MongoDB',
  'mongo': 'MongoDB',
  'postgres': 'PostgreSQL',
  'k8s': 'Kubernetes',
  'golang': 'Go'
};

export class ResumeParsingEngine {
  /**
   * Parse resume from buffer deterministically.
   */
  async parseFromBuffer(buffer: Buffer, mimeType: string): Promise<IntelligenceResult<ParsedResume>> {
    let rawText = '';
    
    // 1. Raw Text Extraction
    if (mimeType === 'application/pdf') {
      const data = await pdf(buffer);
      rawText = data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else {
      rawText = buffer.toString('utf-8');
    }
    
    // 2. Section Detection
    const sections = this.detectSections(rawText);
    
    // 3. Extraction
    const skills = this.extractSkills(sections);
    const projects = this.extractProjects(sections);
    
    // 4. Normalize
    const normalizedSkills = this.normalizeEntities(skills);
    
    const parsedResume: ParsedResume = {
      sections,
      skills: normalizedSkills,
      projects,
      education: [], // Placeholder for deterministic education extraction
      experience: [], // Placeholder for deterministic experience extraction
      technologies: normalizedSkills,
    };
    
    const confidence: ConfidenceEnvelope = {
      confidence: this.calculateOverallConfidence(parsedResume),
      evidenceCount: parsedResume.skills.length + parsedResume.projects.length,
      evidenceSources: ['deterministic_regex', 'positional_heuristics'],
      reasoning: 'Extracted purely via deterministic mapping and known dictionaries.'
    };
    
    return {
      data: parsedResume,
      confidence,
      metadata: {
        runtimeVersion: '1.0.0',
        schemaVersion: '1.0',
        replayCompatibilityVersion: '1.0',
        generatedAt: new Date().toISOString()
      }
    };
  }

  private detectSections(rawText: string): ParsedSection[] {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const sections: ParsedSection[] = [];
    
    let currentSectionTitle = 'summary';
    let currentSectionContent: string[] = [];
    
    for (const line of lines) {
      const normalizedLine = line.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      const isHeader = SECTION_HEADERS.includes(normalizedLine) && line.length < 30;
      
      if (isHeader) {
        if (currentSectionContent.length > 0) {
          sections.push({
            title: currentSectionTitle,
            content: currentSectionContent.join('\n'),
            originalText: currentSectionContent.join('\n')
          });
        }
        currentSectionTitle = normalizedLine;
        currentSectionContent = [];
      } else {
        currentSectionContent.push(line);
      }
    }
    
    if (currentSectionContent.length > 0) {
      sections.push({
        title: currentSectionTitle,
        content: currentSectionContent.join('\n'),
        originalText: currentSectionContent.join('\n')
      });
    }
    
    return sections;
  }

  private extractSkills(sections: ParsedSection[]): ExtractedEntity[] {
    const skills: ExtractedEntity[] = [];
    
    for (const section of sections) {
      const words = section.content.split(/[\s,]+/);
      for (const word of words) {
        const normalized = word.toLowerCase().replace(/[^a-z0-9#+.]/g, '');
        if (KNOWN_TECHNOLOGIES.includes(normalized)) {
          // Avoid exact duplicates in the same section roughly
          if (!skills.some(s => s.value.toLowerCase() === normalized)) {
            skills.push({
              value: normalized, // Will be normalized later
              confidence: section.title === 'skills' ? 0.95 : 0.75,
              source_section: section.title,
              evidence_window: this.getEvidenceWindow(section.content, word)
            });
          }
        }
      }
    }
    return skills;
  }

  private extractProjects(sections: ParsedSection[]): ExtractedEntity[] {
    const projects: ExtractedEntity[] = [];
    const projectSection = sections.find(s => s.title === 'projects');
    
    if (projectSection) {
      // Very naive extraction: assume each bullet point or short line before a date is a project
      const lines = projectSection.content.split('\n');
      for (const line of lines) {
        if (line.trim().length > 5 && line.trim().length < 50) {
          projects.push({
            value: line.trim(),
            confidence: 0.80,
            source_section: 'projects',
            evidence_window: line.trim()
          });
        }
      }
    }
    return projects;
  }

  private normalizeEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    return entities.map(e => {
      const normalizedValue = TECH_ALIASES[e.value.toLowerCase()] || 
        (e.value.charAt(0).toUpperCase() + e.value.slice(1).toLowerCase());
      return { ...e, value: normalizedValue };
    });
  }

  private getEvidenceWindow(content: string, targetWord: string): string {
    const index = content.toLowerCase().indexOf(targetWord.toLowerCase());
    if (index === -1) return content.substring(0, 100);
    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + targetWord.length + 30);
    return '...' + content.substring(start, end).replace(/\n/g, ' ') + '...';
  }

  private calculateOverallConfidence(parsed: ParsedResume): number {
    if (parsed.sections.length === 0) return 0.2;
    if (parsed.skills.length > 5 && parsed.sections.some(s => s.title === 'experience')) return 0.9;
    return 0.7;
  }
}
