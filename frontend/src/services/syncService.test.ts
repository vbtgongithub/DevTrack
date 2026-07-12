import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the axios client so no real HTTP happens.
vi.mock('../utils/axiosClient', () => ({
  default: { post: vi.fn() },
}));

import axiosClient from '../utils/axiosClient';
import { syncAllPlatforms, syncPlatformWithRetry } from './syncService';

const mockedPost = axiosClient.post as unknown as ReturnType<typeof vi.fn>;

describe('syncService', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('syncs a platform successfully on the first attempt', async () => {
    mockedPost.mockResolvedValue({ data: { success: true } });

    const result = await syncPlatformWithRetry('leetcode');

    expect(result.success).toBe(true);
    expect(result.status).toBe('synced');
    expect(result.attempts).toBe(1);
    expect(mockedPost).toHaveBeenCalledTimes(1);
  });

  it('retries up to 3 attempts on HTTP 429 then gives up (no infinite loop)', async () => {
    mockedPost.mockRejectedValue({ statusCode: 429, message: 'Too Many Requests' });

    const result = await syncPlatformWithRetry('codeforces');

    expect(mockedPost).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(false);
    expect(result.status).toBe('rate_limited');
    expect(result.attempts).toBe(3);
  });

  it('does not retry on non-429 errors', async () => {
    mockedPost.mockRejectedValue({ statusCode: 500, message: 'Server error' });

    const result = await syncPlatformWithRetry('codechef');

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.status).toBe('error');
  });

  it('recovers when a retry succeeds after a 429', async () => {
    mockedPost
      .mockRejectedValueOnce({ statusCode: 429 })
      .mockResolvedValueOnce({ data: { success: true } });

    const result = await syncPlatformWithRetry('leetcode');

    expect(mockedPost).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it('syncs all platforms sequentially and continues past a failure', async () => {
    mockedPost.mockImplementation((url: string) => {
      if (url.includes('codeforces')) {
        return Promise.reject({ statusCode: 500, message: 'nope' });
      }
      return Promise.resolve({ data: { success: true } });
    });

    const results = await syncAllPlatforms(['leetcode', 'codeforces', 'codechef']);

    expect(results.map((r) => r.platform)).toEqual(['leetcode', 'codeforces', 'codechef']);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });
});
