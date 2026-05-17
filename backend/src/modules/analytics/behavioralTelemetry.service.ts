// src/modules/analytics/behavioralTelemetry.service.ts — Behavioral Telemetry Service
// Phase-I: Real User Validation System - Tracks hesitation, abandonment, friction, and user behavior

import mongoose from 'mongoose';
import { BehavioralTelemetry, type IBehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface HesitationEvent {
  element: string;
  context: string;
  duration: number;
}

export interface AbandonmentEvent {
  action: string;
  step: string;
  reason?: string;
  context: Record<string, unknown>;
}

export interface FrictionEvent {
  element: string;
  type: 'confusion' | 'error' | 'slow_response' | 'repeated_action';
  severity: 'low' | 'medium' | 'high';
  context: Record<string, unknown>;
}

export interface FeatureInteraction {
  featureName: string;
  timeSpent: number;
  completed: boolean;
}

export interface EmotionalSignal {
  signal: 'frustration' | 'satisfaction' | 'confusion' | 'engagement' | 'fatigue';
  intensity: number;
  context: string;
}

const TELEMETRY_KEYS = {
  sessionData: (sessionId: string) => `telemetry:session:${sessionId}`,
  hesitationBuffer: (sessionId: string) => `telemetry:hesitation:${sessionId}`,
  activeUsers: 'telemetry:active_users',
};

export const behavioralTelemetry = {
  // ─── Session Management ────────────────────────────────────────────────
  async startSession(
    userId: string,
    deviceInfo?: { userAgent: string; screenResolution?: string; deviceType?: 'mobile' | 'tablet' | 'desktop' },
    networkInfo?: { connectionType?: string; effectiveType?: string }
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const telemetry = new BehavioralTelemetry({
      userId: new mongoose.Types.ObjectId(userId),
      sessionId,
      sessionStart: new Date(),
      pageViews: 0,
      activeTime: 0,
      deviceInfo,
      networkInfo,
      onboardingProgress: {
        currentStep: '',
        completedSteps: [],
        startTime: new Date(),
      },
      workspaceEngagement: {
        problemsAttempted: 0,
        problemsSolved: 0,
        averageTimePerProblem: 0,
        focusInterruptions: 0,
        keyboardWorkflowUsage: 0,
      },
    });

    await telemetry.save();

    // Cache session data for quick access
    const redis = getRedisClient();
    await redis.hset(TELEMETRY_KEYS.sessionData(sessionId), {
      userId,
      startTime: String(Date.now()),
      active: 'true',
    });
    await redis.expire(TELEMETRY_KEYS.sessionData(sessionId), 3600); // 1 hour

    // Track active users
    await redis.sadd(TELEMETRY_KEYS.activeUsers, userId);
    await redis.expire(TELEMETRY_KEYS.activeUsers, 300); // 5 minutes

    logger.debug('[behavioral-telemetry] Session started', { sessionId, userId });

    return sessionId;
  },

  async endSession(sessionId: string): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    const sessionEnd = new Date();
    const sessionDuration = sessionEnd.getTime() - telemetry.sessionStart.getTime();

    telemetry.sessionEnd = sessionEnd;
    telemetry.sessionDuration = sessionDuration;
    await telemetry.save();

    // Clean up cache
    const redis = getRedisClient();
    await redis.del(TELEMETRY_KEYS.sessionData(sessionId));

    logger.debug('[behavioral-telemetry] Session ended', { sessionId, duration: sessionDuration });
  },

  // ─── Hesitation Detection ─────────────────────────────────────────────
  async trackHesitation(sessionId: string, event: HesitationEvent): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    telemetry.hesitationPoints.push({
      element: event.element,
      timestamp: new Date(),
      hesitationDuration: event.duration,
      context: event.context,
    });

    await telemetry.save();

    // If hesitation > 5 seconds, flag as potential friction
    if (event.duration > 5000) {
      await this.trackFriction(sessionId, {
        element: event.element,
        type: 'confusion',
        severity: event.duration > 10000 ? 'high' : 'medium',
        context: { hesitationDuration: event.duration, originalContext: event.context },
      });
    }

    logger.debug('[behavioral-telemetry] Hesitation tracked', { sessionId, element: event.element, duration: event.duration });
  },

  // ─── Abandonment Tracking ─────────────────────────────────────────────
  async trackAbandonment(sessionId: string, event: AbandonmentEvent): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    telemetry.abandonmentEvents.push({
      action: event.action,
      step: event.step,
      timestamp: new Date(),
      reason: event.reason,
      context: event.context,
    });

    await telemetry.save();

    logger.info('[behavioral-telemetry] Abandonment tracked', { sessionId, action: event.action, step: event.step });
  },

  // ─── Friction Detection ────────────────────────────────────────────────
  async trackFriction(sessionId: string, event: FrictionEvent): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    telemetry.frictionEvents.push({
      element: event.element,
      type: event.type,
      timestamp: new Date(),
      severity: event.severity,
      context: event.context,
    });

    await telemetry.save();

    logger.debug('[behavioral-telemetry] Friction tracked', { sessionId, element: event.element, type: event.type, severity: event.severity });
  },

  // ─── Feature Interaction Tracking ─────────────────────────────────────
  async trackFeatureInteraction(sessionId: string, interaction: FeatureInteraction): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    const existingFeature = telemetry.featureInteractions.find(f => f.featureName === interaction.featureName);

    if (existingFeature) {
      existingFeature.lastUsed = new Date();
      existingFeature.usageCount++;
      existingFeature.timeSpent += interaction.timeSpent;
      existingFeature.completionRate = interaction.completed
        ? ((existingFeature.completionRate * (existingFeature.usageCount - 1)) + 100) / existingFeature.usageCount
        : (existingFeature.completionRate * (existingFeature.usageCount - 1)) / existingFeature.usageCount;
    } else {
      telemetry.featureInteractions.push({
        featureName: interaction.featureName,
        firstSeen: new Date(),
        lastUsed: new Date(),
        usageCount: 1,
        timeSpent: interaction.timeSpent,
        completionRate: interaction.completed ? 100 : 0,
      });
    }

    await telemetry.save();

    logger.debug('[behavioral-telemetry] Feature interaction tracked', { sessionId, featureName: interaction.featureName });
  },

  // ─── Page View Tracking ───────────────────────────────────────────────
  async trackPageView(sessionId: string): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    telemetry.pageViews++;
    await telemetry.save();
  },

  // ─── Active Time Tracking ──────────────────────────────────────────────
  async updateActiveTime(sessionId: string, additionalTime: number): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    telemetry.activeTime += additionalTime;
    await telemetry.save();
  },

  // ─── Emotional Signal Tracking ─────────────────────────────────────────
  async trackEmotionalSignal(sessionId: string, signal: EmotionalSignal): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    telemetry.emotionalSignals.push({
      timestamp: new Date(),
      signal: signal.signal,
      intensity: signal.intensity,
      context: signal.context,
    });

    await telemetry.save();

    logger.debug('[behavioral-telemetry] Emotional signal tracked', { sessionId, signal: signal.signal, intensity: signal.intensity });
  },

  // ─── Workspace Engagement Tracking ────────────────────────────────────
  async updateWorkspaceEngagement(
    sessionId: string,
    updates: {
      problemsAttempted?: number;
      problemsSolved?: number;
      averageTimePerProblem?: number;
      focusInterruptions?: number;
      keyboardWorkflowUsage?: number;
    }
  ): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    if (updates.problemsAttempted !== undefined) telemetry.workspaceEngagement.problemsAttempted += updates.problemsAttempted;
    if (updates.problemsSolved !== undefined) telemetry.workspaceEngagement.problemsSolved += updates.problemsSolved;
    if (updates.averageTimePerProblem !== undefined) {
      telemetry.workspaceEngagement.averageTimePerProblem = updates.averageTimePerProblem;
    }
    if (updates.focusInterruptions !== undefined) telemetry.workspaceEngagement.focusInterruptions += updates.focusInterruptions;
    if (updates.keyboardWorkflowUsage !== undefined) telemetry.workspaceEngagement.keyboardWorkflowUsage += updates.keyboardWorkflowUsage;

    await telemetry.save();
  },

  // ─── Notification Interaction Tracking ─────────────────────────────────
  async trackNotificationInteraction(
    sessionId: string,
    notificationType: string,
    action: 'clicked' | 'dismissed' | 'ignored',
    timeToAction?: number
  ): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    telemetry.notificationInteractions.push({
      notificationType,
      timestamp: new Date(),
      action,
      timeToAction,
    });

    await telemetry.save();

    logger.debug('[behavioral-telemetry] Notification interaction tracked', { sessionId, notificationType, action });
  },

  // ─── Analytics Queries ─────────────────────────────────────────────────
  async getSessionTelemetry(sessionId: string): Promise<IBehavioralTelemetry | null> {
    return BehavioralTelemetry.findOne({ sessionId });
  },

  async getUserTelemetry(userId: string, limit: number = 10): Promise<IBehavioralTelemetry[]> {
    return BehavioralTelemetry
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ sessionStart: -1 })
      .limit(limit);
  },

  async getHesitationHotspots(timeRange: { start: Date; end: Date }): Promise<Array<{ element: string; count: number; avgDuration: number }>> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: timeRange.start, $lte: timeRange.end },
    });

    const hotspots = new Map<string, { count: number; totalDuration: number }>();

    telemetry.forEach(t => {
      t.hesitationPoints.forEach(h => {
        const existing = hotspots.get(h.element) || { count: 0, totalDuration: 0 };
        existing.count++;
        existing.totalDuration += h.hesitationDuration;
        hotspots.set(h.element, existing);
      });
    });

    return Array.from(hotspots.entries()).map(([element, data]) => ({
      element,
      count: data.count,
      avgDuration: data.totalDuration / data.count,
    })).sort((a, b) => b.count - a.count);
  },

  async getFrictionReport(timeRange: { start: Date; end: Date }): Promise<{
    totalFrictionEvents: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    topElements: Array<{ element: string; count: number }>;
  }> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: timeRange.start, $lte: timeRange.end },
    });

    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const byType: Record<string, number> = { confusion: 0, error: 0, slow_response: 0, repeated_action: 0 };
    const elementCounts = new Map<string, number>();

    let totalFrictionEvents = 0;

    telemetry.forEach(t => {
      t.frictionEvents.forEach(f => {
        totalFrictionEvents++;
        bySeverity[f.severity]++;
        byType[f.type]++;
        elementCounts.set(f.element, (elementCounts.get(f.element) || 0) + 1);
      });
    });

    const topElements = Array.from(elementCounts.entries())
      .map(([element, count]) => ({ element, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalFrictionEvents,
      bySeverity,
      byType,
      topElements,
    };
  },

  async getAbandonmentAnalysis(timeRange: { start: Date; end: Date }): Promise<Array<{ action: string; step: string; count: number; reasons: string[] }>> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: timeRange.start, $lte: timeRange.end },
    });

    const abandonmentMap = new Map<string, { count: number; reasons: Set<string> }>();

    telemetry.forEach(t => {
      t.abandonmentEvents.forEach(a => {
        const key = `${a.action}:${a.step}`;
        const existing = abandonmentMap.get(key) || { count: 0, reasons: new Set() };
        existing.count++;
        if (a.reason) existing.reasons.add(a.reason);
        abandonmentMap.set(key, existing);
      });
    });

    return Array.from(abandonmentMap.entries()).map(([key, data]) => {
      const [action, step] = key.split(':');
      return {
        action,
        step,
        count: data.count,
        reasons: Array.from(data.reasons),
      };
    }).sort((a, b) => b.count - a.count);
  },
};

export default behavioralTelemetry;
