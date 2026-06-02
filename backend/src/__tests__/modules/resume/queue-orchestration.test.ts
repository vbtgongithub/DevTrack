// src/__tests__/modules/resume/queue-orchestration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Worker } from 'bullmq';
import { ResumeIntelligenceService } from '../../../modules/resume/services/ResumeIntelligenceService.js';
import { startResumeGenerationWorker, stopResumeGenerationWorker } from '../../../modules/resume/workers/resume-generation.worker.js';

// Mock BullMQ
vi.mock('bullmq', () => {
  return {
    Worker: vi.fn().mockImplementation(function(this: any) {
      this.on = vi.fn();
      this.close = vi.fn().mockResolvedValue(true);
    }),
    Queue: vi.fn(),
  };
});

vi.mock('../../../shared/logger.js');

// Mock Redis connection
vi.mock('../../../shared/redis/index.js', () => ({
  getRedisConnection: vi.fn().mockReturnValue({})
}));

// Mock the service module
vi.mock('../../../modules/resume/services/ResumeIntelligenceService.js', () => {
  return {
    ResumeIntelligenceService: vi.fn().mockImplementation(function(this: any) {
      this.generateResume = vi.fn().mockResolvedValue({});
      this.generateVariant = vi.fn().mockResolvedValue({});
    })
  };
});

describe('Queue Orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start and process resume generation jobs', async () => {
    let processorFunc: any;
    // Overwrite the implementation to capture the processor
    (Worker as any).mockImplementation(function(this: any, _queue: string, processor: any) {
      processorFunc = processor;
      this.on = vi.fn();
      this.close = vi.fn().mockResolvedValue(true);
    });

    startResumeGenerationWorker();

    expect(Worker).toHaveBeenCalled();

    const mockJob = {
      id: 'job_123',
      data: { userId: 'user_456' },
    };

    await processorFunc(mockJob);

    expect(ResumeIntelligenceService).toHaveBeenCalled();

    await stopResumeGenerationWorker();
  });
});
