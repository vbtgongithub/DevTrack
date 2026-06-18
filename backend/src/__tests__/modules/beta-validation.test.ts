// src/__tests__/modules/beta-validation.test.ts
// Unit tests for closed beta onboarding, telemetry, feedback calibration loops, and product readiness reporting.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BetaAccessInfrastructure } from '../../modules/onboarding/BetaAccessInfrastructure.js';
import { FeedbackIntelligenceLoop, FeedbackReport } from '../../modules/calibration/FeedbackIntelligenceLoop.js';
import { ProductReadinessEvaluation } from '../../modules/calibration/ProductReadinessEvaluation.js';
import { getRedisClient } from '../../shared/redis/client.js';

// Mock Redis client singleton
vi.mock('../../shared/redis/client.js', () => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    lpush: vi.fn(),
    ltrim: vi.fn(),
    hset: vi.fn(),
    incr: vi.fn(),
  };
  return {
    getRedisClient: () => mockRedis,
    disconnectRedis: vi.fn(),
  };
});

vi.mock('../../shared/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BetaAccessInfrastructure', () => {
  let mockRedis: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis = getRedisClient();
  });

  describe('validateInviteCode', () => {
    it('should validate invite code successfully and increment usage', async () => {
      const inviteData = {
        code: 'valid_code',
        maxUses: 5,
        usesCount: 2,
        cohortId: 'cohort-a-standard',
        createdBy: 'admin',
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(inviteData));

      const result = await BetaAccessInfrastructure.validateInviteCode('valid_code');

      expect(result.valid).toBe(true);
      expect(result.cohortId).toBe('cohort-a-standard');
      expect(mockRedis.get).toHaveBeenCalledWith('beta:invite:valid_code');
      expect(mockRedis.set).toHaveBeenCalled();
      
      const setCallArgs = mockRedis.set.mock.calls[0];
      expect(setCallArgs[0]).toBe('beta:invite:valid_code');
      const updatedInvite = JSON.parse(setCallArgs[1]);
      expect(updatedInvite.usesCount).toBe(3);
    });

    it('should fail validation when invite code has reached maximum uses', async () => {
      const inviteData = {
        code: 'expired_code',
        maxUses: 3,
        usesCount: 3,
        cohortId: 'cohort-a-standard',
        createdBy: 'admin',
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(inviteData));

      const result = await BetaAccessInfrastructure.validateInviteCode('expired_code');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invite code maximum usage reached');
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should fall back to dev simulation for DEVTRACK_BETA_ keys', async () => {
      mockRedis.get.mockResolvedValue(null);

      const resultInfra = await BetaAccessInfrastructure.validateInviteCode('DEVTRACK_BETA_INFRA');
      expect(resultInfra.valid).toBe(true);
      expect(resultInfra.cohortId).toBe('cohort-b-heavy-infra');

      const resultStd = await BetaAccessInfrastructure.validateInviteCode('DEVTRACK_BETA_ANY');
      expect(resultStd.valid).toBe(true);
      expect(resultStd.cohortId).toBe('cohort-a-standard');
    });

    it('should return invalid for unknown codes', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await BetaAccessInfrastructure.validateInviteCode('unknown_code');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid invite code');
    });
  });

  describe('isFeatureEnabled', () => {
    it('should enable specific features based on cohort rules', () => {
      // live-semantic-search: active for cohort-b or based on user charCode % 2
      expect(BetaAccessInfrastructure.isFeatureEnabled('user1', 'live-semantic-search', 'cohort-b-heavy-infra')).toBe(true);
      
      // user1 charCode('u') is 117 (odd), user2 charCode('u') is 117, wait, charCode(0) of 'A' is 65 (odd), 'B' is 66 (even)
      expect(BetaAccessInfrastructure.isFeatureEnabled('B', 'live-semantic-search', 'cohort-a-standard')).toBe(true);
      expect(BetaAccessInfrastructure.isFeatureEnabled('A', 'live-semantic-search', 'cohort-a-standard')).toBe(false);

      // ats-realism-heatmap is fully rolled out
      expect(BetaAccessInfrastructure.isFeatureEnabled('any', 'ats-realism-heatmap')).toBe(true);

      // evolution-replay-scrubber is infra cohort only
      expect(BetaAccessInfrastructure.isFeatureEnabled('any', 'evolution-replay-scrubber', 'cohort-b-heavy-infra')).toBe(true);
      expect(BetaAccessInfrastructure.isFeatureEnabled('any', 'evolution-replay-scrubber', 'cohort-a-standard')).toBe(false);
    });
  });

  describe('trackTelemetry', () => {
    it('should log telemetry events to Redis lists and update user progression hashes', async () => {
      const eventDate = new Date();
      await BetaAccessInfrastructure.trackTelemetry({
        userId: 'dev_user_123',
        eventType: 'github_connected',
        timestamp: eventDate,
        metadata: { repoCount: 5 },
      });

      expect(mockRedis.lpush).toHaveBeenCalledWith('beta:telemetry:events', expect.any(String));
      expect(mockRedis.ltrim).toHaveBeenCalledWith('beta:telemetry:events', 0, 9999);
      expect(mockRedis.hset).toHaveBeenCalledWith('beta:telemetry:user:dev_user_123', {
        [`last_event:github_connected`]: eventDate.toISOString(),
        current_state: 'github_connected',
      });
    });
  });

  describe('createInviteCode', () => {
    it('should create invite code with a known cohort', async () => {
      await BetaAccessInfrastructure.createInviteCode('new_invite', 'cohort-b-heavy-infra', 20);
      expect(mockRedis.set).toHaveBeenCalled();
      const setCallArgs = mockRedis.set.mock.calls[0];
      expect(setCallArgs[0]).toBe('beta:invite:new_invite');
      expect(JSON.parse(setCallArgs[1])).toMatchObject({
        code: 'new_invite',
        cohortId: 'cohort-b-heavy-infra',
        maxUses: 20,
      });
    });

    it('should throw error for unknown cohortId', async () => {
      await expect(
        BetaAccessInfrastructure.createInviteCode('invalid_cohort_invite', 'unknown-cohort')
      ).rejects.toThrow('Unknown cohortId: unknown-cohort');
    });
  });
});

describe('FeedbackIntelligenceLoop', () => {
  let mockRedis: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis = getRedisClient();
  });

  describe('submitFeedback', () => {
    it('should save feedback report and increment category mismatch logs counter', async () => {
      const mockReport: FeedbackReport = {
        reportId: 'rep_001',
        userId: 'usr_002',
        source: 'recruiter',
        category: 'semantic_mismatch',
        mismatchDetails: {
          expectedValue: 'infra engineer',
          systemValue: 'web designer',
          reasoning: 'Missing docker signal indexing',
        },
        timestamp: new Date(),
      };

      mockRedis.get.mockResolvedValue('3'); // Current mismatch counter is 3

      await FeedbackIntelligenceLoop.submitFeedback(mockReport);

      expect(mockRedis.lpush).toHaveBeenCalledWith('calibration:feedback:list', expect.any(String));
      expect(mockRedis.incr).toHaveBeenCalledWith('calibration:mismatches:semantic_mismatch');
    });

    it('should trigger dynamic weights recalibration when threshold matches multiplier of 10', async () => {
      const mockReport: FeedbackReport = {
        reportId: 'rep_002',
        userId: 'usr_003',
        source: 'developer',
        category: 'ats',
        mismatchDetails: {
          expectedValue: 'ATS formatted parser parseable text',
          systemValue: 'broken JSON text',
          reasoning: 'broken columns',
        },
        timestamp: new Date(),
      };

      // Set mock counters to 10 to trigger calibration check
      mockRedis.get.mockImplementation((key: string) => {
        if (key === 'calibration:mismatches:ats') return Promise.resolve('10');
        if (key === 'calibration:weights:ats') return Promise.resolve('1.0');
        return Promise.resolve(null);
      });

      await FeedbackIntelligenceLoop.submitFeedback(mockReport);

      // Calibration triggered!
      expect(mockRedis.set).toHaveBeenCalledWith('calibration:weights:ats', '1.05');
    });

    it('should calibrate semantic match threshold down when recruiter semantic mismatches occur', async () => {
      const mockReport: FeedbackReport = {
        reportId: 'rep_003',
        userId: 'usr_004',
        source: 'recruiter',
        category: 'semantic_mismatch',
        mismatchDetails: { expectedValue: 'A', systemValue: 'B', reasoning: 'C' },
        timestamp: new Date(),
      };

      mockRedis.get.mockImplementation((key: string) => {
        if (key === 'calibration:mismatches:semantic_mismatch') return Promise.resolve('20');
        if (key === 'calibration:weights:semantic_mismatch') return Promise.resolve('0.85');
        return Promise.resolve(null);
      });

      await FeedbackIntelligenceLoop.submitFeedback(mockReport);

      // Semantic matching threshold calibration reduces score threshold by 0.05
      expect(mockRedis.set).toHaveBeenCalledWith('calibration:weights:semantic_mismatch', '0.8');
    });
  });

  describe('getFeedbackStats', () => {
    it('should compile stats for all active feedback categories', async () => {
      mockRedis.get.mockImplementation((key: string) => {
        if (key === 'calibration:mismatches:onboarding') return Promise.resolve('5');
        if (key === 'calibration:mismatches:recommendation') return Promise.resolve('12');
        if (key === 'calibration:mismatches:ats') return Promise.resolve('2');
        return Promise.resolve(null);
      });

      const stats = await FeedbackIntelligenceLoop.getFeedbackStats();

      expect(stats).toEqual({
        onboarding: 5,
        recommendation: 12,
        ats: 2,
        semantic_mismatch: 0,
        credibility: 0,
      });
    });
  });
});

describe('ProductReadinessEvaluation', () => {
  let mockRedis: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis = getRedisClient();
  });

  describe('executeDiagnosticSuite', () => {
    it('should run full system checkups and compile correct scorecard index values', async () => {
      mockRedis.get.mockImplementation((key: string) => {
        if (key === 'beta:telemetry:onboard_starts') return Promise.resolve('150');
        if (key === 'beta:telemetry:onboard_completes') return Promise.resolve('135'); // 90% onboarding
        if (key === 'observability:latency:p95') return Promise.resolve('140'); // p95 < 200 ms => 95%
        if (key === 'calibration:mismatches:semantic_mismatch') return Promise.resolve('15'); // 15 mismatches / 150 searches => 90%
        if (key === 'calibration:mismatches:recommendation') return Promise.resolve('30'); // 30 mismatches / 300 recommendations => 90%
        if (key === 'calibration:mismatches:ats') return Promise.resolve('4'); // 100 - 4*5 = 80%
        return Promise.resolve(null);
      });

      const result = await ProductReadinessEvaluation.executeDiagnosticSuite();

      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.scorecard.onboardingMaturity).toBe(90);
      expect(result.scorecard.operationalMaturity).toBe(95);
      expect(result.scorecard.semanticMaturity).toBe(90);
      expect(result.scorecard.recommendationMaturity).toBe(90);
      expect(result.scorecard.atsMaturity).toBe(80);
      
      expect(result.report).toContain('# Product Maturity & Readiness Report');
      expect(result.report).toContain('gantt');
      expect(result.report).toContain('section Onboarding');
      expect(result.report).toContain('140ms');
    });
  });
});
