// src/modules/analytics/emotionalSafetyAudit.service.ts — Emotional Safety Audit System
// Phase-I: Product Trust + Emotional Safety - Audits pressure, urgency, and emotional UX quality

import mongoose from 'mongoose';
import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';

export interface EmotionalSafetyAudit {
  overallSafetyScore: number; // 0-100
  pressureAnalysis: {
    overallPressure: number; // 0-100
    pressureSources: Array<{ source: string; severity: 'low' | 'medium' | 'high'; count: number }>;
    urgencyIndicators: number;
    guiltIndicators: number;
  };
  autonomyAnalysis: {
    autonomyScore: number; // 0-100
    userControl: number; // 0-100
    flexibility: number; // 0-100
  };
  trustAnalysis: {
    trustScore: number; // 0-100
    transparency: number; // 0-100
    predictability: number; // 0-100
  };
  riskFactors: string[];
  recommendations: string[];
}

export interface PressureEvent {
  type: 'urgency' | 'guilt' | 'fear_of_missing_out' | 'social_pressure' | 'deadline_pressure';
  source: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  context: string;
}

export const emotionalSafetyAudit = {
  // ─── Conduct Full Emotional Safety Audit ───────────────────────────────
  async conductAudit(dateRange: { start: Date; end: Date }): Promise<EmotionalSafetyAudit> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    if (!telemetry.length) {
      return {
        overallSafetyScore: 0,
        pressureAnalysis: {
          overallPressure: 0,
          pressureSources: [],
          urgencyIndicators: 0,
          guiltIndicators: 0,
        },
        autonomyAnalysis: {
          autonomyScore: 0,
          userControl: 0,
          flexibility: 0,
        },
        trustAnalysis: {
          trustScore: 0,
          transparency: 0,
          predictability: 0,
        },
        riskFactors: ['No data available for audit'],
        recommendations: ['Collect user engagement data first'],
      };
    }

    // Analyze pressure
    const pressureAnalysis = await this.analyzePressure(telemetry);

    // Analyze autonomy
    const autonomyAnalysis = await this.analyzeAutonomy(telemetry);

    // Analyze trust
    const trustAnalysis = await this.analyzeTrust(telemetry);

    // Calculate overall safety score
    const overallSafetyScore = (
      (100 - pressureAnalysis.overallPressure) * 0.4 +
      autonomyAnalysis.autonomyScore * 0.3 +
      trustAnalysis.trustScore * 0.3
    );

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(pressureAnalysis, autonomyAnalysis, trustAnalysis);

    // Generate recommendations
    const recommendations = this.generateRecommendations(overallSafetyScore, riskFactors, pressureAnalysis, autonomyAnalysis, trustAnalysis);

    return {
      overallSafetyScore,
      pressureAnalysis,
      autonomyAnalysis,
      trustAnalysis,
      riskFactors,
      recommendations,
    };
  },

  // ─── Analyze Pressure ────────────────────────────────────────────────
  async analyzePressure(telemetry: any[]): Promise<{
    overallPressure: number;
    pressureSources: Array<{ source: string; severity: 'low' | 'medium' | 'high'; count: number }>;
    urgencyIndicators: number;
    guiltIndicators: number;
  }> {
    const pressureSources = new Map<string, { low: number; medium: number; high: number }>();
    let urgencyIndicators = 0;
    let guiltIndicators = 0;

    telemetry.forEach(t => {
      // Analyze friction events as pressure indicators
      t.frictionEvents.forEach((f: any) => {
        const source = f.element;
        const existing = pressureSources.get(source) || { low: 0, medium: 0, high: 0 };
        if (f.severity === 'low') existing.low++;
        else if (f.severity === 'medium') existing.medium++;
        else if (f.severity === 'high') existing.high++;
        pressureSources.set(source, existing);

        // High friction may indicate pressure
        if (f.severity === 'high' && f.type === 'confusion') {
          urgencyIndicators++;
        }
      });

      // Analyze emotional signals for pressure
      t.emotionalSignals.forEach((s: any) => {
        if (s.signal === 'frustration') {
          urgencyIndicators++;
        }
      });

      // Analyze abandonment events
      t.abandonmentEvents.forEach((a: any) => {
        if (a.reason?.toLowerCase().includes('overwhelm') || a.reason?.toLowerCase().includes('pressure')) {
          guiltIndicators++;
        }
      });
    });

    // Calculate overall pressure
    const totalPressureEvents = Array.from(pressureSources.values())
      .reduce((sum, s) => sum + s.low + s.medium * 2 + s.high * 3, 0);
    const overallPressure = Math.min(100, totalPressureEvents / telemetry.length);

    // Format pressure sources
    const pressureSourcesArray = Array.from(pressureSources.entries())
      .map(([source, counts]) => ({
        source,
        severity: (counts.high > 0 ? 'high' : counts.medium > 0 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        count: counts.low + counts.medium + counts.high,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      overallPressure,
      pressureSources: pressureSourcesArray,
      urgencyIndicators,
      guiltIndicators,
    };
  },

  // ─── Analyze Autonomy ────────────────────────────────────────────────
  async analyzeAutonomy(telemetry: any[]): Promise<{
    autonomyScore: number;
    userControl: number;
    flexibility: number;
  }> {
    let autonomyIndicators = 0;
    let totalChecks = 0;

    // User control: ability to make choices
    let userControlIndicators = 0;
    telemetry.forEach(t => {
      totalChecks++;

      // Keyboard workflow usage indicates user control
      if (t.workspaceEngagement.keyboardWorkflowUsage > 3) {
        userControlIndicators++;
        autonomyIndicators++;
      }

      // Low interruption rate indicates user control
      if (t.workspaceEngagement.focusInterruptions < 3) {
        autonomyIndicators++;
      }
    });

    const userControl = totalChecks > 0 ? (userControlIndicators / totalChecks) * 100 : 50;

    // Flexibility: ability to adapt and recover
    let flexibilityIndicators = 0;
    telemetry.forEach(t => {
      // Successful feature interactions indicate flexibility
      const successfulInteractions = t.featureInteractions.filter((f: any) => f.completionRate > 80).length;
      if (successfulInteractions > 2) {
        flexibilityIndicators++;
      }

      // Low hesitation indicates flexibility
      const lowHesitation = t.hesitationPoints.filter((h: any) => h.hesitationDuration < 3000).length;
      if (lowHesitation > t.hesitationPoints.length / 2) {
        flexibilityIndicators++;
      }
    });

    const flexibility = telemetry.length > 0 ? (flexibilityIndicators / telemetry.length) * 100 : 50;

    const autonomyScore = (userControl * 0.5 + flexibility * 0.5);

    return {
      autonomyScore,
      userControl,
      flexibility,
    };
  },

  // ─── Analyze Trust ───────────────────────────────────────────────────
  async analyzeTrust(telemetry: any[]): Promise<{
    trustScore: number;
    transparency: number;
    predictability: number;
  }> {
    // Transparency: clear feedback and information
    let transparencyScore = 50;

    const positiveSignals = telemetry.reduce((sum, t) => {
      return sum + t.emotionalSignals.filter((s: any) => s.signal === 'satisfaction').length;
    }, 0);
    const totalSignals = telemetry.reduce((sum, t) => sum + t.emotionalSignals.length, 0);

    if (totalSignals > 0) {
      transparencyScore = (positiveSignals / totalSignals) * 100;
    }

    // Predictability: consistent behavior patterns
    let predictabilityScore = 50;

    const sessionDurations = telemetry.map(t => t.sessionDuration || 0).filter(d => d > 0);
    if (sessionDurations.length > 5) {
      const avgDuration = sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length;
      const variance = sessionDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / sessionDurations.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgDuration;

      if (coefficientOfVariation < 0.5) {
        predictabilityScore = 85;
      } else if (coefficientOfVariation < 1.0) {
        predictabilityScore = 65;
      } else {
        predictabilityScore = 45;
      }
    }

    const trustScore = (transparencyScore * 0.5 + predictabilityScore * 0.5);

    return {
      trustScore,
      transparency: transparencyScore,
      predictability: predictabilityScore,
    };
  },

  // ─── Identify Risk Factors ───────────────────────────────────────────
  identifyRiskFactors(
    pressureAnalysis: any,
    autonomyAnalysis: any,
    trustAnalysis: any
  ): string[] {
    const riskFactors: string[] = [];

    if (pressureAnalysis.overallPressure > 60) {
      riskFactors.push('High overall pressure - users may feel overwhelmed');
    }
    if (pressureAnalysis.urgencyIndicators > 10) {
      riskFactors.push('Frequent urgency indicators - time pressure too high');
    }
    if (pressureAnalysis.guiltIndicators > 5) {
      riskFactors.push('Guilt mechanics detected - may cause emotional distress');
    }

    if (autonomyAnalysis.autonomyScore < 50) {
      riskFactors.push('Low autonomy - users feel lack of control');
    }
    if (autonomyAnalysis.userControl < 50) {
      riskFactors.push('Low user control - limited agency in product');
    }
    if (autonomyAnalysis.flexibility < 50) {
      riskFactors.push('Low flexibility - rigid interaction patterns');
    }

    if (trustAnalysis.trustScore < 50) {
      riskFactors.push('Low trust score - transparency issues');
    }
    if (trustAnalysis.transparency < 50) {
      riskFactors.push('Low transparency - unclear feedback');
    }
    if (trustAnalysis.predictability < 50) {
      riskFactors.push('Low predictability - inconsistent behavior');
    }

    return riskFactors;
  },

  // ─── Generate Recommendations ────────────────────────────────────────
  generateRecommendations(
    overallSafetyScore: number,
    riskFactors: string[],
    pressureAnalysis: any,
    autonomyAnalysis: any,
    trustAnalysis: any
  ): string[] {
    const recommendations: string[] = [];

    if (overallSafetyScore < 40) {
      recommendations.push('CRITICAL: Emotional safety is severely compromised - immediate action required');
    } else if (overallSafetyScore < 60) {
      recommendations.push('Emotional safety is below target - address risk factors');
    }

    // Pressure-specific recommendations
    if (pressureAnalysis.overallPressure > 60) {
      recommendations.push('Reduce overall pressure by softening urgency language');
      recommendations.push('Implement calm, supportive copy instead of urgency-driven messaging');
    }
    if (pressureAnalysis.urgencyIndicators > 10) {
      recommendations.push('Reduce time-based urgency indicators');
      recommendations.push('Replace deadline pressure with gentle reminders');
    }
    if (pressureAnalysis.guiltIndicators > 5) {
      recommendations.push('Remove guilt mechanics entirely');
      recommendations.push('Replace guilt-based messaging with encouragement');
    }

    // Autonomy-specific recommendations
    if (autonomyAnalysis.autonomyScore < 50) {
      recommendations.push('Increase user autonomy by providing more choices');
      recommendations.push('Allow users to control their pacing and progression');
    }
    if (autonomyAnalysis.userControl < 50) {
      recommendations.push('Enhance user control with more keyboard shortcuts');
      recommendations.push('Provide clear options for user-driven actions');
    }
    if (autonomyAnalysis.flexibility < 50) {
      recommendations.push('Increase flexibility in interaction patterns');
      recommendations.push('Allow users to recover easily from mistakes');
    }

    // Trust-specific recommendations
    if (trustAnalysis.trustScore < 50) {
      recommendations.push('Improve transparency with clearer feedback');
      recommendations.push('Make behavior more predictable and consistent');
    }
    if (trustAnalysis.transparency < 50) {
      recommendations.push('Provide clearer, more immediate feedback');
      recommendations.push('Explain system behavior to users');
    }
    if (trustAnalysis.predictability < 50) {
      recommendations.push('Standardize interaction patterns');
      recommendations.push('Reduce unexpected behavior changes');
    }

    if (recommendations.length === 0) {
      recommendations.push('Emotional safety is healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Track Pressure Event ────────────────────────────────────────────
  async trackPressureEvent(sessionId: string, event: PressureEvent): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    // Track as emotional signal
    const intensity = event.severity === 'high' ? 0.8 : event.severity === 'medium' ? 0.5 : 0.3;
    telemetry.emotionalSignals.push({
      timestamp: event.timestamp,
      signal: 'frustration',
      intensity,
      context: `pressure:${event.type}:${event.source}`,
    });

    // Track as friction if severity is high
    if (event.severity === 'high') {
      telemetry.frictionEvents.push({
        element: event.source,
        type: 'confusion',
        timestamp: event.timestamp,
        severity: event.severity,
        context: { pressureEvent: event.type, originalContext: event.context },
      });
    }

    await telemetry.save();

    logger.debug('[emotional-safety] Pressure event tracked', { sessionId, type: event.type, source: event.source });
  },
};

export default emotionalSafetyAudit;
