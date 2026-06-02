// src/__tests__/modules/resume/ats-analysis.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ATSCompatibilityEngine } from '../../../modules/resume/ats/ATSCompatibilityEngine.js';
import { ATSAnalysis } from '../../../db/models/atsAnalysis.model.js';
import { ResumeProfile } from '../../../db/models/resumeProfile.model.js';
import { ResumeEvidenceClaim } from '../../../db/models/resumeEvidenceClaim.model.js';
import { Types } from 'mongoose';

vi.mock('../../../db/models/atsAnalysis.model.js');
vi.mock('../../../db/models/resumeProfile.model.js');
vi.mock('../../../db/models/resumeEvidenceClaim.model.js');
vi.mock('../../../shared/logger.js');

describe('ATSCompatibilityEngine', () => {
  let engine: ATSCompatibilityEngine;
  const userId = new Types.ObjectId();
  const resumeProfileId = new Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
    (ResumeProfile.findById as any).mockResolvedValue({
      targetRole: 'Full Stack Developer',
    });
    (ResumeEvidenceClaim.find as any).mockResolvedValue([]);
    (ATSAnalysis.create as any).mockImplementation((data: any) => Promise.resolve(data));
    engine = new ATSCompatibilityEngine();
  });

  it('should analyze ATS compatibility and return a calibrated score', async () => {
    const result = await engine.analyze({
      userId,
      resumeProfileId,
      content: 'This is a sample resume summary. Summary of skills: Node.js, Docker, Git. Experience in Backend. Projects include scaling. Education: BS CS. Certifications: AWS.',
      targetKeywords: ['Node.js', 'Docker', 'AWS'],
    });

    expect(result.atsScore).toBeGreaterThan(0);
    expect(result.atsScore).toBeLessThanOrEqual(100);
  });

  it('should detect parser warnings for multi-column layouts', async () => {
    const multiColumnContent = 'Name\t\t\tExperience\t\t\tSkills\nJohn Doe\t\tSoftware Engineer\t\tJavaScript\nLine 3\t\t\tLine 4\t\t\tLine 5';
    const result = await engine.analyze({
      userId,
      resumeProfileId,
      content: multiColumnContent,
    });

    const hasMultiColumnWarning = result.parserWarnings.some((w: any) => 
      w.message.toLowerCase().includes('multi-column')
    );
    expect(hasMultiColumnWarning).toBe(true);
  });

  it('should detect tables layout warning in resume text', async () => {
    const tabularContent = 'Name | Title | Year\nJohn Doe | SWE | 2024\n|---|---|---|';
    const result = await engine.analyze({
      userId,
      resumeProfileId,
      content: tabularContent,
    });

    const hasTableWarning = result.parserWarnings.some((w: any) => 
      w.message.toLowerCase().includes('table')
    );
    expect(hasTableWarning).toBe(true);
  });

  it('should detect image and graphics warnings', async () => {
    const graphicsContent = 'This is my resume [image] or profile.jpg embedded in header.';
    const result = await engine.analyze({
      userId,
      resumeProfileId,
      content: graphicsContent,
    });

    const hasGraphicsWarning = result.parserWarnings.some((w: any) => 
      w.message.toLowerCase().includes('graphics') || w.message.toLowerCase().includes('image')
    );
    expect(hasGraphicsWarning).toBe(true);
  });

  it('should detect heading inconsistency formatting warnings', async () => {
    const content = 'SUMMARY\nMy profile details.\n\nexperience\nJob history in frontend.';
    const result = await engine.analyze({
      userId,
      resumeProfileId,
      content,
    });

    const hasInconsistentHeadings = result.formattingWarnings.some((w: any) => 
      w.type === 'heading_inconsistency'
    );
    expect(hasInconsistentHeadings).toBe(true);
  });

  it('should apply role-specific deductions for backend roles with missing essential sections', async () => {
    (ResumeProfile.findById as any).mockResolvedValue({
      targetRole: 'Backend Engineer',
    });

    // Content missing essential experience & projects sections
    const weakContent = 'SUMMARY\nOnly has summary and nothing else.';
    const result = await engine.analyze({
      userId,
      resumeProfileId,
      content: weakContent,
    });

    // Score should be very low due to severe backend deductions
    expect(result.atsScore).toBeLessThanOrEqual(50);
  });

  it('should deduct direct credibility penalties for unverified infrastructure claims', async () => {
    (ResumeProfile.findById as any).mockResolvedValue({
      targetRole: 'Backend Engineer',
    });

    (ResumeEvidenceClaim.find as any).mockResolvedValue([
      {
        claimText: 'I scale microservices with Kubernetes',
        verificationStatus: 'unverified',
        provenance: [],
      },
      {
        claimText: 'Designed RabbitMQ distributed system queue',
        verificationStatus: 'flagged',
        provenance: ['manual'],
      }
    ]);

    const result = await engine.analyze({
      userId,
      resumeProfileId,
      content: 'I scale microservices with Kubernetes and designed RabbitMQ queue.',
    });

    // Verification claims being unverified or flagged causes penalty up to 10
    expect(result.atsScore).toBeLessThan(90);
  });
});
