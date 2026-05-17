// src/modules/validation/emotionalTrustRefinement.service.ts — Emotional Trust Refinement Service
// Phase-J: Emotional Trust Refinement - Pressure analysis and autonomy preservation tracking

import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';

export interface PressureAnalysis {
  userId: string;
  pressureScore: number; // 0-100, higher = more pressure
  pressureSources: Array<{ source: string; severity: 'low' | 'medium' | 'high'; count: number }>;
  autonomyScore: number; // 0-100, higher = more autonomy
  trustScore: number; // 0-100, higher = more trust
  recommendations: string[];
}

export interface TrustAuditReport {
  totalUsers: number;
  averagePressureScore: number;
  averageAutonomyScore: number;
  averageTrustScore: number;
  highPressureUsers: number;
  lowAutonomyUsers: number;
  lowTrustUsers: number;
  commonPressureSources: Array<{ source: string; count: number }>;
  recommendations: string[];
}

export const emotionalTrustRefinement = {
  // ─── Analyze Pressure ────────────────────────────────────────────────────────
  async analyzePressure(userId: string, dateRange: { start: Date; end: Date }): Promise<PressureAnalysis> {
    const telemetry = await BehavioralTelemetry.find({
      userId,
      timestamp: { $gte: dateRange.start, $lte: dateRange.end },
    });

    if (telemetry.length === 0) {
      return {
        userId,
        pressureScore: 0,
        pressureSources: [],
        autonomyScore: 0,
        trustScore: 0,
        recommendations: ['No telemetry data available'],
      };
    }

    // Calculate pressure score
    const pressureScore = this.calculatePressureScore(telemetry);

    // Identify pressure sources
    const pressureSources = this.identifyPressureSources(telemetry);

    // Calculate autonomy score
    const autonomyScore = this.calculateAutonomyScore(telemetry);

    // Calculate trust score
    const trustScore = this.calculateTrustScore(telemetry);

    // Generate recommendations
    const recommendations = this.generatePressureRecommendations(
      pressureScore,
      autonomyScore,
      trustScore,
      pressureSources
    );

    return {
      userId,
      pressureScore,
      pressureSources,
      autonomyScore,
      trustScore,
      recommendations,
    };
  },

  // ─── Calculate Pressure Score ───────────────────────────────────────────────
  calculatePressureScore(telemetry: any[]): number {
    let score = 0;

    telemetry.forEach(t => {
      // Pressure from urgency language
      if (t.urgencySignals > 0) {
        score += t.urgencySignals * 5;
      }

      // Pressure from time pressure
      if (t.timePressureSignals > 0) {
        score += t.timePressureSignals * 3;
      }

      // Pressure from guilt mechanics
      if (t.guiltSignals > 0) {
        score += t.guiltSignals * 8;
      }

      // Pressure from social comparison
      if (t.socialComparisonSignals > 0) {
        score += t.socialComparisonSignals * 4;
      }

      // Pressure from streak anxiety
      if (t.streakAnxietySignals > 0) {
        score += t.streakAnxietySignals * 6;
      }
    });

    // Normalize to 0-100
    const maxPossibleScore = telemetry.length * 26;
    return Math.min(100, (score / maxPossibleScore) * 100);
  },

  // ─── Identify Pressure Sources ───────────────────────────────────────────────
  identifyPressureSources(telemetry: any[]): Array<{ source: string; severity: 'low' | 'medium' | 'high'; count: number }> {
    const sources = new Map<string, { count: number; totalSeverity: number }>();

    telemetry.forEach(t => {
      if (t.urgencySignals > 0) {
        const existing = sources.get('urgency_language') || { count: 0, totalSeverity: 0 };
        existing.count += t.urgencySignals;
        existing.totalSeverity += t.urgencySignals * 5;
        sources.set('urgency_language', existing);
      }

      if (t.timePressureSignals > 0) {
        const existing = sources.get('time_pressure') || { count: 0, totalSeverity: 0 };
        existing.count += t.timePressureSignals;
        existing.totalSeverity += t.timePressureSignals * 3;
        sources.set('time_pressure', existing);
      }

      if (t.guiltSignals > 0) {
        const existing = sources.get('guilt_mechanics') || { count: 0, totalSeverity: 0 };
        existing.count += t.guiltSignals;
        existing.totalSeverity += t.guiltSignals * 8;
        sources.set('guilt_mechanics', existing);
      }

      if (t.streakAnxietySignals > 0) {
        const existing = sources.get('streak_anxiety') || { count: 0, totalSeverity: 0 };
        existing.count += t.streakAnxietySignals;
        existing.totalSeverity += t.streakAnxietySignals * 6;
        sources.set('streak_anxiety', existing);
      }
    });

    return Array.from(sources.entries()).map(([source, data]) => {
      const avgSeverity = data.totalSeverity / data.count;
      let severity: 'low' | 'medium' | 'high';
      if (avgSeverity > 6) severity = 'high';
      else if (avgSeverity > 3) severity = 'medium';
      else severity = 'low';

      return { source, severity, count: data.count };
    }).sort((a, b) => b.count - a.count);
  },

  // ─── Calculate Autonomy Score ───────────────────────────────────────────────
  calculateAutonomyScore(telemetry: any[]): number {
    let score = 100;

    telemetry.forEach(t => {
      // Penalize forced sessions
      if (t.forcedSession) {
        score -= 15;
      }

      // Penalize lack of choice
      if (t.lackOfChoiceSignals > 0) {
        score -= t.lackOfChoiceSignals * 5;
      }

      // Reward voluntary engagement
      if (t.voluntaryEngagement) {
        score += 5;
      }

      // Reward self-paced progress
      if (t.selfPacedProgress) {
        score += 8;
      }
    });

    // Normalize to 0-100
    return Math.max(0, Math.min(100, score));
  },

  // ─── Calculate Trust Score ───────────────────────────────────────────────────
  calculateTrustScore(telemetry: any[]): number {
    let score = 100;

    telemetry.forEach(t => {
      // Penalize broken promises
      if (t.brokenPromiseSignals > 0) {
        score -= t.brokenPromiseSignals * 10;
      }

      // Penalize hidden costs
      if (t.hiddenCostSignals > 0) {
        score -= t.hiddenCostSignals * 8;
      }

      // Reward transparency
      if (t.transparencySignals > 0) {
        score += t.transparencySignals * 3;
      }

      // Reward consistency
      if (t.consistencySignals > 0) {
        score += t.consistencySignals * 4;
      }
    });

    // Normalize to 0-100
    return Math.max(0, Math.min(100, score));
  },

  // ─── Generate Pressure Recommendations ────────────────────────────────────────
  generatePressureRecommendations(
    pressureScore: number,
    autonomyScore: number,
    trustScore: number,
    pressureSources: Array<{ source: string; severity: 'low' | 'medium' | 'high'; count: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (pressureScore > 70) {
      recommendations.push('CRITICAL: High pressure detected - remove urgency language and time pressure');
    } else if (pressureScore > 50) {
      recommendations.push('Moderate pressure detected - review language and design for pressure signals');
    }

    if (autonomyScore < 60) {
      recommendations.push('Low autonomy - increase user choice and reduce forced interactions');
    }

    if (trustScore < 60) {
      recommendations.push('Low trust - improve transparency and consistency');
    }

    pressureSources.slice(0, 3).forEach(({ source, severity }) => {
      if (severity === 'high') {
        recommendations.push(`Address high-severity pressure from ${source} - immediate action needed`);
      } else if (severity === 'medium') {
        recommendations.push(`Reduce medium-severity pressure from ${source}`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Pressure levels are healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Conduct Trust Audit ─────────────────────────────────────────────────────
  async conductTrustAudit(dateRange: { start: Date; end: Date }): Promise<TrustAuditReport> {
    const allTelemetry = await BehavioralTelemetry.find({
      timestamp: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const uniqueUsers = new Set(allTelemetry.map(t => t.userId));
    const totalUsers = uniqueUsers.size;

    let totalPressureScore = 0;
    let totalAutonomyScore = 0;
    let totalTrustScore = 0;
    let highPressureCount = 0;
    let lowAutonomyCount = 0;
    let lowTrustCount = 0;

    const allPressureSources = new Map<string, number>();

    for (const userId of uniqueUsers) {
      const userTelemetry = allTelemetry.filter(t => t.userId === userId);
      const pressureScore = this.calculatePressureScore(userTelemetry);
      const autonomyScore = this.calculateAutonomyScore(userTelemetry);
      const trustScore = this.calculateTrustScore(userTelemetry);

      totalPressureScore += pressureScore;
      totalAutonomyScore += autonomyScore;
      totalTrustScore += trustScore;

      if (pressureScore > 70) highPressureCount++;
      if (autonomyScore < 50) lowAutonomyCount++;
      if (trustScore < 50) lowTrustCount++;

      // Aggregate pressure sources
      const sources = this.identifyPressureSources(userTelemetry);
      sources.forEach(s => {
        allPressureSources.set(s.source, (allPressureSources.get(s.source) || 0) + s.count);
      });
    }

    const averagePressureScore = totalUsers > 0 ? totalPressureScore / totalUsers : 0;
    const averageAutonomyScore = totalUsers > 0 ? totalAutonomyScore / totalUsers : 0;
    const averageTrustScore = totalUsers > 0 ? totalTrustScore / totalUsers : 0;

    const commonPressureSources = Array.from(allPressureSources.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recommendations = this.generateAuditRecommendations(
      averagePressureScore,
      averageAutonomyScore,
      averageTrustScore,
      highPressureCount,
      lowAutonomyCount,
      lowTrustCount,
      totalUsers,
      commonPressureSources
    );

    return {
      totalUsers,
      averagePressureScore,
      averageAutonomyScore,
      averageTrustScore,
      highPressureUsers: highPressureCount,
      lowAutonomyUsers: lowAutonomyCount,
      lowTrustUsers: lowTrustCount,
      commonPressureSources,
      recommendations,
    };
  },

  // ─── Generate Audit Recommendations ─────────────────────────────────────────
  generateAuditRecommendations(
    avgPressure: number,
    avgAutonomy: number,
    avgTrust: number,
    highPressure: number,
    lowAutonomy: number,
    lowTrust: number,
    totalUsers: number,
    pressureSources: Array<{ source: string; count: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (avgPressure > 60) {
      recommendations.push('High average pressure across user base - product-wide pressure reduction needed');
    }

    if (avgAutonomy < 60) {
      recommendations.push('Low average autonomy - increase user choice and control');
    }

    if (avgTrust < 60) {
      recommendations.push('Low average trust - improve transparency and consistency');
    }

    if (highPressure / totalUsers > 0.3) {
      recommendations.push('CRITICAL: 30%+ users experiencing high pressure - immediate intervention needed');
    }

    if (lowAutonomy / totalUsers > 0.3) {
      recommendations.push('High percentage of users with low autonomy - review forced interactions');
    }

    if (lowTrust / totalUsers > 0.3) {
      recommendations.push('High percentage of users with low trust - review transparency and consistency');
    }

    pressureSources.slice(0, 3).forEach(({ source }) => {
      recommendations.push(`Address common pressure source: ${source}`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Emotional trust metrics are healthy across the user base');
    }

    return recommendations;
  },
};

export default emotionalTrustRefinement;
