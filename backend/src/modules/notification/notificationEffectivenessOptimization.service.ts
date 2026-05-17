// src/modules/notification/notificationEffectivenessOptimization.service.ts — Notification Effectiveness Optimization Service
// Phase-J: Notification Effectiveness Optimization - Dismissal rate tracking and interruption cost analysis

import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';

export interface NotificationEffectivenessMetrics {
  notificationType: string;
  totalSent: number;
  totalOpened: number;
  totalDismissed: number;
  dismissalRate: number;
  openRate: number;
  averageTimeToAction: number;
  interruptionCost: number;
  fatigueScore: number; // 0-100
  recommendations: string[];
}

export interface NotificationAnalysisReport {
  totalNotifications: number;
  averageDismissalRate: number;
  averageOpenRate: number;
  averageInterruptionCost: number;
  highFatigueTypes: string[];
  lowValueTypes: string[];
  recommendations: string[];
}

export const notificationEffectivenessOptimization = {
  // ─── Calculate Notification Effectiveness ───────────────────────────────────────
  async calculateNotificationEffectiveness(
    notificationType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<NotificationEffectivenessMetrics> {
    // Use friction events as proxy for notification interactions
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
      'frictionEvents.context.notificationType': notificationType,
    });

    const totalSent = telemetry.length;
    const totalOpened = telemetry.filter(t => 
      t.frictionEvents.some(f => f.context?.action === 'opened' && f.context?.notificationType === notificationType)
    ).length;
    const totalDismissed = telemetry.filter(t => 
      t.frictionEvents.some(f => f.context?.action === 'dismissed' && f.context?.notificationType === notificationType)
    ).length;

    const dismissalRate = totalSent > 0 ? (totalDismissed / totalSent) * 100 : 0;
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    // Calculate average time to action from friction events
    const actionEvents: number[] = [];
    telemetry.forEach(t => {
      t.frictionEvents.forEach(f => {
        if (f.context?.action === 'opened' && f.context?.notificationType === notificationType && f.context?.timeToAction) {
          actionEvents.push(f.context.timeToAction as number);
        }
      });
    });
    const averageTimeToAction = actionEvents.length > 0
      ? actionEvents.reduce((sum, t) => sum + t, 0) / actionEvents.length
      : 0;

    // Calculate interruption cost
    const interruptionCost = this.calculateInterruptionCost(telemetry);

    // Calculate fatigue score
    const fatigueScore = this.calculateFatigueScore(telemetry);

    // Generate recommendations
    const recommendations = this.generateNotificationRecommendations(
      dismissalRate,
      openRate,
      interruptionCost,
      fatigueScore
    );

    return {
      notificationType,
      totalSent,
      totalOpened,
      totalDismissed,
      dismissalRate,
      openRate,
      averageTimeToAction,
      interruptionCost,
      fatigueScore,
      recommendations,
    };
  },

  // ─── Calculate Interruption Cost ───────────────────────────────────────────────
  calculateInterruptionCost(telemetry: any[]): number {
    let totalCost = 0;

    telemetry.forEach(t => {
      // Cost from session interruption (high severity friction)
      const highSeverityFriction = t.frictionEvents.filter((f: any) => f.severity === 'high').length;
      totalCost += highSeverityFriction * 20;

      // Cost from abandonment events
      totalCost += t.abandonmentEvents.length * 15;

      // Cost from hesitation (indicates interruption)
      const totalHesitation = t.hesitationPoints.reduce((sum: number, h: any) => sum + h.hesitationDuration, 0);
      if (totalHesitation > 10000) {
        totalCost += 10;
      }
    });

    // Normalize to 0-100
    const maxPossibleCost = telemetry.length * 45;
    return maxPossibleCost > 0 ? Math.min(100, (totalCost / maxPossibleCost) * 100) : 0;
  },

  // ─── Calculate Fatigue Score ───────────────────────────────────────────────────
  calculateFatigueScore(telemetry: any[]): number {
    let score = 0;

    // Group by user to check for repeated dismissals via friction events
    const userDismissals = new Map<string, number>();
    telemetry.forEach(t => {
      const dismissals = t.frictionEvents.filter((f: any) => f.context?.action === 'dismissed').length;
      if (dismissals > 0) {
        userDismissals.set(t.userId.toString(), (userDismissals.get(t.userId.toString()) || 0) + dismissals);
      }
    });

    // High dismissal rate per user indicates fatigue
    userDismissals.forEach((dismissals) => {
      if (dismissals > 5) {
        score += 30;
      } else if (dismissals > 3) {
        score += 15;
      }
    });

    // High friction rate indicates fatigue
    const highFrictionRate = telemetry.filter(t => t.frictionEvents.length > 5).length / telemetry.length;
    score += highFrictionRate * 20;

    // Abandonment indicates fatigue
    const abandonmentRate = telemetry.filter(t => t.abandonmentEvents.length > 0).length / telemetry.length;
    score += abandonmentRate * 15;

    return Math.min(100, score);
  },

  // ─── Generate Notification Recommendations ───────────────────────────────────────
  generateNotificationRecommendations(
    dismissalRate: number,
    openRate: number,
    interruptionCost: number,
    fatigueScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (dismissalRate > 60) {
      recommendations.push('High dismissal rate - notification is not valuable to users');
    }

    if (openRate < 30) {
      recommendations.push('Low open rate - improve timing, relevance, or content');
    }

    if (interruptionCost > 50) {
      recommendations.push('High interruption cost - reconsider if notification is necessary');
    }

    if (fatigueScore > 60) {
      recommendations.push('High fatigue detected - reduce frequency or pause this notification type');
    }

    if (dismissalRate > 40 && openRate < 40) {
      recommendations.push('Consider removing this notification type - low value and high friction');
    }

    if (recommendations.length === 0) {
      recommendations.push('Notification effectiveness is acceptable - continue monitoring');
    }

    return recommendations;
  },

  // ─── Generate Notification Analysis Report ─────────────────────────────────────
  async generateNotificationAnalysisReport(dateRange: { start: Date; end: Date }): Promise<NotificationAnalysisReport> {
    const allTelemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
      'frictionEvents.context.notificationType': { $exists: true },
    });

    const totalNotifications = allTelemetry.length;

    // Group by notification type from friction events context
    const typeGroups = new Map<string, any[]>();
    allTelemetry.forEach(t => {
      t.frictionEvents.forEach((f: any) => {
        const type = f.context?.notificationType || 'unknown';
        if (!typeGroups.has(type)) {
          typeGroups.set(type, []);
        }
        typeGroups.get(type)!.push(t);
      });
    });

    let totalDismissals = 0;
    let totalOpens = 0;
    let totalInterruptionCost = 0;
    const typeMetrics = new Map<string, { dismissalRate: number; fatigueScore: number }>();

    for (const [type, telemetry] of typeGroups) {
      const dismissed = telemetry.filter(t => 
        t.frictionEvents.some((f: any) => f.context?.action === 'dismissed' && f.context?.notificationType === type)
      ).length;
      const opened = telemetry.filter(t => 
        t.frictionEvents.some((f: any) => f.context?.action === 'opened' && f.context?.notificationType === type)
      ).length;

      totalDismissals += dismissed;
      totalOpens += opened;

      const dismissalRate = telemetry.length > 0 ? (dismissed / telemetry.length) * 100 : 0;
      const fatigueScore = this.calculateFatigueScore(telemetry);
      const interruptionCost = this.calculateInterruptionCost(telemetry);

      totalInterruptionCost += interruptionCost;

      typeMetrics.set(type, { dismissalRate, fatigueScore });
    }

    const averageDismissalRate = totalNotifications > 0 ? (totalDismissals / totalNotifications) * 100 : 0;
    const averageOpenRate = totalNotifications > 0 ? (totalOpens / totalNotifications) * 100 : 0;
    const averageInterruptionCost = typeGroups.size > 0 ? totalInterruptionCost / typeGroups.size : 0;

    // Identify high fatigue types
    const highFatigueTypes = Array.from(typeMetrics.entries())
      .filter(([_, metrics]) => metrics.fatigueScore > 60)
      .map(([type, _]) => type);

    // Identify low value types (high dismissal, low fatigue)
    const lowValueTypes = Array.from(typeMetrics.entries())
      .filter(([_, metrics]) => metrics.dismissalRate > 50 && metrics.fatigueScore < 40)
      .map(([type, _]) => type);

    // Generate recommendations
    const recommendations = this.generateAnalysisRecommendations(
      averageDismissalRate,
      averageOpenRate,
      averageInterruptionCost,
      highFatigueTypes,
      lowValueTypes
    );

    return {
      totalNotifications,
      averageDismissalRate,
      averageOpenRate,
      averageInterruptionCost,
      highFatigueTypes,
      lowValueTypes,
      recommendations,
    };
  },

  // ─── Generate Analysis Recommendations ───────────────────────────────────────────
  generateAnalysisRecommendations(
    avgDismissalRate: number,
    avgOpenRate: number,
    avgInterruptionCost: number,
    highFatigueTypes: string[],
    lowValueTypes: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (avgDismissalRate > 50) {
      recommendations.push('High overall dismissal rate - review notification strategy');
    }

    if (avgOpenRate < 40) {
      recommendations.push('Low overall open rate - improve notification relevance and timing');
    }

    if (avgInterruptionCost > 50) {
      recommendations.push('High interruption cost - reduce notification frequency');
    }

    highFatigueTypes.forEach(type => {
      recommendations.push(`Reduce frequency of ${type} - high fatigue detected`);
    });

    lowValueTypes.forEach(type => {
      recommendations.push(`Consider removing ${type} - low value and high dismissal`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Notification effectiveness is healthy across all types');
    }

    return recommendations;
  },
};

export default notificationEffectivenessOptimization;
