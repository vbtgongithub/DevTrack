// src/modules/platform-sync/adapters/BasePlatformAdapter.ts
// Extracts the sync() boilerplate shared by all platform adapters.

import { logger } from '../../../shared/logger.js';
import type {
  PlatformAdapter,
  PlatformSubmission,
  PlatformStats,
  PlatformProfile,
  AdapterSyncResult,
} from './types.js';

export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly platform: PlatformAdapter['platform'];

  abstract fetchSubmissions(username: string, since?: Date): Promise<PlatformSubmission[]>;
  abstract fetchStats(username: string): Promise<PlatformStats>;
  abstract fetchProfile(username: string): Promise<PlatformProfile>;

  async sync(username: string, since?: Date): Promise<AdapterSyncResult> {
    const start = Date.now();
    try {
      const [stats, submissions, profile] = await Promise.all([
        this.fetchStats(username),
        this.fetchSubmissions(username, since),
        this.fetchProfile(username),
      ]);

      return {
        success: true,
        submissions,
        stats,
        profile,
        newCount: submissions.length,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      logger.error(`[${this.platform}-adapter] Sync failed`, err);
      return {
        success: false,
        submissions: [],
        stats: this.emptyStats(),
        newCount: 0,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    }
  }

  protected emptyStats(): PlatformStats {
    return {
      platform: this.platform,
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      fetchedAt: new Date(),
    };
  }
}
