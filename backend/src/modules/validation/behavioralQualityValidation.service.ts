// src/modules/validation/behavioralQualityValidation.service.ts — Behavioral Quality Validation Service
// Phase-J: Behavioral Quality Validation - Engagement quality scoring and trust-preservation metrics

import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';

export interface EngagementQualityMetrics {
  userId: string;
  engagementQualityScore: number; // 0-100
  sustainabilityScore: number; // 0-100
  trustPreservationScore: number; // 0-100
  emotionalSafetyScore: number; // 0-100
  overallQuality: number; // 0-100
  riskFactors: string[];
  recommendations: string[];
}

export interface QualityValidationReport {
  totalUsers: number;
  averageEngagementQuality: number;
  averageSustainability: number;
  averageTrustPreservation: number;
  highQualityUsers: number;
  atRiskUsers: number;
  burnoutRiskUsers: number;
  recommendations: string[];
}

export const behavioralQualityValidation = {
  // ─── Calculate Engagement Quality Score ───────────────────────────────────────
  async calculateEngagementQuality(userId: string, dateRange: { start: Date; end: Date }): Promise<EngagementQualityMetrics> {
    const telemetry = await BehavioralTelemetry.find({
      userId,
      timestamp: { $gte: dateRange.start, $lte: dateRange.end },
    });

    if (telemetry.length === 0) {
      return {
        userId,
        engagementQualityScore: 0,
        sustainabilityScore: 0,
        trustPreservationScore: 0,
        emotionalSafetyScore: 0,
        overallQuality: 0,
        riskFactors: ['No telemetry data available'],
        recommendations: ['Start collecting behavioral telemetry'],
      };
    }

    // Calculate engagement quality (focus, consistency, meaningful interaction)
    const engagementQualityScore = this.calculateEngagementQualityScore(telemetry);

    // Calculate sustainability (avoiding burnout, healthy patterns)
    const sustainabilityScore = this.calculateSustainabilityScore(telemetry);

    // Calculate trust preservation (autonomy, transparency, respect)
    const trustPreservationScore = this.calculateTrustPreservationScore(telemetry);

    // Calculate emotional safety (low pressure, supportive environment)
    const emotionalSafetyScore = this.calculateEmotionalSafetyScore(telemetry);

    // Calculate overall quality
    const overallQuality = (engagementQualityScore * 0.3 + sustainabilityScore * 0.3 + trustPreservationScore * 0.2 + emotionalSafetyScore * 0.2);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(
      engagementQualityScore,
      sustainabilityScore,
      trustPreservationScore,
      emotionalSafetyScore,
      telemetry
    );

    // Generate recommendations
    const recommendations = this.generateQualityRecommendations(
      engagementQualityScore,
      sustainabilityScore,
      trustPreservationScore,
      emotionalSafetyScore,
      riskFactors
    );

    return {
      userId,
      engagementQualityScore,
      sustainabilityScore,
      trustPreservationScore,
      emotionalSafetyScore,
      overallQuality,
      riskFactors,
      recommendations,
    };
  },

  // ─── Calculate Engagement Quality Score ───────────────────────────────────
  calculateEngagementQualityScore(telemetry: any[]): number {
    let score = 100;

    // Penalize short sessions (indicates lack of meaningful engagement)
    const shortSessions = telemetry.filter(t => t.sessionDuration < 30000).length;
    score -= (shortSessions / telemetry.length) * 20;

    // Reward consistent engagement
    const activeDays = new Set(telemetry.map(t => t.timestamp.toDateString())).size;
    score += Math.min(20, activeDays * 2);

    // Reward meaningful interactions (not just passive viewing)
    const meaningfulInteractions = telemetry.reduce((sum, t) => sum + (t.interactionCount || 0), 0);
    score += Math.min(15, meaningfulInteractions / telemetry.length * 5);

    // Penalize high abandonment rates
    const abandonmentRate = telemetry.filter(t => t.abandonmentEvents > 0).length / telemetry.length;
    score -= abandonmentRate * 30;

    return Math.max(0, Math.min(100, score));
  },

  // ─── Calculate Sustainability Score ───────────────────────────────────────────
  calculateSustainabilityScore(telemetry: any[]): number {
    let score = 100;

    // Penalize excessive session duration (potential burnout)
    const longSessions = telemetry.filter(t => t.sessionDuration > 7200000).length; // > 2 hours
    score -= (longSessions / telemetry.length) * 25;

    // Penalize late-night sessions (unhealthy patterns)
    const lateNightSessions = telemetry.filter(t => {
      const hour = t.timestamp.getHours();
      return hour >= 0 && hour < 5;
    }).length;
    score -= (lateNightSessions / telemetry.length) * 15;

    // Reward consistent but moderate usage patterns
    const dailyAverage = telemetry.length / 7; // Assuming 7-day window
    if (dailyAverage >= 1 && dailyAverage <= 3) {
      score += 10;
    }

    // Penalize back-to-back sessions (no breaks)
    const backToBackCount = this.countBackToBackSessions(telemetry);
    score -= backToBackCount * 5;

    return Math.max(0, Math.min(100, score));
  },

  // ─── Count Back-to-Back Sessions ───────────────────────────────────────────────
  countBackToBackSessions(telemetry: any[]): number {
    let count = 0;
    const sortedTelemetry = [...telemetry].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 1; i < sortedTelemetry.length; i++) {
      const gap = sortedTelemetry[i].timestamp.getTime() - sortedTelemetry[i - 1].timestamp.getTime();
      if (gap < 3600000) { // Less than 1 hour between sessions
        count++;
      }
    }

    return count;
  },

  // ─── Calculate Trust Preservation Score ───────────────────────────────────────
  calculateTrustPreservationScore(telemetry: any[]): number {
    let score = 100;

    // Penalize high friction (indicates broken trust)
    const highFriction = telemetry.filter(t => t.frictionScore > 50).length;
    score -= (highFriction / telemetry.length) * 30;

    // Penalize ignored features (indicates lack of value alignment)
    const ignoredFeatures = telemetry.reduce((sum, t) => sum + (t.ignoredFeatures || 0), 0);
    score -= Math.min(20, ignoredFeatures / telemetry.length * 5);

    // Reward voluntary engagement (not coerced)
    const voluntarySessions = telemetry.filter(t => !t.forcedSession).length;
    score += (voluntarySessions / telemetry.length) * 15;

    // Penalize notification fatigue
    const notificationDismissals = telemetry.reduce((sum, t) => sum + (t.notificationDismissals || 0), 0);
    score -= Math.min(15, notificationDismissals / telemetry.length * 3);

    return Math.max(0, Math.min(100, score));
  },

  // ─── Calculate Emotional Safety Score ─────────────────────────────────────────
  calculateEmotionalSafetyScore(telemetry: any[]): number {
    let score = 100;

    // Penalize high pressure signals
    const highPressure = telemetry.filter(t => t.pressureSignals > 3).length;
    score -= (highPressure / telemetry.length) * 25;

    // Penalize negative emotional signals
    const negativeEmotions = telemetry.filter(t => t.emotionalSignal === 'negative').length;
    score -= (negativeEmotions / telemetry.length) * 30;

    // Reward positive emotional signals
    const positiveEmotions = telemetry.filter(t => t.emotionalSignal === 'positive').length;
    score += (positiveEmotions / telemetry.length) * 15;

    // Penalize hesitation (indicates uncertainty/anxiety)
    const hesitationCount = telemetry.reduce((sum, t) => sum + (t.hesitationEvents || 0), 0);
    score -= Math.min(20, hesitationCount / telemetry.length * 5);

    return Math.max(0, Math.min(100, score));
  },

  // ─── Identify Risk Factors ────────────────────────────────────────────────────
  identifyRiskFactors(
    engagementQuality: number,
    sustainability: number,
    trustPreservation: number,
    emotionalSafety: number,
    telemetry: any[]
  ): string[] {
    const riskFactors: string[] = [];

    if (engagementQuality < 50) {
      riskFactors.push('Low engagement quality - user may not find value');
    }

    if (sustainability < 50) {
      riskFactors.push('Poor sustainability - burnout risk');
    }

    if (trustPreservation < 50) {
      riskFactors.push('Low trust preservation - user may feel manipulated');
    }

    if (emotionalSafety < 50) {
      riskFactors.push('Poor emotional safety - user may feel pressured');
    }

    // Check for specific patterns
    const abandonmentRate = telemetry.filter(t => t.abandonmentEvents > 0).length / telemetry.length;
    if (abandonmentRate > 0.5) {
      riskFactors.push('High abandonment rate - UX friction');
    }

    const lateNightSessions = telemetry.filter(t => {
      const hour = t.timestamp.getHours();
      return hour >= 0 && hour < 5;
    }).length;
    if (lateNightSessions / telemetry.length > 0.3) {
      riskFactors.push('Unhealthy usage patterns - late-night sessions');
    }

    return riskFactors;
  },

  // ─── Generate Quality Recommendations ────────────────────────────────────────
  generateQualityRecommendations(
    engagementQuality: number,
    sustainability: number,
    trustPreservation: number,
    emotionalSafety: number,
    riskFactors: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (engagementQuality < 60) {
      recommendations.push('Improve engagement quality - focus on meaningful interactions and reduce friction');
    }

    if (sustainability < 60) {
      recommendations.push('Address sustainability concerns - encourage healthy usage patterns and breaks');
    }

    if (trustPreservation < 60) {
      recommendations.push('Restore trust - reduce pressure, increase transparency, and respect user autonomy');
    }

    if (emotionalSafety < 60) {
      recommendations.push('Improve emotional safety - reduce pressure-heavy language and design');
    }

    riskFactors.forEach(factor => {
      recommendations.push(`Address: ${factor}`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Behavioral quality is healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Generate Quality Validation Report ───────────────────────────────────────
  async generateQualityValidationReport(dateRange: { start: Date; end: Date }): Promise<QualityValidationReport> {
    const allTelemetry = await BehavioralTelemetry.find({
      timestamp: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const uniqueUsers = new Set(allTelemetry.map(t => t.userId));
    const totalUsers = uniqueUsers.size;

    let totalEngagementQuality = 0;
    let totalSustainability = 0;
    let totalTrustPreservation = 0;
    let highQualityCount = 0;
    let atRiskCount = 0;
    let burnoutRiskCount = 0;

    for (const userId of uniqueUsers) {
      const userTelemetry = allTelemetry.filter(t => t.userId === userId);
      const engagementQuality = this.calculateEngagementQualityScore(userTelemetry);
      const sustainability = this.calculateSustainabilityScore(userTelemetry);
      const trustPreservation = this.calculateTrustPreservationScore(userTelemetry);

      totalEngagementQuality += engagementQuality;
      totalSustainability += sustainability;
      totalTrustPreservation += trustPreservation;

      const overallQuality = engagementQuality * 0.3 + sustainability * 0.3 + trustPreservation * 0.4;

      if (overallQuality >= 70) {
        highQualityCount++;
      } else if (overallQuality >= 50) {
        atRiskCount++;
      } else {
        burnoutRiskCount++;
      }
    }

    const averageEngagementQuality = totalUsers > 0 ? totalEngagementQuality / totalUsers : 0;
    const averageSustainability = totalUsers > 0 ? totalSustainability / totalUsers : 0;
    const averageTrustPreservation = totalUsers > 0 ? totalTrustPreservation / totalUsers : 0;

    const recommendations = this.generateReportRecommendations(
      averageEngagementQuality,
      averageSustainability,
      averageTrustPreservation,
      highQualityCount,
      atRiskCount,
      burnoutRiskCount,
      totalUsers
    );

    return {
      totalUsers,
      averageEngagementQuality,
      averageSustainability,
      averageTrustPreservation,
      highQualityUsers: highQualityCount,
      atRiskUsers: atRiskCount,
      burnoutRiskUsers: burnoutRiskCount,
      recommendations,
    };
  },

  // ─── Generate Report Recommendations ───────────────────────────────────────────
  generateReportRecommendations(
    avgEngagement: number,
    avgSustainability: number,
    avgTrust: number,
    highQuality: number,
    atRisk: number,
    burnoutRisk: number,
    totalUsers: number
  ): string[] {
    const recommendations: string[] = [];

    if (avgEngagement < 60) {
      recommendations.push('Overall engagement quality is concerning - review product value proposition');
    }

    if (avgSustainability < 60) {
      recommendations.push('Sustainability metrics are low - implement healthy usage patterns');
    }

    if (avgTrust < 60) {
      recommendations.push('Trust preservation is low - review pressure-heavy features and language');
    }

    if (burnoutRisk / totalUsers > 0.2) {
      recommendations.push('CRITICAL: High burnout risk detected - immediate intervention needed');
    }

    if (atRisk / totalUsers > 0.3) {
      recommendations.push('High percentage of at-risk users - proactive outreach recommended');
    }

    if (recommendations.length === 0) {
      recommendations.push('Behavioral quality is healthy across the user base');
    }

    return recommendations;
  },
};

export default behavioralQualityValidation;
