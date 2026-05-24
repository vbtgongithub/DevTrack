// ============================================================================
// focusEngine.service.ts — Focus Engine Backend Service
// ============================================================================
// Manages deep work session persistence, quality scoring, and session history.
// ============================================================================

import { Types } from 'mongoose';
import { FocusSession } from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';

export interface FocusSessionResult {
  sessionId: string;
  qualityScore: number;
  actualDuration: number;
}

export class FocusEngine {
  /**
   * Starts a new focus session and persists it.
   */
  async startSession(userId: string, mode: string, durationMinutes: number): Promise<string> {
    const session = await FocusSession.create({
      userId: new Types.ObjectId(userId),
      mode,
      status: 'running',
      startedAt: new Date(),
      plannedDurationMinutes: durationMinutes,
    });
    return session._id.toString();
  }

  /**
   * Records a heartbeat to verify active focus.
   */
  async recordHeartbeat(sessionId: string): Promise<void> {
    await FocusSession.updateOne(
      { _id: new Types.ObjectId(sessionId) },
      { $inc: { heartbeatCount: 1 } }
    );
  }

  /**
   * Completes a focus session and calculates the quality score.
   */
  async completeSession(sessionId: string): Promise<FocusSessionResult | null> {
    const session = await FocusSession.findById(sessionId);
    if (!session || session.status !== 'running') return null;

    const completedAt = new Date();
    const actualDurationMinutes = Math.round((completedAt.getTime() - session.startedAt.getTime()) / 60000);
    
    // Quality Score Heuristics
    // 1. Completion Rate (0-50 pts)
    const completionRate = Math.min(1, actualDurationMinutes / session.plannedDurationMinutes);
    let score = completionRate * 50;

    // 2. Heartbeat Consistency (0-30 pts)
    // Expected 1 heartbeat every 30s. Buffer allowed.
    const expectedHeartbeats = actualDurationMinutes * 2;
    if (expectedHeartbeats > 0) {
      const heartbeatConsistency = Math.min(1, session.heartbeatCount / expectedHeartbeats);
      score += heartbeatConsistency * 30;
    } else {
      score += 30; // Short session fallback
    }

    // 3. Deep Work Bonus (0-20 pts)
    if (actualDurationMinutes >= 45) score += 20;
    else if (actualDurationMinutes >= 25) score += 10;

    const qualityScore = Math.min(100, Math.max(0, Math.round(score)));

    session.status = 'completed';
    session.completedAt = completedAt;
    session.actualDurationMinutes = actualDurationMinutes;
    session.focusQualityScore = qualityScore;

    await session.save();

    return {
      sessionId: session._id.toString(),
      qualityScore,
      actualDuration: actualDurationMinutes,
    };
  }

  /**
   * Aborts a focus session (e.g. user manually cancelled early).
   */
  async abortSession(sessionId: string): Promise<void> {
    await FocusSession.updateOne(
      { _id: new Types.ObjectId(sessionId) },
      { status: 'abandoned', completedAt: new Date() }
    );
  }

  /**
   * Gets recent focus sessions for the user.
   */
  async getSessionHistory(userId: string, limit = 10) {
    return FocusSession.find({ userId: new Types.ObjectId(userId), status: 'completed' })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();
  }
}

export const focusEngine = new FocusEngine();
