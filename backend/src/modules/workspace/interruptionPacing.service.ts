// src/modules/workspace/interruptionPacing.service.ts — Interruption Pacing Service
// Phase-J: DSA Workspace Flow Refinement - Realtime interruption pacing and sidebar usefulness analysis

import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';

export interface InterruptionMetrics {
  sessionId: string;
  interruptionCount: number;
  averageInterruptionInterval: number;
  interruptionSources: Array<{ source: string; count: number }>;
  interruptionImpact: 'low' | 'medium' | 'high';
  recommendedPacing: number; // seconds between interruptions
}

export interface SidebarUsefulness {
  sidebarInteractions: number;
  sidebarViewTime: number;
  sidebarClickRate: number;
  usefulFeatures: string[];
  unusedFeatures: string[];
  usefulnessScore: number; // 0-100
  recommendations: string[];
}

export const interruptionPacing = {
  // ─── Calculate Interruption Metrics ───────────────────────────────────────────
  async calculateInterruptionMetrics(sessionId: string): Promise<InterruptionMetrics> {
    const replay = await SessionReplay.findOne({ sessionId });
    if (!replay) {
      throw new Error('Session replay not found');
    }

    const interruptions = replay.frictionEvents.filter(f => f.type === 'hesitation' || f.type === 'abandonment');
    const interruptionCount = interruptions.length;

    // Calculate average interval between interruptions
    let averageInterruptionInterval = 0;
    if (interruptionCount > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < interruptions.length; i++) {
        const interval = interruptions[i].timestamp.getTime() - interruptions[i - 1].timestamp.getTime();
        intervals.push(interval);
      }
      averageInterruptionInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    }

    // Track interruption sources
    const sourceCounts = new Map<string, number>();
    interruptions.forEach(i => {
      const source = i.element || 'unknown';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });

    const interruptionSources = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Determine interruption impact
    const interruptionImpact = this.determineInterruptionImpact(interruptionCount, averageInterruptionInterval);

    // Calculate recommended pacing
    const recommendedPacing = this.calculateRecommendedPacing(interruptionCount, averageInterruptionInterval, interruptionImpact);

    return {
      sessionId,
      interruptionCount,
      averageInterruptionInterval,
      interruptionSources,
      interruptionImpact,
      recommendedPacing,
    };
  },

  // ─── Determine Interruption Impact ─────────────────────────────────────────
  determineInterruptionImpact(count: number, interval: number): 'low' | 'medium' | 'high' {
    if (count > 5 || (count > 3 && interval < 30000)) {
      return 'high';
    }
    if (count > 3 || interval < 60000) {
      return 'medium';
    }
    return 'low';
  },

  // ─── Calculate Recommended Pacing ───────────────────────────────────────────
  calculateRecommendedPacing(count: number, interval: number, impact: 'low' | 'medium' | 'high'): number {
    const basePacing = 120000; // 2 minutes base

    if (impact === 'high') {
      return basePacing * 2;
    }
    if (impact === 'medium') {
      return basePacing * 1.5;
    }
    return basePacing;
  },

  // ─── Analyze Sidebar Usefulness ─────────────────────────────────────────────
  async analyzeSidebarUsefulness(dateRange: { start: Date; end: Date }): Promise<SidebarUsefulness> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
      'pages.path': /workspace|dsa/i,
    });

    let sidebarInteractions = 0;
    let sidebarViewTime = 0;
    const featureInteractions = new Map<string, number>();

    sessionReplays.forEach(replay => {
      // Count sidebar interactions
      const sidebarInteractionsInSession = replay.interactions.filter(i => i.element.includes('sidebar'));
      sidebarInteractions += sidebarInteractionsInSession.length;

      // Estimate sidebar view time (time spent on workspace pages)
      const workspacePages = replay.pages.filter(p => p.path.includes('/workspace') || p.path.includes('/dsa'));
      sidebarViewTime += workspacePages.reduce((sum, p) => sum + (p.duration || 0), 0);

      // Track feature interactions
      sidebarInteractionsInSession.forEach(i => {
        const feature = i.element.split('/').pop() || 'unknown';
        featureInteractions.set(feature, (featureInteractions.get(feature) || 0) + 1);
      });
    });

    const totalSessions = sessionReplays.length;
    const sidebarClickRate = totalSessions > 0 ? (sidebarInteractions / totalSessions) : 0;

    // Identify useful and unused features
    const usefulFeatures = Array.from(featureInteractions.entries())
      .filter(([_, count]) => count > totalSessions * 0.3)
      .map(([feature, _]) => feature)
      .sort();

    const unusedFeatures = Array.from(featureInteractions.entries())
      .filter(([_, count]) => count < totalSessions * 0.1)
      .map(([feature, _]) => feature)
      .sort();

    // Calculate usefulness score
    const usefulnessScore = this.calculateSidebarUsefulnessScore(
      sidebarClickRate,
      usefulFeatures.length,
      unusedFeatures.length
    );

    // Generate recommendations
    const recommendations = this.generateSidebarRecommendations(
      sidebarClickRate,
      usefulFeatures,
      unusedFeatures,
      usefulnessScore
    );

    return {
      sidebarInteractions,
      sidebarViewTime,
      sidebarClickRate,
      usefulFeatures,
      unusedFeatures,
      usefulnessScore,
      recommendations,
    };
  },

  // ─── Calculate Sidebar Usefulness Score ───────────────────────────────────
  calculateSidebarUsefulnessScore(clickRate: number, usefulCount: number, unusedCount: number): number {
    let score = 0;

    // Higher click rate = more useful
    score += Math.min(40, clickRate * 10);

    // More useful features = higher score
    score += Math.min(30, usefulCount * 5);

    // More unused features = lower score
    score -= Math.min(30, unusedCount * 5);

    return Math.max(0, Math.min(100, score));
  },

  // ─── Generate Sidebar Recommendations ───────────────────────────────────────
  generateSidebarRecommendations(
    clickRate: number,
    usefulFeatures: string[],
    unusedFeatures: string[],
    usefulnessScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (clickRate < 1) {
      recommendations.push('Very low sidebar interaction rate - consider simplifying or hiding sidebar');
    }

    if (unusedFeatures.length > 3) {
      recommendations.push(`${unusedFeatures.length} unused sidebar features - consider removing or hiding them`);
    }

    unusedFeatures.slice(0, 3).forEach(feature => {
      recommendations.push(`Consider hiding "${feature}" - rarely used`);
    });

    if (usefulnessScore < 40) {
      recommendations.push('Low sidebar usefulness - major redesign needed');
    }

    if (recommendations.length === 0) {
      recommendations.push('Sidebar is well-utilized - continue current design');
    }

    return recommendations;
  },

  // ─── Get Optimal Interruption Schedule ─────────────────────────────────────
  async getOptimalInterruptionSchedule(dateRange: { start: Date; end: Date }): Promise<{
    recommendedInterval: number;
    quietPeriods: Array<{ start: string; end: string; reason: string }>;
    highRiskPeriods: Array<{ start: string; end: string; reason: string }>;
  }> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Analyze interruption patterns by time of day
    const hourlyInterruptions = new Map<number, number>();
    const hourlySessions = new Map<number, number>();

    sessionReplays.forEach(replay => {
      const hour = replay.startTime.getHours();
      hourlySessions.set(hour, (hourlySessions.get(hour) || 0) + 1);

      const interruptions = replay.frictionEvents.filter(f => f.type === 'hesitation' || f.type === 'abandonment');
      hourlyInterruptions.set(hour, (hourlyInterruptions.get(hour) || 0) + interruptions.length);
    });

    // Identify quiet periods (low interruption rate)
    const quietPeriods: Array<{ start: string; end: string; reason: string }> = [];
    const highRiskPeriods: Array<{ start: string; end: string; reason: string }> = [];

    for (let hour = 0; hour < 24; hour++) {
      const sessions = hourlySessions.get(hour) || 0;
      const interruptions = hourlyInterruptions.get(hour) || 0;
      const interruptionRate = sessions > 0 ? interruptions / sessions : 0;

      if (interruptionRate < 0.5 && sessions > 5) {
        quietPeriods.push({
          start: `${hour}:00`,
          end: `${hour + 1}:00`,
          reason: 'Low interruption rate - safe for notifications',
        });
      }

      if (interruptionRate > 2 && sessions > 5) {
        highRiskPeriods.push({
          start: `${hour}:00`,
          end: `${hour + 1}:00`,
          reason: 'High interruption rate - avoid notifications',
        });
      }
    }

    // Calculate recommended interval based on overall patterns
    const totalInterruptions = Array.from(hourlyInterruptions.values()).reduce((sum, i) => sum + i, 0);
    const totalSessions = Array.from(hourlySessions.values()).reduce((sum, s) => sum + s, 0);
    const averageRate = totalSessions > 0 ? totalInterruptions / totalSessions : 0;

    const recommendedInterval = averageRate > 2 ? 300000 : averageRate > 1 ? 180000 : 120000; // 5, 3, or 2 minutes

    return {
      recommendedInterval,
      quietPeriods,
      highRiskPeriods,
    };
  },
};

export default interruptionPacing;
