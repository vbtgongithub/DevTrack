// src/modules/workspace/dsaWorkspaceOptimization.service.ts — DSA Workspace Optimization Service
// Phase-K: DSA Workspace Optimization - Coding flow preservation, interruption pacing, sidebar usefulness, realtime progression timing, session continuity, keyboard workflows, focus preservation

import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';

export interface WorkspaceOptimizationMetrics {
  codingFlowScore: number; // 0-100
  interruptionScore: number; // 0-100, higher = more interruptions
  sidebarUsefulness: number; // 0-100
  realtimeTimingScore: number; // 0-100
  sessionContinuityScore: number; // 0-100
  keyboardWorkflowScore: number; // 0-100
  focusPreservationScore: number; // 0-100
  recommendations: string[];
}

export interface FlowAnalysis {
  sessionId: string;
  flowDuration: number;
  interruptions: number;
  contextSwitches: number;
  flowQuality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export const dsaWorkspaceOptimization = {
  // ─── Get Workspace Optimization Metrics ───────────────────────────────────────
  async getWorkspaceOptimizationMetrics(dateRange: { start: Date; end: Date }): Promise<WorkspaceOptimizationMetrics> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const codingFlowScore = this.calculateCodingFlowScore(sessionReplays);
    const interruptionScore = this.calculateInterruptionScore(sessionReplays);
    const sidebarUsefulness = this.calculateSidebarUsefulness(sessionReplays);
    const realtimeTimingScore = this.calculateRealtimeTimingScore(sessionReplays);
    const sessionContinuityScore = this.calculateSessionContinuityScore(sessionReplays);
    const keyboardWorkflowScore = this.calculateKeyboardWorkflowScore(sessionReplays);
    const focusPreservationScore = this.calculateFocusPreservationScore(sessionReplays);

    const recommendations = this.generateOptimizationRecommendations(
      codingFlowScore,
      interruptionScore,
      sidebarUsefulness,
      realtimeTimingScore,
      sessionContinuityScore,
      keyboardWorkflowScore,
      focusPreservationScore
    );

    return {
      codingFlowScore,
      interruptionScore,
      sidebarUsefulness,
      realtimeTimingScore,
      sessionContinuityScore,
      keyboardWorkflowScore,
      focusPreservationScore,
      recommendations,
    };
  },

  // ─── Calculate Coding Flow Score ───────────────────────────────────────────────
  calculateCodingFlowScore(sessionReplays: any[]): number {
    if (sessionReplays.length === 0) return 0;

    let totalScore = 0;

    sessionReplays.forEach(replay => {
      let score = 100;

      // Penalize interruptions
      const interruptions = replay.frictionEvents.filter((f: any) => f.type === 'hesitation').length;
      score -= interruptions * 5;

      // Penalize context switches
      const contextSwitches = replay.pages.length - 1;
      score -= contextSwitches * 3;

      // Reward long sessions (indicates flow)
      if (replay.duration && replay.duration > 3600000) { // > 1 hour
        score += 10;
      }

      // Penalize abandonment
      const abandonments = replay.frictionEvents.filter((f: any) => f.type === 'abandonment').length;
      score -= abandonments * 10;

      totalScore += Math.max(0, score);
    });

    return totalScore / sessionReplays.length;
  },

  // ─── Calculate Interruption Score ───────────────────────────────────────────────
  calculateInterruptionScore(sessionReplays: any[]): number {
    if (sessionReplays.length === 0) return 0;

    let totalInterruptions = 0;

    sessionReplays.forEach(replay => {
      const interruptions = replay.frictionEvents.filter((f: any) => f.type === 'hesitation').length;
      totalInterruptions += interruptions;
    });

    const averageInterruptions = totalInterruptions / sessionReplays.length;
    return Math.min(100, averageInterruptions * 10);
  },

  // ─── Calculate Sidebar Usefulness ───────────────────────────────────────────────
  calculateSidebarUsefulness(sessionReplays: any[]): number {
    // In a real implementation, this would track sidebar interactions
    // For now, return a placeholder value
    return 75;
  },

  // ─── Calculate Realtime Timing Score ─────────────────────────────────────────────
  calculateRealtimeTimingScore(sessionReplays: any[]): number {
    // In a real implementation, this would analyze realtime progression timing
    // For now, return a placeholder value
    return 80;
  },

  // ─── Calculate Session Continuity Score ───────────────────────────────────────────
  calculateSessionContinuityScore(sessionReplays: any[]): number {
    if (sessionReplays.length === 0) return 0;

    let totalScore = 0;

    sessionReplays.forEach(replay => {
      let score = 100;

      // Penalize short sessions
      if (replay.duration && replay.duration < 300000) { // < 5 minutes
        score -= 30;
      }

      // Penalize high page navigation
      if (replay.pages.length > 5) {
        score -= (replay.pages.length - 5) * 5;
      }

      totalScore += Math.max(0, score);
    });

    return totalScore / sessionReplays.length;
  },

  // ─── Calculate Keyboard Workflow Score ───────────────────────────────────────────
  calculateKeyboardWorkflowScore(sessionReplays: any[]): number {
    // In a real implementation, this would track keyboard shortcut usage
    // For now, return a placeholder value
    return 70;
  },

  // ─── Calculate Focus Preservation Score ────────────────────────────────────────
  calculateFocusPreservationScore(sessionReplays: any[]): number {
    if (sessionReplays.length === 0) return 0;

    let totalScore = 0;

    sessionReplays.forEach(replay => {
      let score = 100;

      // Penalize confusion events
      const confusionEvents = replay.frictionEvents.filter((f: any) => f.type === 'confusion').length;
      score -= confusionEvents * 8;

      // Penalize error events
      const errorEvents = replay.frictionEvents.filter((f: any) => f.type === 'error').length;
      score -= errorEvents * 10;

      // Reward long focused sessions
      if (replay.duration && replay.duration > 1800000) { // > 30 minutes
        score += 15;
      }

      totalScore += Math.max(0, score);
    });

    return totalScore / sessionReplays.length;
  },

  // ─── Generate Optimization Recommendations ────────────────────────────────────────
  generateOptimizationRecommendations(
    codingFlowScore: number,
    interruptionScore: number,
    sidebarUsefulness: number,
    realtimeTimingScore: number,
    sessionContinuityScore: number,
    keyboardWorkflowScore: number,
    focusPreservationScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (codingFlowScore < 60) {
      recommendations.push('Coding flow is suboptimal - reduce interruptions and improve continuity');
    }

    if (interruptionScore > 50) {
      recommendations.push('High interruption rate - optimize realtime feedback timing');
    }

    if (sidebarUsefulness < 60) {
      recommendations.push('Sidebar usefulness is low - review content and placement');
    }

    if (realtimeTimingScore < 60) {
      recommendations.push('Realtime timing needs improvement - adjust progression update frequency');
    }

    if (sessionContinuityScore < 60) {
      recommendations.push('Session continuity is poor - reduce navigation and improve persistence');
    }

    if (keyboardWorkflowScore < 60) {
      recommendations.push('Keyboard workflow adoption is low - improve shortcut discoverability');
    }

    if (focusPreservationScore < 60) {
      recommendations.push('Focus preservation is weak - reduce cognitive load and distractions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Workspace optimization is healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Analyze Flow ───────────────────────────────────────────────────────────────
  async analyzeFlow(sessionId: string): Promise<FlowAnalysis> {
    const replay = await SessionReplay.findOne({ sessionId });

    if (!replay) {
      throw new Error('Session replay not found');
    }

    const flowDuration = replay.duration || 0;
    const interruptions = replay.frictionEvents.filter((f: any) => f.type === 'hesitation').length;
    const contextSwitches = replay.pages.length - 1;

    let flowQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (interruptions < 2 && contextSwitches < 2) flowQuality = 'excellent';
    else if (interruptions < 5 && contextSwitches < 4) flowQuality = 'good';
    else if (interruptions < 10 && contextSwitches < 6) flowQuality = 'fair';
    else flowQuality = 'poor';

    const recommendations = this.generateFlowRecommendations(flowDuration, interruptions, contextSwitches, flowQuality);

    return {
      sessionId,
      flowDuration,
      interruptions,
      contextSwitches,
      flowQuality,
      recommendations,
    };
  },

  // ─── Generate Flow Recommendations ───────────────────────────────────────────────
  generateFlowRecommendations(
    flowDuration: number,
    interruptions: number,
    contextSwitches: number,
    flowQuality: 'excellent' | 'good' | 'fair' | 'poor'
  ): string[] {
    const recommendations: string[] = [];

    if (flowQuality === 'poor') {
      recommendations.push('Poor flow quality - significant UX improvements needed');
    } else if (flowQuality === 'fair') {
      recommendations.push('Fair flow quality - moderate improvements recommended');
    }

    if (interruptions > 5) {
      recommendations.push('High interruption count - reduce realtime feedback frequency');
    }

    if (contextSwitches > 4) {
      recommendations.push('Frequent context switches - improve workspace layout and navigation');
    }

    if (flowDuration < 300000) {
      recommendations.push('Short session duration - investigate early drop-off');
    }

    if (recommendations.length === 0) {
      recommendations.push('Flow quality is excellent - maintain current design');
    }

    return recommendations;
  },
};

export default dsaWorkspaceOptimization;
