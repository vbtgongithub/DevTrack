// src/modules/notification/notificationQualityOptimization.service.ts — Notification Quality Optimization Service
// Phase-K: Notification Quality Optimization - Dismissal rates, open rates, interruption cost, comeback effectiveness, fatigue signals, focus disruption, emotional response

import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';

export interface NotificationQualityMetrics {
  notificationType: string;
  dismissalRate: number;
  openRate: number;
  interruptionCost: number;
  comebackEffectiveness: number;
  fatigueSignals: number;
  focusDisruption: number;
  emotionalResponse: 'positive' | 'neutral' | 'negative';
  recommendations: string[];
}

export const notificationQualityOptimization = {
  // ─── Calculate Notification Quality Metrics ───────────────────────────────────────
  async calculateNotificationQualityMetrics(
    notificationType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<NotificationQualityMetrics> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
      'frictionEvents.context.notificationType': notificationType,
    });

    const totalSent = telemetry.length;
    const totalOpened = telemetry.filter(t => 
      t.frictionEvents.some((f: any) => f.context?.action === 'opened' && f.context?.notificationType === notificationType)
    ).length;
    const totalDismissed = telemetry.filter(t => 
      t.frictionEvents.some((f: any) => f.context?.action === 'dismissed' && f.context?.notificationType === notificationType)
    ).length;

    const dismissalRate = totalSent > 0 ? (totalDismissed / totalSent) * 100 : 0;
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    const interruptionCost = this.calculateInterruptionCost(telemetry);
    const comebackEffectiveness = this.calculateComebackEffectiveness(telemetry);
    const fatigueSignals = this.calculateFatigueSignals(telemetry);
    const focusDisruption = this.calculateFocusDisruption(telemetry);
    const emotionalResponse = this.determineEmotionalResponse(telemetry);

    const recommendations = this.generateQualityRecommendations(
      dismissalRate,
      openRate,
      interruptionCost,
      comebackEffectiveness,
      fatigueSignals,
      focusDisruption,
      emotionalResponse
    );

    return {
      notificationType,
      dismissalRate,
      openRate,
      interruptionCost,
      comebackEffectiveness,
      fatigueSignals,
      focusDisruption,
      emotionalResponse,
      recommendations,
    };
  },

  // ─── Calculate Interruption Cost ───────────────────────────────────────────────
  calculateInterruptionCost(telemetry: any[]): number {
    let totalCost = 0;

    telemetry.forEach(t => {
      // High severity friction indicates high interruption cost
      const highSeverityFriction = t.frictionEvents.filter((f: any) => f.severity === 'high').length;
      totalCost += highSeverityFriction * 20;

      // Abandonment events indicate interruption cost
      totalCost += t.abandonmentEvents.length * 15;

      // Hesitation indicates interruption cost
      const hesitationCount = t.frictionEvents.filter((f: any) => f.type === 'hesitation').length;
      totalCost += hesitationCount * 10;
    });

    // Normalize to 0-100
    const maxPossibleCost = telemetry.length * 45;
    return maxPossibleCost > 0 ? Math.min(100, (totalCost / maxPossibleCost) * 100) : 0;
  },

  // ─── Calculate Comeback Effectiveness ─────────────────────────────────────────────
  calculateComebackEffectiveness(telemetry: any[]): number {
    // In a real implementation, this would track return visits after notifications
    // For now, return a placeholder based on open rate
    const openedCount = telemetry.filter(t => 
      t.frictionEvents.some((f: any) => f.context?.action === 'opened')
    ).length;

    return telemetry.length > 0 ? (openedCount / telemetry.length) * 100 : 0;
  },

  // ─── Calculate Fatigue Signals ───────────────────────────────────────────────
  calculateFatigueSignals(telemetry: any[]): number {
    let fatigueScore = 0;

    telemetry.forEach(t => {
      // Rapid dismissal indicates fatigue
      const rapidDismissals = t.frictionEvents.filter((f: any) => 
        f.context?.action === 'dismissed' && f.context?.timeToAction && f.context.timeToAction < 5000
      ).length;
      fatigueScore += rapidDismissals * 15;

      // High friction indicates fatigue
      const highFriction = t.frictionEvents.filter((f: any) => f.severity === 'high').length;
      fatigueScore += highFriction * 10;
    });

    // Normalize to 0-100
    const maxPossibleScore = telemetry.length * 25;
    return maxPossibleScore > 0 ? Math.min(100, (fatigueScore / maxPossibleScore) * 100) : 0;
  },

  // ─── Calculate Focus Disruption ───────────────────────────────────────────────
  calculateFocusDisruption(telemetry: any[]): number {
    let disruptionScore = 0;

    telemetry.forEach(t => {
      // Hesitation events indicate focus disruption
      const hesitationCount = t.frictionEvents.filter((f: any) => f.type === 'hesitation').length;
      disruptionScore += hesitationCount * 12;

      // Confusion events indicate focus disruption
      const confusionCount = t.frictionEvents.filter((f: any) => f.type === 'confusion').length;
      disruptionScore += confusionCount * 15;
    });

    // Normalize to 0-100
    const maxPossibleScore = telemetry.length * 27;
    return maxPossibleScore > 0 ? Math.min(100, (disruptionScore / maxPossibleScore) * 100) : 0;
  },

  // ─── Determine Emotional Response ─────────────────────────────────────────────
  determineEmotionalResponse(telemetry: any[]): 'positive' | 'neutral' | 'negative' {
    let positiveSignals = 0;
    let negativeSignals = 0;

    telemetry.forEach(t => {
      // Positive signals: quick action, no friction
      const quickActions = t.frictionEvents.filter((f: any) => 
        f.context?.action === 'opened' && f.context?.timeToAction && f.context.timeToAction < 10000
      ).length;
      positiveSignals += quickActions;

      // Negative signals: dismissal, high friction
      const dismissals = t.frictionEvents.filter((f: any) => f.context?.action === 'dismissed').length;
      negativeSignals += dismissals;

      const highFriction = t.frictionEvents.filter((f: any) => f.severity === 'high').length;
      negativeSignals += highFriction;
    });

    if (positiveSignals > negativeSignals * 2) {
      return 'positive';
    } else if (negativeSignals > positiveSignals * 2) {
      return 'negative';
    }
    return 'neutral';
  },

  // ─── Generate Quality Recommendations ──────────────────────────────────────────────
  generateQualityRecommendations(
    dismissalRate: number,
    openRate: number,
    interruptionCost: number,
    comebackEffectiveness: number,
    fatigueSignals: number,
    focusDisruption: number,
    emotionalResponse: 'positive' | 'neutral' | 'negative'
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

    if (comebackEffectiveness < 30) {
      recommendations.push('Low comeback effectiveness - notification not driving desired behavior');
    }

    if (fatigueSignals > 50) {
      recommendations.push('High fatigue signals - reduce frequency or pause this notification type');
    }

    if (focusDisruption > 50) {
      recommendations.push('High focus disruption - notification is disrupting user flow');
    }

    if (emotionalResponse === 'negative') {
      recommendations.push('Negative emotional response - review notification content and tone');
    }

    if (recommendations.length === 0) {
      recommendations.push('Notification quality is acceptable - continue monitoring');
    }

    return recommendations;
  },
};

export default notificationQualityOptimization;
