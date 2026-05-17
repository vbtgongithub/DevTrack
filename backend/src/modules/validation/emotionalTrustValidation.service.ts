// src/modules/validation/emotionalTrustValidation.service.ts — Emotional Trust Validation Service
// Phase-K: Emotional Trust Validation - Pressure perception, motivation quality, interruption stress, notification trust, progression anxiety, recovery confidence, emotional safety

import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';

export interface EmotionalTrustMetrics {
  pressurePerception: number; // 0-100, higher = more pressure perceived
  motivationQuality: number; // 0-100, higher = healthier motivation
  interruptionStress: number; // 0-100, higher = more stress
  notificationTrust: number; // 0-100, higher = more trusted
  progressionAnxiety: number; // 0-100, higher = more anxiety
  recoveryConfidence: number; // 0-100, higher = more confident in recovery
  emotionalSafety: number; // 0-100, higher = safer
  recommendations: string[];
}

export const emotionalTrustValidation = {
  // ─── Get Emotional Trust Metrics ───────────────────────────────────────────────
  async getEmotionalTrustMetrics(userId: string, dateRange: { start: Date; end: Date }): Promise<EmotionalTrustMetrics> {
    const telemetry = await BehavioralTelemetry.find({
      userId,
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    if (telemetry.length === 0) {
      return {
        pressurePerception: 50,
        motivationQuality: 50,
        interruptionStress: 50,
        notificationTrust: 50,
        progressionAnxiety: 50,
        recoveryConfidence: 50,
        emotionalSafety: 50,
        recommendations: ['No telemetry data available'],
      };
    }

    const pressurePerception = this.calculatePressurePerception(telemetry);
    const motivationQuality = this.calculateMotivationQuality(telemetry);
    const interruptionStress = this.calculateInterruptionStress(telemetry);
    const notificationTrust = this.calculateNotificationTrust(telemetry);
    const progressionAnxiety = this.calculateProgressionAnxiety(telemetry);
    const recoveryConfidence = this.calculateRecoveryConfidence(telemetry);
    const emotionalSafety = this.calculateEmotionalSafety(telemetry);

    const recommendations = this.generateTrustRecommendations(
      pressurePerception,
      motivationQuality,
      interruptionStress,
      notificationTrust,
      progressionAnxiety,
      recoveryConfidence,
      emotionalSafety
    );

    return {
      pressurePerception,
      motivationQuality,
      interruptionStress,
      notificationTrust,
      progressionAnxiety,
      recoveryConfidence,
      emotionalSafety,
      recommendations,
    };
  },

  // ─── Calculate Pressure Perception ───────────────────────────────────────────
  calculatePressurePerception(telemetry: any[]): number {
    let pressureScore = 0;

    telemetry.forEach(t => {
      // High severity friction indicates pressure
      const highSeverityFriction = t.frictionEvents.filter((f: any) => f.severity === 'high').length;
      pressureScore += highSeverityFriction * 10;

      // Abandonment events indicate pressure
      pressureScore += t.abandonmentEvents.length * 15;

      // Long sessions without breaks can indicate pressure
      if (t.sessionDuration && t.sessionDuration > 7200000) { // > 2 hours
        pressureScore += 20;
      }
    });

    // Normalize to 0-100
    const maxPossibleScore = telemetry.length * 45;
    return maxPossibleScore > 0 ? Math.min(100, (pressureScore / maxPossibleScore) * 100) : 50;
  },

  // ─── Calculate Motivation Quality ───────────────────────────────────────────────
  calculateMotivationQuality(telemetry: any[]): number {
    let qualityScore = 100;

    telemetry.forEach(t => {
      // Reward voluntary engagement
      if (t.activeTime > 0 && t.sessionDuration) {
        const engagementRatio = t.activeTime / t.sessionDuration;
        if (engagementRatio > 0.7) {
          qualityScore += 10;
        }
      }

      // Reward consistent sessions
      if (t.sessionDuration && t.sessionDuration > 1800000 && t.sessionDuration < 3600000) { // 30-60 minutes
        qualityScore += 5;
      }

      // Penalize forced behavior (high abandonment)
      if (t.abandonmentEvents.length > 2) {
        qualityScore -= 15;
      }
    });

    // Normalize to 0-100
    return Math.max(0, Math.min(100, qualityScore / telemetry.length));
  },

  // ─── Calculate Interruption Stress ─────────────────────────────────────────────
  calculateInterruptionStress(telemetry: any[]): number {
    let stressScore = 0;

    telemetry.forEach(t => {
      // Hesitation events indicate stress
      const hesitationCount = t.frictionEvents.filter((f: any) => f.type === 'hesitation').length;
      stressScore += hesitationCount * 8;

      // Confusion events indicate stress
      const confusionCount = t.frictionEvents.filter((f: any) => f.type === 'confusion').length;
      stressScore += confusionCount * 10;

      // Error events indicate stress
      const errorCount = t.frictionEvents.filter((f: any) => f.type === 'error').length;
      stressScore += errorCount * 12;
    });

    // Normalize to 0-100
    const maxPossibleScore = telemetry.length * 30;
    return maxPossibleScore > 0 ? Math.min(100, (stressScore / maxPossibleScore) * 100) : 50;
  },

  // ─── Calculate Notification Trust ─────────────────────────────────────────────
  calculateNotificationTrust(telemetry: any[]): number {
    let trustScore = 100;

    telemetry.forEach(t => {
      // Check for notification-related friction events
      const notificationDismissals = t.frictionEvents.filter((f: any) => 
        f.context?.action === 'dismissed' && f.context?.notificationType
      ).length;

      if (notificationDismissals > 3) {
        trustScore -= 20;
      } else if (notificationDismissals > 1) {
        trustScore -= 10;
      }

      // Check for notification-related confusion
      const notificationConfusion = t.frictionEvents.filter((f: any) => 
        f.type === 'confusion' && f.context?.notificationType
      ).length;

      if (notificationConfusion > 0) {
        trustScore -= notificationConfusion * 10;
      }
    });

    // Normalize to 0-100
    return Math.max(0, Math.min(100, trustScore / telemetry.length));
  },

  // ─── Calculate Progression Anxiety ───────────────────────────────────────────
  calculateProgressionAnxiety(telemetry: any[]): number {
    let anxietyScore = 0;

    telemetry.forEach(t => {
      // Check for progression-related hesitation
      const progressionHesitation = t.frictionEvents.filter((f: any) => 
        f.type === 'hesitation' && (f.element.includes('streak') || f.element.includes('xp') || f.element.includes('level'))
      ).length;

      anxietyScore += progressionHesitation * 15;

      // Check for progression-related abandonment
      const progressionAbandonment = t.abandonmentEvents.filter((a: any) => 
        a.action.includes('streak') || a.action.includes('xp') || a.action.includes('level')
      ).length;

      anxietyScore += progressionAbandonment * 20;
    });

    // Normalize to 0-100
    const maxPossibleScore = telemetry.length * 35;
    return maxPossibleScore > 0 ? Math.min(100, (anxietyScore / maxPossibleScore) * 100) : 50;
  },

  // ─── Calculate Recovery Confidence ─────────────────────────────────────────────
  calculateRecoveryConfidence(telemetry: any[]): number {
    let confidenceScore = 100;

    telemetry.forEach(t => {
      // Reward return visits (indicates confidence in recovery)
      if (t.sessionStart) {
        const daysSinceLastSession = telemetry.length > 1 ? 7 : 0; // Placeholder
        if (daysSinceLastSession < 3) {
          confidenceScore += 10;
        }
      }

      // Penalize streak anxiety
      const streakAnxiety = t.frictionEvents.filter((f: any) => 
        f.type === 'hesitation' && f.element.includes('streak')
      ).length;

      if (streakAnxiety > 2) {
        confidenceScore -= 20;
      }
    });

    // Normalize to 0-100
    return Math.max(0, Math.min(100, confidenceScore / telemetry.length));
  },

  // ─── Calculate Emotional Safety ───────────────────────────────────────────────
  calculateEmotionalSafety(telemetry: any[]): number {
    let safetyScore = 100;

    telemetry.forEach(t => {
      // Penalize high friction
      const highFriction = t.frictionEvents.filter((f: any) => f.severity === 'high').length;
      safetyScore -= highFriction * 15;

      // Penalize abandonment
      safetyScore -= t.abandonmentEvents.length * 10;

      // Reward healthy session patterns
      if (t.sessionDuration && t.sessionDuration > 900000 && t.sessionDuration < 5400000) { // 15-90 minutes
        safetyScore += 10;
      }
    });

    // Normalize to 0-100
    return Math.max(0, Math.min(100, safetyScore / telemetry.length));
  },

  // ─── Generate Trust Recommendations ──────────────────────────────────────────────
  generateTrustRecommendations(
    pressurePerception: number,
    motivationQuality: number,
    interruptionStress: number,
    notificationTrust: number,
    progressionAnxiety: number,
    recoveryConfidence: number,
    emotionalSafety: number
  ): string[] {
    const recommendations: string[] = [];

    if (pressurePerception > 60) {
      recommendations.push('High pressure perception - reduce urgency language and time pressure');
    }

    if (motivationQuality < 60) {
      recommendations.push('Low motivation quality - focus on intrinsic motivation and reduce external pressure');
    }

    if (interruptionStress > 60) {
      recommendations.push('High interruption stress - reduce notification frequency and improve timing');
    }

    if (notificationTrust < 60) {
      recommendations.push('Low notification trust - review notification strategy and content');
    }

    if (progressionAnxiety > 50) {
      recommendations.push('Progression anxiety detected - soften progression mechanics and reduce pressure');
    }

    if (recoveryConfidence < 50) {
      recommendations.push('Low recovery confidence - improve comeback messaging and normalize breaks');
    }

    if (emotionalSafety < 60) {
      recommendations.push('Low emotional safety - review UX for pressure-heavy patterns');
    }

    if (recommendations.length === 0) {
      recommendations.push('Emotional trust is healthy - continue monitoring');
    }

    return recommendations;
  },
};

export default emotionalTrustValidation;
