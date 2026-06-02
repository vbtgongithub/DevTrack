// src/__tests__/modules/resume/report-generation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeIntelligenceReportEngine } from '../../../modules/resume/reports/ResumeIntelligenceReportEngine.js';
import { ResumeSession } from '../../../db/models/resumeSession.model.js';
import { ResumeProfile } from '../../../db/models/resumeProfile.model.js';
import { Project } from '../../../db/models/project.model.js';
import { ATSAnalysis } from '../../../db/models/atsAnalysis.model.js';
import { ResumeEvidenceClaim } from '../../../db/models/resumeEvidenceClaim.model.js';
import { Types } from 'mongoose';

vi.mock('../../../shared/logger.js');
vi.mock('../../../db/models/resumeSession.model.js');
vi.mock('../../../db/models/resumeProfile.model.js');
vi.mock('../../../db/models/project.model.js');
vi.mock('../../../db/models/atsAnalysis.model.js');
vi.mock('../../../db/models/resumeEvidenceClaim.model.js');

describe('ResumeIntelligenceReportEngine', () => {
  let engine: ResumeIntelligenceReportEngine;
  const userId = new Types.ObjectId();
  const sessionId = 'test-session-123';

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ResumeIntelligenceReportEngine();
  });

  it('should generate a complete 14-section intelligence report dossier', async () => {
    // 1. Mock ResumeSession lookup and query chains
    const mockSession = {
      sessionId,
      userId,
      parsedContent: {
        text: 'Experienced Node Express Backend Developer working with Docker, Kubernetes, Prometheus, Redis, and Kafka. Built replicated Postgres architectures, designed GraphQL APIs, and deployed microservice instances with GitHub Actions.',
        sections: { summary: 'DevOps & Backend Engineer summary' },
        headings: ['Summary', 'Skills', 'Projects'],
        bullets: [],
        links: [],
        metadata: {},
        parsingDiagnostics: { confidence: 95, warnings: [], errors: [] },
      },
      currentStage: 'RECOMMENDING',
      save: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(ResumeSession.findOne).mockResolvedValue(mockSession as any);

    const mockFindChain = {
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(ResumeSession.find).mockReturnValue(mockFindChain as any);

    // 2. Mock ResumeProfile lookup
    const mockProfile = {
      _id: new Types.ObjectId(),
      userId,
      targetRole: 'Backend Engineer',
      selectedSkills: ['Docker', 'Kubernetes', 'Redis', 'Kafka'],
    };
    vi.mocked(ResumeProfile.findOne).mockResolvedValue(mockProfile as any);
    vi.mocked(ResumeProfile.findById).mockResolvedValue(mockProfile as any);

    // 3. Mock Evidence claims lookup
    vi.mocked(ResumeEvidenceClaim.find).mockResolvedValue([] as any);

    // 4. Mock Projects lookup
    const mockProjects = [
      {
        name: 'Distributed Processing System',
        description: 'Designed a high-throughput transaction backend that handles millions of requests utilizing Redis queue structures and Prometheus observability.',
        techStack: ['Node.js', 'Docker', 'Redis', 'Prometheus'],
        totalCommits: 45,
        repoUrl: 'https://github.com/user/project1',
        liveUrl: 'https://project1.com',
      }
    ];
    const mockProjectFind = {
      lean: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((onfulfilled) => {
        return Promise.resolve(mockProjects).then(onfulfilled);
      })
    };
    vi.mocked(Project.find).mockReturnValue(mockProjectFind as any);

    // 5. Mock ATSAnalysis creation in ATS Compatibility Engine
    vi.mocked(ATSAnalysis.create).mockResolvedValue({
      atsScore: 82,
      extractionConfidence: 95,
      parserWarnings: [],
      formattingWarnings: [],
      keywordCoverage: [],
      sectionIntegrity: [
        { sectionName: 'summary', detected: true },
        { sectionName: 'experience', detected: true },
        { sectionName: 'projects', detected: true },
        { sectionName: 'skills', detected: true },
      ],
      recommendations: [],
    } as any);

    // 6. Execute report generation
    const report = await engine.generateReport(userId, sessionId);

    // 7. Assertions checking the 14 structural segments
    expect(report).toBeDefined();
    
    // Check Executive Summary & scores
    expect(report.executiveSummary).toBeDefined();
    expect(report.executiveSummary.engineeringMaturity).toBeDefined();
    expect(report.executiveSummary.atsSurvivability).toBeDefined();
    expect(report.executiveSummary.recruiterTrustLevel).toBeDefined();
    
    // Check ATS metrics
    expect(report.atsAnalysis).toBeDefined();
    expect(report.atsAnalysis.atsScore).toBeDefined();
    
    // Check role alignments
    expect(report.roleAlignment).toBeDefined();
    expect(report.roleAlignment.backend).toBeGreaterThan(40);
    expect(report.roleAlignment.platform).toBeDefined();
    
    // Check credibility, infrastructure and project evaluation
    expect(report.credibilityAnalysis).toBeDefined();
    expect(report.credibilityAnalysis.overallScore).toBeDefined();
    expect(report.infrastructureMaturity).toBeDefined();
    expect(report.infrastructureMaturity.deploymentMaturity).toBeDefined();
    expect(report.credibilityAnalysis.projectRankings.length).toBeGreaterThan(0);
    
    // Check senior guidance recommendations
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations[0].category).toBeDefined();
    
    // Check recruiter simulation triggers
    expect(report.recruiterProjection).toBeDefined();
    expect(report.recruiterProjection.narrative).toBeDefined();
    expect(report.recruiterProjection.interviewTriggers.length).toBeGreaterThan(0);
    
    // Check risk profile
    expect(report.riskAnalysis).toBeDefined();
    expect(report.riskAnalysis.atsRisks).toBeDefined();
    
    // Check operational readiness indicators
    expect(report.operationalReadiness).toBeDefined();
    expect(report.operationalReadiness.deploymentReadiness).toBeDefined();
    
    // Check verdict
    expect(report.finalVerdict).toBeDefined();
    expect(report.finalVerdict.length).toBeGreaterThan(10);
  });
});
