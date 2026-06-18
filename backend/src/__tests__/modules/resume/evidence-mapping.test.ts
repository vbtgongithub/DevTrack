// src/__tests__/modules/resume/evidence-mapping.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeEvidenceResolver } from '../../../modules/resume/evidence/ResumeEvidenceResolver.js';
import { ResumeEvidenceClaim } from '../../../db/models/resumeEvidenceClaim.model.js';
import { Project } from '../../../db/models/project.model.js';
import { VerifiedProject } from '../../../db/models/verifiedProject.model.js';
import { Types } from 'mongoose';

vi.mock('../../../db/models/resumeEvidenceClaim.model.js');
vi.mock('../../../db/models/project.model.js');
vi.mock('../../../db/models/verifiedProject.model.js');
vi.mock('../../../shared/logger.js');

describe('ResumeEvidenceResolver', () => {
  let resolver: ResumeEvidenceResolver;
  const userId = new Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
    resolver = new ResumeEvidenceResolver();
  });

  it('should resolve evidence for engineering claims', async () => {
    (Project.find as any).mockResolvedValue([
      { title: 'Cloud Project', techStack: ['AWS', 'Docker'], repoUrl: 'https://github.com/test/cloud' }
    ]);
    (VerifiedProject.find as any).mockResolvedValue([]);

    const claims = ['Implemented a CI/CD pipeline using Docker on AWS'];
    const results = await resolver.resolveEvidenceForClaims(userId, claims);

    const evidence = results.get(claims[0]);
    expect(evidence).toBeDefined();
    expect(evidence?.length).toBeGreaterThan(0);
    expect(evidence?.[0].type).toBe('infrastructure');
  });

  it('should prioritize verified projects for higher confidence', async () => {
    (Project.find as any).mockResolvedValue([]);
    (VerifiedProject.find as any).mockResolvedValue([
      { title: 'Core API', repoUrl: 'https://github.com/test/core-api' }
    ]);

    const claims = ['Deep engineering work in Core API'];
    const results = await resolver.resolveEvidenceForClaims(userId, claims);

    const evidence = results.get(claims[0]);
    expect(evidence?.[0].confidence).toBe(0.95);
    expect(evidence?.[0].type).toBe('system-design');
  });
});
