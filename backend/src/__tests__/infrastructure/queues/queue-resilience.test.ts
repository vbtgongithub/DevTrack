import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { WorkerFactory } from '../../../infrastructure/queues/WorkerFactory.js';
import { QueueRegistry } from '../../../infrastructure/queues/QueueRegistry.js';
import { DeadLetterJob } from '../../../db/models/deadLetterJob.model.js';
import { NonRetryableError, RetryableError } from '../../../infrastructure/queues/ErrorClassifier.js';
import { Job, Queue, type ConnectionOptions } from 'bullmq';
import { getRedisClient } from '../../../shared/redis/index.js';
import mongoose from 'mongoose';

describe('Queue Resilience and WorkerFactory Tests', () => {
  const TEST_QUEUE = 'test-resilience-queue';
  let queue: Queue;

  beforeAll(async () => {
    // Connect to test database and redis
    await mongoose.connect(process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/devtrack-test');
    queue = QueueRegistry.getOrCreateQueue(TEST_QUEUE);
  });

  afterAll(async () => {
    await QueueRegistry.closeAllQueues();
    await mongoose.connection.close();
    await getRedisClient().quit();
  });

  beforeEach(async () => {
    await queue.drain();
    await DeadLetterJob.deleteMany({});
  });

  it('should successfully process a valid job', async () => {
    const mockProcessor = vi.fn().mockResolvedValue(true);
    
    const worker = WorkerFactory.createWorker(TEST_QUEUE, mockProcessor, {
      connection: getRedisClient() as unknown as ConnectionOptions
    });

    const job = await queue.add('test-job', { data: 'test' });
    
    // Wait for job to be processed
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(mockProcessor).toHaveBeenCalled();
    const state = await job.getState();
    expect(state).toBe('completed');

    await worker.close();
  });

  it('should route NonRetryableErrors immediately to Dead Letter Queue', async () => {
    const mockProcessor = vi.fn().mockRejectedValue(new Error('malformed json'));
    
    const worker = WorkerFactory.createWorker(TEST_QUEUE, mockProcessor, {
      connection: getRedisClient() as unknown as ConnectionOptions
    });

    const job = await queue.add('dlq-job', { payload: 'bad' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(mockProcessor).toHaveBeenCalledTimes(1); // Should only try once
    
    const state = await job.getState();
    expect(state).toBe('failed');

    const dlqCount = await DeadLetterJob.countDocuments({ jobId: job.id });
    expect(dlqCount).toBe(1);

    const dlqJob = await DeadLetterJob.findOne({ jobId: job.id });
    expect(dlqJob?.failureReason).toContain('[Fatal] malformed json');

    await worker.close();
  });

  it('should retry RetryableErrors with backoff', async () => {
    let attempts = 0;
    const mockProcessor = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('timeout from provider');
      }
      return true;
    });
    
    const worker = WorkerFactory.createWorker(TEST_QUEUE, mockProcessor, {
      connection: getRedisClient() as unknown as ConnectionOptions
    });

    const job = await queue.add('retry-job', { payload: 'retryable' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(mockProcessor).toHaveBeenCalledTimes(2); 
    
    const state = await job.getState();
    expect(state).toBe('completed');

    const dlqCount = await DeadLetterJob.countDocuments({ jobId: job.id });
    expect(dlqCount).toBe(0);

    await worker.close();
  });
});
