// src/__tests__/modules/resume/resume-orchestration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeOrchestrationEngine } from '../../../modules/resume/orchestration/ResumeOrchestrationEngine.js';
import { ResumeProfile } from '../../../db/models/resumeProfile.model.js';
import { Project } from '../../../db/models/project.model.js';
import { DsaProblem } from '../../../db/models/dsaProblem.model.js';
import { DsaContest } from '../../../db/models/dsaContest.model.js';
import { Types } from 'mongoose';

vi.mock('../../../db/models/resumeProfile.model.js');
vi.mock('../../../db/models/project.model.js');
vi.mock('../../../db/models/dsaProblem.model.js');
vi.mock('../../../db/models/dsaContest.model.js');
vi.mock('../../../shared/logger.js');

describe('ResumeOrchestrationEngine', () => {
  let engine: ResumeOrchestrationEngine;
  const userId = new Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ResumeOrchestrationEngine();
    
    // Mock DSA methods to avoid database timeouts
    (DsaProblem.countDocuments as any) = vi.fn().mockResolvedValue(10);
    (DsaContest.countDocuments as any) = vi.fn().mockResolvedValue(2);
    (DsaProblem.find as any) = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue([
        { difficulty: 'easy' },
        { difficulty: 'medium' },
        { difficulty: 'hard' },
      ])
    });
  });

  it('should orchestrate resume generation for a user', async () => {
    const mockProfile = {
      _id: new Types.ObjectId(),
      userId,
      save: vi.fn().mockResolvedValue(true),
      metadata: { lastGeneratedAt: null, generationCount: 0 },
      infraSignals: {},
      systemDesignSignals: {},
      dsaSignals: {},
      selectedProjects: [],
      selectedSkills: [],
    };

    (ResumeProfile.findOne as any).mockResolvedValue(mockProfile);
    (Project.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        { 
          _id: new Types.ObjectId(),
          title: 'Advanced System Architecture', 
          techStack: ['Docker', 'Node.js', 'Redis', 'AWS', 'Kubernetes', 'Kafka'], 
          description: 'A highly scalable distributed system handling millions of concurrent events. Implements microservices architecture with robust CI/CD pipelines and monitoring.',
          totalCommits: 250,
          stars: 45,
          forks: 12,
          repoUrl: 'https://github.com/test/advanced-system',
          liveUrl: 'https://advanced-system.io'
        }
      ])
    });

    const result = await engine.orchestrate(userId);

    expect(ResumeProfile.findOne).toHaveBeenCalledWith({ userId });
    expect(mockProfile.save).toHaveBeenCalled();
    expect(result.credibilityScore).toBeDefined();
    expect(result.prioritizedProjects.length).toBeGreaterThan(0);
  });

  it('should create a new profile if one does not exist', async () => {
    (ResumeProfile.findOne as any).mockResolvedValue(null);
    (ResumeProfile.create as any).mockResolvedValue({
      _id: new Types.ObjectId(),
      userId,
      save: vi.fn().mockResolvedValue(true),
      metadata: { lastGeneratedAt: null, generationCount: 0 },
      infraSignals: {},
      systemDesignSignals: {},
      dsaSignals: {},
      selectedProjects: [],
      selectedSkills: [],
    });
    (Project.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([])
    });

    await engine.orchestrate(userId);

    expect(ResumeProfile.create).toHaveBeenCalledWith({ userId });
  });
});
