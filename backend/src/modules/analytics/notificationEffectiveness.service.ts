// src/modules/analytics/notificationEffectiveness.service.ts — Notification Effectiveness Optimization
// Phase-I: Notification Effectiveness Optimization - Tracks usefulness, interruption cost, and fatigue

import mongoose from 'mongoose';
import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';

export interface NotificationEffectivenessMetrics {
  notificationType: string;
  totalSent: number;
  totalClicked: number;
  totalDismissed: number;
  totalIgnored: number;
  clickRate: number;
  dismissalRate: number;
  ignoreRate: number;
  averageTimeToAction: number;
  interruptionCost: number; // 0-100
  usefulnessScore: number; // 0-100
  fatigueScore: number; // 0-100
  recommendations: string[];
}

export interface NotificationFatigueAnalysis {
  overallFatigueLevel: 'low' | 'medium' | 'high' | 'severe';
  fatigueByType: Array<{ type: string; fatigueScore: number; status: string }>;
  optimalFrequency: Map<string, number>; // notifications per day
  overNotifiedTypes: string[];
  underNotifiedTypes: string[];
  recommendations: string[];
}

export const notificationEffectiveness = {
  // ─── Calculate Notification Effectiveness Metrics ───────────────────────
  async calculateEffectivenessMetrics(
    notificationType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<NotificationEffectivenessMetrics> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    let totalSent = 0;
    let totalClicked = 0;
    let totalDismissed = 0;
    let totalIgnored = 0;
    let timeToActionSum = 0;
    let timeToActionCount = 0;

    telemetry.forEach(t => {
      t.notificationInteractions.forEach((n: any) => {
        if (n.notificationType === notificationType) {
          totalSent++;
          if (n.action === 'clicked') {
            totalClicked++;
            if (n.timeToAction) {
              timeToActionSum += n.timeToAction;
              timeToActionCount++;
            }
          } else if (n.action === 'dismissed') {
            totalDismissed++;
          } else {
            totalIgnored++;
          }
        }
      });
    });

    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const dismissalRate = totalSent > 0 ? (totalDismissed / totalSent) * 100 : 0;
    const ignoreRate = totalSent > 0 ? (totalIgnored / totalSent) * 100 : 0;
    const averageTimeToAction = timeToActionCount > 0 ? timeToActionSum / timeToActionCount : 0;

    // Calculate interruption cost (based on dismissal and ignore rates)
    const interruptionCost = (dismissalRate * 0.6 + ignoreRate * 0.4);

    // Calculate usefulness score (based on click rate and time to action)
    const usefulnessScore = clickRate > 0 ? (clickRate * 0.7 + (100 - Math.min(100, averageTimeToAction / 10000)) * 0.3) : 0;

    // Calculate fatigue score (based on recent trends)
    const fatigueScore = await this.calculateFatigueScore(notificationType, telemetry);

    // Generate recommendations
    const recommendations = this.generateNotificationRecommendations(
      notificationType,
      clickRate,
      dismissalRate,
      ignoreRate,
      interruptionCost,
      usefulnessScore,
      fatigueScore
    );

    return {
      notificationType,
      totalSent,
      totalClicked,
      totalDismissed,
      totalIgnored,
      clickRate,
      dismissalRate,
      ignoreRate,
      averageTimeToAction,
      interruptionCost,
      usefulnessScore,
      fatigueScore,
      recommendations,
    };
  },

  // ─── Calculate Fatigue Score ─────────────────────────────────────────
  async calculateFatigueScore(notificationType: string, telemetry: any[]): Promise<number> {
    // Analyze trend over time
    const recentTelemetry = telemetry.slice(-10); // Last 10 sessions
    const olderTelemetry = telemetry.slice(0, -10); // Earlier sessions

    let recentClickRate = 0;
    let olderClickRate = 0;

    recentTelemetry.forEach(t => {
      const interactions = t.notificationInteractions.filter((n: any) => n.notificationType === notificationType);
      if (interactions.length > 0) {
        const clicked = interactions.filter((n: any) => n.action === 'clicked').length;
        recentClickRate += (clicked / interactions.length) * 100;
      }
    });

    olderTelemetry.forEach(t => {
      const interactions = t.notificationInteractions.filter((n: any) => n.notificationType === notificationType);
      if (interactions.length > 0) {
        const clicked = interactions.filter((n: any) => n.action === 'clicked').length;
        olderClickRate += (clicked / interactions.length) * 100;
      }
    });

    recentClickRate = recentTelemetry.length > 0 ? recentClickRate / recentTelemetry.length : 0;
    olderClickRate = olderTelemetry.length > 0 ? olderClickRate / olderTelemetry.length : 0;

    // Fatigue score increases if click rate is declining
    const decline = olderClickRate - recentClickRate;
    const fatigueScore = Math.min(100, Math.max(0, decline * 2));

    return fatigueScore;
  },

  // ─── Generate Notification Recommendations ────────────────────────────
  generateNotificationRecommendations(
    notificationType: string,
    clickRate: number,
    dismissalRate: number,
    ignoreRate: number,
    interruptionCost: number,
    usefulnessScore: number,
    fatigueScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (usefulnessScore < 30) {
      recommendations.push(`CRITICAL: "${notificationType}" notifications have very low usefulness - consider removing or completely redesigning`);
    } else if (usefulnessScore < 50) {
      recommendations.push(`"${notificationType}" notifications have low usefulness - improve relevance or timing`);
    }

    if (interruptionCost > 60) {
      recommendations.push(`"${notificationType}" notifications have high interruption cost - reduce frequency or make less intrusive`);
    }

    if (fatigueScore > 60) {
      recommendations.push(`"${notificationType}" notifications are causing fatigue - reduce frequency immediately`);
    } else if (fatigueScore > 40) {
      recommendations.push(`"${notificationType}" notifications may be causing fatigue - monitor closely`);
    }

    if (dismissalRate > 50) {
      recommendations.push(`"${notificationType}" notifications are frequently dismissed - users may find them irrelevant`);
    }

    if (ignoreRate > 50) {
      recommendations.push(`"${notificationType}" notifications are frequently ignored - consider making them more actionable`);
    }

    if (recommendations.length === 0) {
      recommendations.push(`"${notificationType}" notifications are performing well - continue current strategy`);
    }

    return recommendations;
  },

  // ─── Conduct Fatigue Analysis ───────────────────────────────────────────
  async conductFatigueAnalysis(dateRange: { start: Date; end: Date }): Promise<NotificationFatigueAnalysis> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Get all notification types
    const notificationTypes = new Set<string>();
    telemetry.forEach(t => {
      t.notificationInteractions.forEach((n: any) => {
        notificationTypes.add(n.notificationType);
      });
    });

    const fatigueByType: Array<{ type: string; fatigueScore: number; status: string }> = [];

    for (const type of notificationTypes) {
      const fatigueScore = await this.calculateFatigueScore(type, telemetry);
      let status: string;
      if (fatigueScore > 70) status = 'severe';
      else if (fatigueScore > 50) status = 'high';
      else if (fatigueScore > 30) status = 'medium';
      else status = 'low';

      fatigueByType.push({ type, fatigueScore, status });
    }

    // Calculate overall fatigue level
    const avgFatigue = fatigueByType.reduce((sum, f) => sum + f.fatigueScore, 0) / fatigueByType.length;
    let overallFatigueLevel: 'low' | 'medium' | 'high' | 'severe';
    if (avgFatigue > 70) overallFatigueLevel = 'severe';
    else if (avgFatigue > 50) overallFatigueLevel = 'high';
    else if (avgFatigue > 30) overallFatigueLevel = 'medium';
    else overallFatigueLevel = 'low';

    // Calculate optimal frequency (simplified)
    const optimalFrequency = new Map<string, number>();
    fatigueByType.forEach(f => {
      if (f.fatigueScore > 50) {
        optimalFrequency.set(f.type, 1); // Once per day
      } else if (f.fatigueScore > 30) {
        optimalFrequency.set(f.type, 3); // 3 times per day
      } else {
        optimalFrequency.set(f.type, 5); // 5 times per day
      }
    });

    // Identify over-notified and under-notified types
    const overNotifiedTypes = fatigueByType.filter(f => f.fatigueScore > 50).map(f => f.type);
    const underNotifiedTypes = fatigueByType.filter(f => f.fatigueScore < 20).map(f => f.type);

    // Generate recommendations
    const recommendations = this.generateFatigueRecommendations(overallFatigueLevel, fatigueByType, overNotifiedTypes, underNotifiedTypes);

    return {
      overallFatigueLevel,
      fatigueByType,
      optimalFrequency,
      overNotifiedTypes,
      underNotifiedTypes,
      recommendations,
    };
  },

  // ─── Generate Fatigue Recommendations ─────────────────────────────────
  generateFatigueRecommendations(
    overallFatigueLevel: 'low' | 'medium' | 'high' | 'severe',
    fatigueByType: Array<{ type: string; fatigueScore: number; status: string }>,
    overNotifiedTypes: string[],
    underNotifiedTypes: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (overallFatigueLevel === 'severe') {
      recommendations.push('CRITICAL: Overall notification fatigue is severe - immediately reduce all notification frequency');
    } else if (overallFatigueLevel === 'high') {
      recommendations.push('Overall notification fatigue is high - reduce frequency for problematic types');
    } else if (overallFatigueLevel === 'medium') {
      recommendations.push('Monitor notification fatigue - some types may need adjustment');
    }

    overNotifiedTypes.forEach(type => {
      recommendations.push(`Reduce frequency for "${type}" notifications - users are experiencing fatigue`);
    });

    underNotifiedTypes.forEach(type => {
      recommendations.push(`"${type}" notifications may be underutilized - consider increasing frequency or improving visibility`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Notification fatigue is at healthy levels - continue current strategy');
    }

    return recommendations;
  },

  // ─── Track Notification Interaction ───────────────────────────────────
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

    logger.debug('[notification-effectiveness] Interaction tracked', { sessionId, notificationType, action });
  },
};

export default notificationEffectiveness;
