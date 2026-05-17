// src/modules/observation/sessionReplay.service.ts — Session Replay Service
// Phase-J: Real User Observation System - Session replay metadata and UX friction tracking

import mongoose from 'mongoose';
import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { BetaUser } from '../../db/models/betaUser.model.js';
import { logger } from '../../shared/logger.js';

export interface SessionMetadata {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  deviceInfo: {
    userAgent: string;
    viewport: { width: number; height: number };
    deviceType?: 'desktop' | 'tablet' | 'mobile';
  };
}

export interface InteractionEvent {
  sessionId: string;
  element: string;
  action: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface FrictionEvent {
  sessionId: string;
  element: string;
  type: 'hesitation' | 'confusion' | 'error' | 'abandonment';
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  context?: Record<string, unknown>;
}

export const sessionReplay = {
  // ─── Start Session Replay ────────────────────────────────────────────────
  async startSession(metadata: SessionMetadata): Promise<void> {
    const betaUser = await BetaUser.findOne({ userId: metadata.userId });

    await SessionReplay.create({
      sessionId: metadata.sessionId,
      userId: metadata.userId,
      betaUserId: betaUser?._id,
      cohortId: betaUser?.cohortId,
      startTime: metadata.startTime,
      pages: [],
      interactions: [],
      frictionEvents: [],
      networkRequests: [],
      performanceMetrics: {},
      deviceInfo: metadata.deviceInfo,
      diagnosticsEnabled: betaUser?.diagnosticsEnabled ?? true,
    });

    logger.debug('[session-replay] Session started', { sessionId: metadata.sessionId });
  },

  // ─── End Session Replay ─────────────────────────────────────────────────
  async endSession(sessionId: string): Promise<void> {
    const replay = await SessionReplay.findOne({ sessionId });
    if (!replay) return;

    replay.endTime = new Date();
    replay.duration = replay.endTime.getTime() - replay.startTime.getTime();

    await replay.save();

    logger.debug('[session-replay] Session ended', { sessionId, duration: replay.duration });
  },

  // ─── Record Page View ───────────────────────────────────────────────────
  async recordPageView(sessionId: string, path: string): Promise<void> {
    const replay = await SessionReplay.findOne({ sessionId });
    if (!replay) return;

    // Exit previous page if exists
    const lastPage = replay.pages[replay.pages.length - 1];
    if (lastPage && !lastPage.exitedAt) {
      lastPage.exitedAt = new Date();
      lastPage.duration = lastPage.exitedAt.getTime() - lastPage.enteredAt.getTime();
    }

    // Add new page
    replay.pages.push({
      path,
      enteredAt: new Date(),
    });

    await replay.save();
  },

  // ─── Record Interaction ────────────────────────────────────────────────
  async recordInteraction(event: InteractionEvent): Promise<void> {
    const replay = await SessionReplay.findOne({ sessionId: event.sessionId });
    if (!replay) return;

    replay.interactions.push({
      element: event.element,
      action: event.action,
      timestamp: event.timestamp,
      context: event.context,
    });

    await replay.save();
  },

  // ─── Record Friction Event ──────────────────────────────────────────────
  async recordFrictionEvent(event: FrictionEvent): Promise<void> {
    const replay = await SessionReplay.findOne({ sessionId: event.sessionId });
    if (!replay) return;

    replay.frictionEvents.push({
      element: event.element,
      type: event.type,
      severity: event.severity,
      timestamp: event.timestamp,
      context: event.context,
    });

    await replay.save();

    logger.debug('[session-replay] Friction event recorded', { sessionId: event.sessionId, type: event.type });
  },

  // ─── Record Network Request ─────────────────────────────────────────────
  async recordNetworkRequest(
    sessionId: string,
    url: string,
    method: string,
    status: number,
    duration: number
  ): Promise<void> {
    const replay = await SessionReplay.findOne({ sessionId });
    if (!replay) return;

    replay.networkRequests.push({
      url,
      method,
      status,
      duration,
      timestamp: new Date(),
    });

    await replay.save();
  },

  // ─── Record Performance Metrics ────────────────────────────────────────
  async recordPerformanceMetrics(
    sessionId: string,
    metrics: {
      loadTime?: number;
      firstContentfulPaint?: number;
      timeToInteractive?: number;
      cumulativeLayoutShift?: number;
    }
  ): Promise<void> {
    const replay = await SessionReplay.findOne({ sessionId });
    if (!replay) return;

    replay.performanceMetrics = {
      ...replay.performanceMetrics,
      ...metrics,
    };

    await replay.save();
  },

  // ─── Get Session Replay ───────────────────────────────────────────────
  async getSessionReplay(sessionId: string) {
    return SessionReplay.findOne({ sessionId });
  },

  // ─── Get User Session Replays ─────────────────────────────────────────
  async getUserSessionReplays(userId: mongoose.Types.ObjectId, limit: number = 10) {
    return SessionReplay.find({ userId })
      .sort({ startTime: -1 })
      .limit(limit);
  },

  // ─── Get Friction Summary ──────────────────────────────────────────────
  async getFrictionSummary(dateRange: { start: Date; end: Date }): Promise<{
    totalFrictionEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    topElements: Array<{ element: string; count: number }>;
  }> {
    const replays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const elementCounts = new Map<string, number>();

    replays.forEach(replay => {
      replay.frictionEvents.forEach(event => {
        byType[event.type] = (byType[event.type] || 0) + 1;
        bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
        elementCounts.set(event.element, (elementCounts.get(event.element) || 0) + 1);
      });
    });

    const topElements = Array.from(elementCounts.entries())
      .map(([element, count]) => ({ element, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalFrictionEvents: replays.reduce((sum, r) => sum + r.frictionEvents.length, 0),
      byType,
      bySeverity,
      topElements,
    };
  },
};

export default sessionReplay;
