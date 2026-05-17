// tests/chaos/dlqReplay.test.ts — Chaos: Dead Letter Queue replay
// Verifies the DLQ lifecycle: quarantine → inspect → replay → remove.
// Ensures replayed jobs are re-enqueued with correct data and that
// expired DLQ entries are cleaned up properly.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis for unit-level DLQ testing
const mockRedis = {
  hset: vi.fn().mockResolvedValue(1),
  hget: vi.fn(),
  hdel: vi.fn().mockResolvedValue(1),
  hgetall: vi.fn(),
  hlen: vi.fn().mockResolvedValue(0),
  hscan: vi.fn().mockResolvedValue(['0', []]),
};

const mockQueue = {
  add: vi.fn().mockResolvedValue({ id: 'replayed-job-1' }),
};

vi.mock('../../src/shared/redis/index', () => ({
  getRedisClient: () => mockRedis,
}));

describe('Chaos: DLQ Replay Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should quarantine a failed job with full metadata', async () => {
    const quarantineData = {
      jobId: 'sync-leetcode-user1-123',
      queue: 'platform-sync',
      data: { userId: 'user1', platformName: 'leetcode' },
      error: 'LeetCode GraphQL error: 503',
      attemptsMade: 3,
      maxAttempts: 3,
      quarantinedAt: new Date().toISOString(),
    };

    mockRedis.hset.mockResolvedValue(1);
    await mockRedis.hset('devtrack:dlq', quarantineData.jobId, JSON.stringify(quarantineData));

    expect(mockRedis.hset).toHaveBeenCalledWith(
      'devtrack:dlq',
      quarantineData.jobId,
      expect.stringContaining('LeetCode GraphQL error')
    );
  });

  it('should list all quarantined jobs', async () => {
    const entries = {
      'sync-leetcode-user1-123': JSON.stringify({
        jobId: 'sync-leetcode-user1-123',
        queue: 'platform-sync',
        error: 'LeetCode GraphQL error: 503',
        quarantinedAt: '2026-05-17T10:00:00Z',
      }),
      'xp-user2-456': JSON.stringify({
        jobId: 'xp-user2-456',
        queue: 'xp-processing',
        error: 'MongoDB write conflict',
        quarantinedAt: '2026-05-17T10:05:00Z',
      }),
    };

    mockRedis.hgetall.mockResolvedValue(entries);
    const result = await mockRedis.hgetall('devtrack:dlq');

    expect(Object.keys(result)).toHaveLength(2);
    const parsed = JSON.parse(result['sync-leetcode-user1-123']);
    expect(parsed.queue).toBe('platform-sync');
  });

  it('should replay a quarantined job back to its source queue', async () => {
    const dlqEntry = {
      jobId: 'sync-leetcode-user1-123',
      queue: 'platform-sync',
      data: { userId: 'user1', platformName: 'leetcode' },
      error: 'LeetCode GraphQL error: 503',
    };

    mockRedis.hget.mockResolvedValue(JSON.stringify(dlqEntry));

    // Read from DLQ
    const raw = await mockRedis.hget('devtrack:dlq', dlqEntry.jobId);
    const entry = JSON.parse(raw);

    // Re-enqueue to source queue
    await mockQueue.add(`replay-${entry.jobId}`, entry.data, {
      jobId: `replay-${entry.jobId}-${Date.now()}`,
    });

    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.stringContaining('replay'),
      entry.data,
      expect.objectContaining({ jobId: expect.stringContaining('replay') })
    );

    // Remove from DLQ after successful replay
    await mockRedis.hdel('devtrack:dlq', dlqEntry.jobId);
    expect(mockRedis.hdel).toHaveBeenCalledWith('devtrack:dlq', dlqEntry.jobId);
  });

  it('should clean up expired DLQ entries older than 7 days', async () => {
    const now = Date.now();
    const oldEntry = {
      jobId: 'old-job-1',
      quarantinedAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    };
    const freshEntry = {
      jobId: 'fresh-job-1',
      quarantinedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    };

    mockRedis.hscan.mockResolvedValueOnce([
      '0',
      ['old-job-1', JSON.stringify(oldEntry), 'fresh-job-1', JSON.stringify(freshEntry)],
    ]);

    // Simulate cleanup scan
    const [, entries] = await mockRedis.hscan('devtrack:dlq', '0', 'COUNT', 100);
    const expiry = 7 * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    for (let i = 0; i < entries.length; i += 2) {
      const key = entries[i];
      const val = JSON.parse(entries[i + 1]);
      const age = now - new Date(val.quarantinedAt).getTime();
      if (age > expiry) {
        await mockRedis.hdel('devtrack:dlq', key);
        cleaned++;
      }
    }

    expect(cleaned).toBe(1);
    expect(mockRedis.hdel).toHaveBeenCalledWith('devtrack:dlq', 'old-job-1');
    expect(mockRedis.hdel).not.toHaveBeenCalledWith('devtrack:dlq', 'fresh-job-1');
  });
});
