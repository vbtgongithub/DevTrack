// src/modules/calibration/FeedbackIntelligenceLoop.ts
// Handles real-world developer and recruiter corrections, mismatch logs, and feedback loops to calibrate engines.

import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface FeedbackReport {
  reportId: string;
  userId: string;
  source: 'developer' | 'recruiter' | 'admin';
  category: 'onboarding' | 'recommendation' | 'ats' | 'semantic_mismatch' | 'credibility';
  mismatchDetails: {
    expectedValue: unknown;
    systemValue: unknown;
    reasoning: string;
  };
  context?: Record<string, unknown>;
  timestamp: Date;
}

export class FeedbackIntelligenceLoop {
  /**
   * Log developer or recruiter mismatch correction feedback
   */
  static async submitFeedback(report: FeedbackReport): Promise<void> {
    const redis = getRedisClient();
    const listKey = `calibration:feedback:list`;
    const counterKey = `calibration:mismatches:${report.category}`;

    await redis.lpush(listKey, JSON.stringify(report));
    await redis.incr(counterKey);

    logger.info(`[FeedbackLoop] Received feedback in ${report.category} from ${report.source} regarding ${report.reportId}`);

    // Trigger dynamic recalibration if threshold matches
    const mismatchCount = parseInt((await redis.get(counterKey)) || '0', 10);
    if (mismatchCount % 10 === 0) {
      logger.info(`[FeedbackLoop] Multi-mismatch threshold reached for ${report.category} (${mismatchCount} entries). Initiating automatic weights recalibration.`);
      await this.runAutomaticCalibration(report.category);
    }
  }

  /**
   * Dynamic weight recalibration loop driven by user/recruiter feedback corrections
   */
  private static async runAutomaticCalibration(category: string): Promise<void> {
    const redis = getRedisClient();
    const calibrationKey = `calibration:weights:${category}`;

    // Read current calibration factor
    const rawVal = await redis.get(calibrationKey);
    let calibrationFactor = parseFloat(rawVal || '1.0');

    // Refine weighting factor based on mismatch statistics
    if (category === 'semantic_mismatch') {
      // Recruiter reported mismatch - reduce cosine threshold slightly to widen relevant pool
      calibrationFactor = Math.max(0.65, calibrationFactor - 0.05);
      logger.info(`[FeedbackLoop] Calibrated semantic cosine matching score threshold factor to: ${calibrationFactor}`);
    } else if (category === 'ats') {
      // Developer reported parser issues - tighten strictness factor
      calibrationFactor = Math.min(1.2, calibrationFactor + 0.05);
      logger.info(`[FeedbackLoop] Calibrated ATS parser weight multiplier factor to: ${calibrationFactor}`);
    } else if (category === 'recommendation') {
      // Noise reported - reduce frequency decay index
      calibrationFactor = Math.max(0.5, calibrationFactor - 0.1);
      logger.info(`[FeedbackLoop] Calibrated recommendation velocity index to: ${calibrationFactor}`);
    }

    // Format to avoid floating point precision quirks (e.g., 0.7999999999999999)
    const cleanedFactor = parseFloat(calibrationFactor.toFixed(4));
    await redis.set(calibrationKey, cleanedFactor.toString());
  }

  /**
   * Fetch all calibration correction logs for diagnostic audit
   */
  static async getFeedbackStats(): Promise<Record<string, number>> {
    const redis = getRedisClient();
    const categories = ['onboarding', 'recommendation', 'ats', 'semantic_mismatch', 'credibility'];
    const stats: Record<string, number> = {};

    for (const cat of categories) {
      const val = await redis.get(`calibration:mismatches:${cat}`);
      stats[cat] = parseInt(val || '0', 10);
    }

    return stats;
  }
}
