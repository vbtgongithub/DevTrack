// src/modules/analytics/behavioralQualityAnalytics.service.ts — Behavioral Quality Analytics
// Phase-I: Behavioral Quality Analytics - Measures engagement quality, sustainability, and trust

import mongoose from 'mongoose';
import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { UserAnalytics } from '../../db/models/userAnalytics.model.js';
import { logger } from '../../shared/logger.js';

export interface EngagementQualityScore {
  userId: string;
  qualityScore: number; // 0-100
  healthScore: number; // 0-100
  sustainabilityScore: number; // 0-100
  trustScore: number; // 0-100
  components: {
    consistency: number;
    satisfaction: number;
    balance: number;
    autonomy: number;
  };
  riskFactors: string[];
  recommendations: string[];
}

export interface SustainabilityMetrics {
  userId: string;
  sustainableEngagement: boolean;
  fatigueRisk: 'low' | 'medium' | 'high';
  burnoutRisk: 'low' | 'medium' | 'high';
  sessionSustainability: number; // 0-100
  comebackSuccess: number; // 0-100
  longTermRetention: number; // 0-100
  healthyEngagementIndicators: string[];
  unhealthyEngagementIndicators: string[];
}

export interface TrustIndicators {
  userId: string;
  trustScore: number; // 0-100
  emotionalSafety: number; // 0-100
  autonomyPreservation: number; // 0-100
  pressureFree: number; // 0-100
  transparency: number; // 0-100
  trustFactors: Array<{ factor: string; positive: boolean; impact: number }>;
  trustRisks: string[];
}

export const behavioralQualityAnalytics = {
  // ─── Calculate Engagement Quality Score ───────────────────────────────
  async calculateEngagementQualityScore(userId: string): Promise<EngagementQualityScore> {
    const telemetry = await BehavioralTelemetry.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ sessionStart: -1 })
      .limit(30);

    const userAnalytics = await UserAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!telemetry.length) {
      return {
        userId,
        qualityScore: 0,
        healthScore: 0,
        sustainabilityScore: 0,
        trustScore: 0,
        components: { consistency: 0, satisfaction: 0, balance: 0, autonomy: 0 },
        riskFactors: ['No engagement data available'],
        recommendations: ['Encourage initial engagement'],
      };
    }

    // Calculate consistency (regular, balanced engagement)
    const consistency = this.calculateConsistency(telemetry, userAnalytics);

    // Calculate satisfaction (positive emotional signals)
    const satisfaction = this.calculateSatisfaction(telemetry);

    // Calculate balance (not compulsive, healthy pacing)
    const balance = this.calculateBalance(telemetry);

    // Calculate autonomy (user-driven, not pressure-driven)
    const autonomy = this.calculateAutonomy(telemetry);

    // Composite scores
    const qualityScore = (consistency * 0.3 + satisfaction * 0.3 + balance * 0.2 + autonomy * 0.2);
    const healthScore = (satisfaction * 0.4 + balance * 0.4 + autonomy * 0.2);
    const sustainabilityScore = (consistency * 0.4 + balance * 0.4 + autonomy * 0.2);
    const trustScore = (autonomy * 0.4 + satisfaction * 0.3 + balance * 0.3);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(telemetry, consistency, satisfaction, balance, autonomy);

    // Generate recommendations
    const recommendations = this.generateQualityRecommendations(qualityScore, riskFactors);

    return {
      userId,
      qualityScore,
      healthScore,
      sustainabilityScore,
      trustScore,
      components: { consistency, satisfaction, balance, autonomy },
      riskFactors,
      recommendations,
    };
  },

  // ─── Calculate Consistency ────────────────────────────────────────────
  calculateConsistency(telemetry: any[], userAnalytics: any): number {
    if (!userAnalytics) return 50;

    const weeklyConsistency = userAnalytics.weeklyConsistencyScore || 0;
    const streak = userAnalytics.currentStreak || 0;

    // Normalize streak (max impact at 30 days)
    const streakScore = Math.min(100, (streak / 30) * 100);

    return (weeklyConsistency * 0.7 + streakScore * 0.3);
  },

  // ─── Calculate Satisfaction ───────────────────────────────────────────
  calculateSatisfaction(telemetry: any[]): number {
    let satisfactionScore = 50; // Base score

    let positiveSignals = 0;
    let negativeSignals = 0;

    telemetry.forEach(t => {
      t.emotionalSignals.forEach((s: any) => {
        if (s.signal === 'satisfaction' || s.signal === 'engagement') {
          positiveSignals += s.intensity;
        } else if (s.signal === 'frustration' || s.signal === 'confusion') {
          negativeSignals += s.intensity;
        }
      });
    });

    const totalSignals = positiveSignals + negativeSignals;
    if (totalSignals > 0) {
      satisfactionScore = (positiveSignals / totalSignals) * 100;
    }

    return satisfactionScore;
  },

  // ─── Calculate Balance ───────────────────────────────────────────────
  calculateBalance(telemetry: any[]): number {
    let balanceScore = 50;

    const sessionDurations = telemetry.map(t => t.sessionDuration || 0).filter(d => d > 0);
    if (sessionDurations.length === 0) return 50;

    const avgDuration = sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length;

    // Ideal session duration: 15-60 minutes
    if (avgDuration >= 900000 && avgDuration <= 3600000) { // 15-60 minutes
      balanceScore = 90;
    } else if (avgDuration >= 600000 && avgDuration <= 5400000) { // 10-90 minutes
      balanceScore = 75;
    } else if (avgDuration < 600000) { // Too short
      balanceScore = 40;
    } else if (avgDuration > 5400000) { // Too long (potential compulsive use)
      balanceScore = 30;
    }

    return balanceScore;
  },

  // ─── Calculate Autonomy ─────────────────────────────────────────────
  calculateAutonomy(telemetry: any[]): number {
    let autonomyScore = 50;

    // Check for pressure-driven behavior
    let pressureIndicators = 0;
    let autonomyIndicators = 0;

    telemetry.forEach(t => {
      // High friction or frustration indicates lack of autonomy
      const highFriction = t.frictionEvents.filter((f: any) => f.severity === 'high').length;
      if (highFriction > 0) pressureIndicators += highFriction;

      // Keyboard workflow usage indicates autonomy
      if (t.workspaceEngagement.keyboardWorkflowUsage > 5) {
        autonomyIndicators += 1;
      }

      // Low interruption rate indicates autonomy
      if (t.workspaceEngagement.focusInterruptions < 3) {
        autonomyIndicators += 1;
      }
    });

    const totalIndicators = pressureIndicators + autonomyIndicators;
    if (totalIndicators > 0) {
      autonomyScore = (autonomyIndicators / totalIndicators) * 100;
    }

    return autonomyScore;
  },

  // ─── Identify Risk Factors ───────────────────────────────────────────
  identifyRiskFactors(
    telemetry: any[],
    consistency: number,
    satisfaction: number,
    balance: number,
    autonomy: number
  ): string[] {
    const riskFactors: string[] = [];

    if (consistency < 40) riskFactors.push('Low engagement consistency - user may churn');
    if (satisfaction < 40) riskFactors.push('Low satisfaction - user experience issues');
    if (balance < 40) riskFactors.push('Unhealthy engagement patterns');
    if (autonomy < 40) riskFactors.push('Low autonomy - pressure-driven behavior');

    // Check for specific patterns
    const avgSessionDuration = telemetry.reduce((sum, t) => sum + (t.sessionDuration || 0), 0) / telemetry.length;
    if (avgSessionDuration > 7200000) { // More than 2 hours
      riskFactors.push('Very long sessions - potential compulsive use');
    }

    const avgFriction = telemetry.reduce((sum, t) => sum + t.frictionEvents.length, 0) / telemetry.length;
    if (avgFriction > 5) {
      riskFactors.push('High friction - UX issues');
    }

    return riskFactors;
  },

  // ─── Generate Quality Recommendations ───────────────────────────────
  generateQualityRecommendations(qualityScore: number, riskFactors: string[]): string[] {
    const recommendations: string[] = [];

    if (qualityScore < 40) {
      recommendations.push('URGENT: Engagement quality is critically low - immediate intervention needed');
    } else if (qualityScore < 60) {
      recommendations.push('Engagement quality is below target - investigate risk factors');
    }

    riskFactors.forEach(factor => {
      if (factor.includes('consistency')) {
        recommendations.push('Implement retention strategies to improve consistency');
      }
      if (factor.includes('satisfaction')) {
        recommendations.push('Address UX issues causing low satisfaction');
      }
      if (factor.includes('balance')) {
        recommendations.push('Encourage healthier engagement patterns');
      }
      if (factor.includes('autonomy')) {
        recommendations.push('Reduce pressure and increase user autonomy');
      }
      if (factor.includes('compulsive')) {
        recommendations.push('Implement healthy usage reminders');
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Engagement quality is healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Calculate Sustainability Metrics ─────────────────────────────────
  async calculateSustainabilityMetrics(userId: string): Promise<SustainabilityMetrics> {
    const telemetry = await BehavioralTelemetry.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ sessionStart: -1 })
      .limit(30);

    const userAnalytics = await UserAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    // Calculate session sustainability
    const sessionSustainability = this.calculateSessionSustainability(telemetry);

    // Calculate fatigue risk
    const fatigueRisk = this.calculateFatigueRisk(telemetry);

    // Calculate burnout risk
    const burnoutRisk = this.calculateBurnoutRisk(telemetry, userAnalytics);

    // Calculate comeback success
    const comebackSuccess = this.calculateComebackSuccess(telemetry);

    // Calculate long-term retention
    const longTermRetention = this.calculateLongTermRetention(userAnalytics);

    // Determine sustainable engagement
    const sustainableEngagement = sessionSustainability > 60 && fatigueRisk !== 'high' && burnoutRisk !== 'high';

    // Identify indicators
    const healthyIndicators = this.identifyHealthyIndicators(telemetry, userAnalytics);
    const unhealthyIndicators = this.identifyUnhealthyIndicators(telemetry, userAnalytics);

    return {
      userId,
      sustainableEngagement,
      fatigueRisk,
      burnoutRisk,
      sessionSustainability,
      comebackSuccess,
      longTermRetention,
      healthyEngagementIndicators: healthyIndicators,
      unhealthyEngagementIndicators: unhealthyIndicators,
    };
  },

  // ─── Calculate Session Sustainability ─────────────────────────────────
  calculateSessionSustainability(telemetry: any[]): number {
    if (!telemetry.length) return 0;

    const sessionDurations = telemetry.map(t => t.sessionDuration || 0).filter(d => d > 0);
    if (!sessionDurations.length) return 0;

    const avgDuration = sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length;

    // Ideal: 15-45 minutes
    if (avgDuration >= 900000 && avgDuration <= 2700000) {
      return 90;
    } else if (avgDuration >= 600000 && avgDuration <= 3600000) {
      return 75;
    } else if (avgDuration < 600000 || avgDuration > 7200000) {
      return 30;
    }
    return 50;
  },

  // ─── Calculate Fatigue Risk ─────────────────────────────────────────
  calculateFatigueRisk(telemetry: any[]): 'low' | 'medium' | 'high' {
    if (!telemetry.length) return 'low';

    const fatigueSignals = telemetry.reduce((sum, t) => {
      return sum + t.emotionalSignals.filter((s: any) => s.signal === 'fatigue').length;
    }, 0);

    const avgFatigue = fatigueSignals / telemetry.length;

    if (avgFatigue > 2) return 'high';
    if (avgFatigue > 0.5) return 'medium';
    return 'low';
  },

  // ─── Calculate Burnout Risk ─────────────────────────────────────────
  calculateBurnoutRisk(telemetry: any[], userAnalytics: any): 'low' | 'medium' | 'high' {
    if (!userAnalytics) return 'low';

    const streak = userAnalytics.currentStreak || 0;
    const weeklyConsistency = userAnalytics.weeklyConsistencyScore || 0;

    // Very long streaks with high consistency may indicate burnout risk
    if (streak > 60 && weeklyConsistency > 90) {
      return 'high';
    }
    if (streak > 30 && weeklyConsistency > 80) {
      return 'medium';
    }

    return 'low';
  },

  // ─── Calculate Comeback Success ─────────────────────────────────────
  calculateComebackSuccess(telemetry: any[]): number {
    if (!telemetry.length) return 0;

    // Look for return patterns after gaps
    let successfulComebacks = 0;
    let totalComebacks = 0;

    for (let i = 1; i < telemetry.length; i++) {
      const currentSession = telemetry[i];
      const previousSession = telemetry[i - 1];
      const gap = currentSession.sessionStart.getTime() - previousSession.sessionStart.getTime();

      // Gap of more than 3 days
      if (gap > 259200000) {
        totalComebacks++;
        // If they had at least 3 more sessions after returning
        if (i + 3 < telemetry.length) {
          successfulComebacks++;
        }
      }
    }

    return totalComebacks > 0 ? (successfulComebacks / totalComebacks) * 100 : 50;
  },

  // ─── Calculate Long-Term Retention ───────────────────────────────────
  calculateLongTermRetention(userAnalytics: any): number {
    if (!userAnalytics) return 0;

    const weeklyHistory = userAnalytics.weeklyXPHistory || [];
    if (weeklyHistory.length < 4) return 50;

    // Check if they've been active in recent weeks
    const recentWeeks = weeklyHistory.slice(-4);
    const activeWeeks = recentWeeks.filter((w: any) => w.xp > 0).length;

    return (activeWeeks / 4) * 100;
  },

  // ─── Identify Healthy Indicators ────────────────────────────────────
  identifyHealthyIndicators(telemetry: any[], userAnalytics: any): string[] {
    const indicators: string[] = [];

    if (userAnalytics?.weeklyConsistencyScore > 70) {
      indicators.push('Consistent weekly engagement');
    }
    if (userAnalytics?.currentStreak > 7 && userAnalytics?.currentStreak < 30) {
      indicators.push('Healthy streak duration');
    }

    const avgDuration = telemetry.reduce((sum, t) => sum + (t.sessionDuration || 0), 0) / telemetry.length;
    if (avgDuration >= 900000 && avgDuration <= 3600000) {
      indicators.push('Balanced session duration');
    }

    const positiveSignals = telemetry.reduce((sum, t) => {
      return sum + t.emotionalSignals.filter((s: any) => s.signal === 'satisfaction' || s.signal === 'engagement').length;
    }, 0);
    if (positiveSignals > telemetry.length) {
      indicators.push('Positive emotional signals');
    }

    return indicators;
  },

  // ─── Identify Unhealthy Indicators ──────────────────────────────────
  identifyUnhealthyIndicators(telemetry: any[], userAnalytics: any): string[] {
    const indicators: string[] = [];

    if (userAnalytics?.currentStreak > 60) {
      indicators.push('Very long streak - potential burnout risk');
    }

    const avgDuration = telemetry.reduce((sum, t) => sum + (t.sessionDuration || 0), 0) / telemetry.length;
    if (avgDuration > 7200000) {
      indicators.push('Very long sessions - potential compulsive use');
    }

    const fatigueSignals = telemetry.reduce((sum, t) => {
      return sum + t.emotionalSignals.filter((s: any) => s.signal === 'fatigue').length;
    }, 0);
    if (fatigueSignals > telemetry.length * 2) {
      indicators.push('Frequent fatigue signals');
    }

    const highFriction = telemetry.reduce((sum, t) => {
      return sum + t.frictionEvents.filter((f: any) => f.severity === 'high').length;
    }, 0);
    if (highFriction > telemetry.length) {
      indicators.push('High friction events');
    }

    return indicators;
  },

  // ─── Calculate Trust Indicators ────────────────────────────────────────
  async calculateTrustIndicators(userId: string): Promise<TrustIndicators> {
    const telemetry = await BehavioralTelemetry.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ sessionStart: -1 })
      .limit(30);

    if (!telemetry.length) {
      return {
        userId,
        trustScore: 0,
        emotionalSafety: 0,
        autonomyPreservation: 0,
        pressureFree: 0,
        transparency: 0,
        trustFactors: [],
        trustRisks: ['No engagement data available'],
      };
    }

    // Calculate emotional safety (low frustration, low confusion)
    const emotionalSafety = this.calculateEmotionalSafety(telemetry);

    // Calculate autonomy preservation (user-driven, not pressure-driven)
    const autonomyPreservation = this.calculateAutonomy(telemetry);

    // Calculate pressure-free (low urgency, low guilt)
    const pressureFree = this.calculatePressureFree(telemetry);

    // Calculate transparency (clear feedback, predictable behavior)
    const transparency = this.calculateTransparency(telemetry);

    // Composite trust score
    const trustScore = (emotionalSafety * 0.3 + autonomyPreservation * 0.3 + pressureFree * 0.2 + transparency * 0.2);

    // Identify trust factors
    const trustFactors = this.identifyTrustFactors(telemetry, emotionalSafety, autonomyPreservation, pressureFree, transparency);

    // Identify trust risks
    const trustRisks = this.identifyTrustRisks(telemetry, emotionalSafety, autonomyPreservation, pressureFree, transparency);

    return {
      userId,
      trustScore,
      emotionalSafety,
      autonomyPreservation,
      pressureFree,
      transparency,
      trustFactors,
      trustRisks,
    };
  },

  // ─── Calculate Emotional Safety ───────────────────────────────────────
  calculateEmotionalSafety(telemetry: any[]): number {
    let safetyScore = 50;

    let negativeSignals = 0;
    let totalSignals = 0;

    telemetry.forEach(t => {
      t.emotionalSignals.forEach((s: any) => {
        totalSignals++;
        if (s.signal === 'frustration' || s.signal === 'confusion') {
          negativeSignals++;
        }
      });
    });

    if (totalSignals > 0) {
      const negativeRatio = negativeSignals / totalSignals;
      safetyScore = (1 - negativeRatio) * 100;
    }

    return safetyScore;
  },

  // ─── Calculate Pressure-Free ────────────────────────────────────────
  calculatePressureFree(telemetry: any[]): number {
    let pressureScore = 50;

    // Check for pressure indicators
    let pressureIndicators = 0;
    let totalChecks = 0;

    telemetry.forEach(t => {
      totalChecks++;

      // High friction indicates pressure
      if (t.frictionEvents.filter((f: any) => f.severity === 'high').length > 0) {
        pressureIndicators++;
      }

      // Abandonment events indicate pressure
      if (t.abandonmentEvents.length > 0) {
        pressureIndicators++;
      }
    });

    if (totalChecks > 0) {
      const pressureRatio = pressureIndicators / totalChecks;
      pressureScore = (1 - pressureRatio) * 100;
    }

    return pressureScore;
  },

  // ─── Calculate Transparency ─────────────────────────────────────────
  calculateTransparency(telemetry: any[]): number {
    let transparencyScore = 50;

    // Check for predictable behavior patterns
    const sessionDurations = telemetry.map(t => t.sessionDuration || 0).filter(d => d > 0);
    if (sessionDurations.length > 5) {
      const avgDuration = sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length;
      const variance = sessionDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / sessionDurations.length;
      const stdDev = Math.sqrt(variance);

      // Low variance indicates predictable behavior
      const coefficientOfVariation = stdDev / avgDuration;
      if (coefficientOfVariation < 0.5) {
        transparencyScore = 80;
      } else if (coefficientOfVariation < 1.0) {
        transparencyScore = 60;
      } else {
        transparencyScore = 40;
      }
    }

    return transparencyScore;
  },

  // ─── Identify Trust Factors ──────────────────────────────────────────
  identifyTrustFactors(
    telemetry: any[],
    emotionalSafety: number,
    autonomyPreservation: number,
    pressureFree: number,
    transparency: number
  ): Array<{ factor: string; positive: boolean; impact: number }> {
    const factors: Array<{ factor: string; positive: boolean; impact: number }> = [];

    if (emotionalSafety > 70) {
      factors.push({ factor: 'High emotional safety', positive: true, impact: emotionalSafety });
    }
    if (autonomyPreservation > 70) {
      factors.push({ factor: 'User autonomy preserved', positive: true, impact: autonomyPreservation });
    }
    if (pressureFree > 70) {
      factors.push({ factor: 'Pressure-free experience', positive: true, impact: pressureFree });
    }
    if (transparency > 70) {
      factors.push({ factor: 'Transparent behavior', positive: true, impact: transparency });
    }

    const keyboardUsage = telemetry.reduce((sum, t) => sum + t.workspaceEngagement.keyboardWorkflowUsage, 0);
    if (keyboardUsage > telemetry.length * 5) {
      factors.push({ factor: 'Keyboard workflow adoption', positive: true, impact: 60 });
    }

    return factors;
  },

  // ─── Identify Trust Risks ───────────────────────────────────────────
  identifyTrustRisks(
    telemetry: any[],
    emotionalSafety: number,
    autonomyPreservation: number,
    pressureFree: number,
    transparency: number
  ): string[] {
    const risks: string[] = [];

    if (emotionalSafety < 40) {
      risks.push('Low emotional safety - users experiencing frustration or confusion');
    }
    if (autonomyPreservation < 40) {
      risks.push('Low autonomy - pressure-driven behavior detected');
    }
    if (pressureFree < 40) {
      risks.push('High pressure - urgency or guilt mechanics may be too strong');
    }
    if (transparency < 40) {
      risks.push('Low transparency - unpredictable behavior patterns');
    }

    const highFriction = telemetry.reduce((sum, t) => sum + t.frictionEvents.filter((f: any) => f.severity === 'high').length, 0);
    if (highFriction > telemetry.length) {
      risks.push('High friction events - UX issues causing trust erosion');
    }

    const abandonmentRate = telemetry.filter(t => t.abandonmentEvents.length > 0).length / telemetry.length;
    if (abandonmentRate > 0.3) {
      risks.push('High abandonment rate - users leaving mid-task');
    }

    return risks;
  },
};

export default behavioralQualityAnalytics;
