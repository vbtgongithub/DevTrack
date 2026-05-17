// src/modules/workspace/workspaceFlowRefinement.service.ts — Workspace Flow Refinement Service
// Phase-J: DSA Workspace Flow Refinement - Focus preservation and coding flow continuity tracking

import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';

export interface FlowMetrics {
  sessionId: string;
  focusDuration: number;
  interruptionCount: number;
  contextSwitchCount: number;
  codingFlowContinuity: number; // 0-100
  focusPreservationScore: number; // 0-100
  recommendations: string[];
}

export interface FlowAnalysis {
  averageFocusDuration: number;
  averageInterruptionRate: number;
  averageContextSwitchRate: number;
  overallFlowContinuity: number;
  overallFocusPreservation: number;
  commonInterruptionSources: Array<{ source: string; count: number }>;
  recommendations: string[];
}

export const workspaceFlowRefinement = {
  // ─── Calculate Flow Metrics for Session ─────────────────────────────────────
  async calculateFlowMetrics(sessionId: string): Promise<FlowMetrics> {
    const replay = await SessionReplay.findOne({ sessionId });
    if (!replay) {
      throw new Error('Session replay not found');
    }

    // Calculate focus duration (time without interruptions)
    const interruptions = replay.frictionEvents.filter(f => f.type === 'hesitation' || f.type === 'abandonment');
    const focusDuration = this.calculateFocusDuration(replay, interruptions);

    // Count interruptions
    const interruptionCount = interruptions.length;

    // Count context switches (page changes during coding)
    const contextSwitchCount = this.countContextSwitches(replay);

    // Calculate coding flow continuity
    const codingFlowContinuity = this.calculateFlowContinuity(focusDuration, interruptionCount, contextSwitchCount);

    // Calculate focus preservation score
    const focusPreservationScore = this.calculateFocusPreservation(focusDuration, replay.duration || 0);

    // Generate recommendations
    const recommendations = this.generateFlowRecommendations(
      interruptionCount,
      contextSwitchCount,
      codingFlowContinuity,
      focusPreservationScore
    );

    return {
      sessionId,
      focusDuration,
      interruptionCount,
      contextSwitchCount,
      codingFlowContinuity,
      focusPreservationScore,
      recommendations,
    };
  },

  // ─── Calculate Focus Duration ─────────────────────────────────────────────
  calculateFocusDuration(replay: any, interruptions: any[]): number {
    if (!replay.duration) return 0;

    // Simplified: total duration minus estimated interruption time
    const interruptionTime = interruptions.length * 5000; // Assume 5 seconds per interruption
    return Math.max(0, replay.duration - interruptionTime);
  },

  // ─── Count Context Switches ─────────────────────────────────────────────
  countContextSwitches(replay: any): number {
    // Count page changes that are not part of normal navigation
    const workspacePages = replay.pages.filter((p: any) => p.path.includes('/workspace') || p.path.includes('/dsa'));
    return Math.max(0, workspacePages.length - 1);
  },

  // ─── Calculate Flow Continuity ───────────────────────────────────────────
  calculateFlowContinuity(focusDuration: number, interruptionCount: number, contextSwitchCount: number): number {
    if (focusDuration === 0) return 0;

    let continuity = 100;

    // Penalty for interruptions
    continuity -= interruptionCount * 5;

    // Penalty for context switches
    continuity -= contextSwitchCount * 3;

    return Math.max(0, Math.min(100, continuity));
  },

  // ─── Calculate Focus Preservation ─────────────────────────────────────────
  calculateFocusPreservation(focusDuration: number, totalDuration: number): number {
    if (totalDuration === 0) return 0;
    return (focusDuration / totalDuration) * 100;
  },

  // ─── Generate Flow Recommendations ───────────────────────────────────────
  generateFlowRecommendations(
    interruptionCount: number,
    contextSwitchCount: number,
    flowContinuity: number,
    focusPreservation: number
  ): string[] {
    const recommendations: string[] = [];

    if (interruptionCount > 5) {
      recommendations.push('High interruption count - reduce notification frequency and minimize distractions');
    }

    if (contextSwitchCount > 3) {
      recommendations.push('Frequent context switching - optimize workspace layout to reduce navigation needs');
    }

    if (flowContinuity < 60) {
      recommendations.push('Low flow continuity - identify and remove sources of interruption');
    }

    if (focusPreservation < 50) {
      recommendations.push('Poor focus preservation - implement focus mode and reduce UI density');
    }

    if (recommendations.length === 0) {
      recommendations.push('Flow is well-preserved - continue current design');
    }

    return recommendations;
  },

  // ─── Analyze Overall Flow Quality ────────────────────────────────────────────
  async analyzeOverallFlowQuality(dateRange: { start: Date; end: Date }): Promise<FlowAnalysis> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
      'pages.path': /workspace|dsa/i,
    });

    if (sessionReplays.length === 0) {
      return {
        averageFocusDuration: 0,
        averageInterruptionRate: 0,
        averageContextSwitchRate: 0,
        overallFlowContinuity: 0,
        overallFocusPreservation: 0,
        commonInterruptionSources: [],
        recommendations: ['No workspace sessions found'],
      };
    }

    let totalFocusDuration = 0;
    let totalInterruptions = 0;
    let totalContextSwitches = 0;
    let totalFlowContinuity = 0;
    let totalFocusPreservation = 0;

    const interruptionSources = new Map<string, number>();

    for (const replay of sessionReplays) {
      const interruptions = replay.frictionEvents.filter((f: any) => f.type === 'hesitation' || f.type === 'abandonment');
      
      totalFocusDuration += this.calculateFocusDuration(replay, interruptions);
      totalInterruptions += interruptions.length;
      totalContextSwitches += this.countContextSwitches(replay);

      const flowContinuity = this.calculateFlowContinuity(
        this.calculateFocusDuration(replay, interruptions),
        interruptions.length,
        this.countContextSwitches(replay)
      );
      totalFlowContinuity += flowContinuity;

      const focusPreservation = this.calculateFocusPreservation(
        this.calculateFocusDuration(replay, interruptions),
        replay.duration || 0
      );
      totalFocusPreservation += focusPreservation;

      // Track interruption sources
      interruptions.forEach((i: any) => {
        const source = i.element || 'unknown';
        interruptionSources.set(source, (interruptionSources.get(source) || 0) + 1);
      });
    }

    const averageFocusDuration = sessionReplays.length > 0 ? totalFocusDuration / sessionReplays.length : 0;
    const averageInterruptionRate = sessionReplays.length > 0 ? totalInterruptions / sessionReplays.length : 0;
    const averageContextSwitchRate = sessionReplays.length > 0 ? totalContextSwitches / sessionReplays.length : 0;
    const overallFlowContinuity = sessionReplays.length > 0 ? totalFlowContinuity / sessionReplays.length : 0;
    const overallFocusPreservation = sessionReplays.length > 0 ? totalFocusPreservation / sessionReplays.length : 0;

    const commonInterruptionSources = Array.from(interruptionSources.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recommendations = this.generateOverallFlowRecommendations(
      averageInterruptionRate,
      averageContextSwitchRate,
      overallFlowContinuity,
      overallFocusPreservation,
      commonInterruptionSources
    );

    return {
      averageFocusDuration,
      averageInterruptionRate,
      averageContextSwitchRate,
      overallFlowContinuity,
      overallFocusPreservation,
      commonInterruptionSources,
      recommendations,
    };
  },

  // ─── Generate Overall Flow Recommendations ─────────────────────────────────
  generateOverallFlowRecommendations(
    averageInterruptionRate: number,
    averageContextSwitchRate: number,
    overallFlowContinuity: number,
    overallFocusPreservation: number,
    commonInterruptionSources: Array<{ source: string; count: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (averageInterruptionRate > 3) {
      recommendations.push('High average interruption rate - implement focus mode and reduce notifications');
    }

    if (averageContextSwitchRate > 2) {
      recommendations.push('Frequent context switching - optimize workspace layout and reduce navigation');
    }

    if (overallFlowContinuity < 60) {
      recommendations.push('Poor overall flow continuity - major UX refinement needed');
    }

    if (overallFocusPreservation < 50) {
      recommendations.push('Low focus preservation - redesign workspace to minimize distractions');
    }

    commonInterruptionSources.slice(0, 3).forEach(({ source }) => {
      recommendations.push(`Address ${source} - common interruption source`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Workspace flow is healthy - continue monitoring');
    }

    return recommendations;
  },
};

export default workspaceFlowRefinement;
