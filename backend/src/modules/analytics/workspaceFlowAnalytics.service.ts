// src/modules/analytics/workspaceFlowAnalytics.service.ts — DSA Workspace Flow Analytics
// Phase-I: DSA Workspace Flow Optimization - Tracks flow quality, interruptions, and focus preservation

import mongoose from 'mongoose';
import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { logger } from '../../shared/logger.js';

export interface FlowMetrics {
  sessionId: string;
  userId: string;
  flowQuality: number; // 0-100
  focusInterruptions: number;
  averageFocusDuration: number;
  totalCodingTime: number;
  interruptionSources: Array<{ source: string; count: number }>;
  realtimeFeedbackImpact: number; // 0-100 (lower is better)
  keyboardWorkflowEfficiency: number; // 0-100
}

export interface InterruptionEvent {
  sessionId: string;
  userId: string;
  timestamp: Date;
  source: 'notification' | 'realtime_update' | 'ui_change' | 'navigation' | 'external';
  context: string;
  severity: 'low' | 'medium' | 'high';
  recoveryTime?: number; // Time to return to focused state
}

export interface FlowAnalysis {
  averageFlowQuality: number;
  averageFocusDuration: number;
  totalInterruptions: number;
  interruptionRate: number; // interruptions per hour
  topInterruptionSources: Array<{ source: string; count: number; percentage: number }>;
  realtimeFeedbackEffectiveness: number;
  keyboardWorkflowAdoption: number;
  recommendations: string[];
}

export const workspaceFlowAnalytics = {
  // ─── Track Interruption ────────────────────────────────────────────────
  async trackInterruption(event: InterruptionEvent): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId: event.sessionId });
    if (!telemetry) return;

    telemetry.workspaceEngagement.focusInterruptions++;

    // Track as friction event if severity is medium or high
    if (event.severity === 'medium' || event.severity === 'high') {
      telemetry.frictionEvents.push({
        element: event.source,
        type: 'confusion',
        timestamp: event.timestamp,
        severity: event.severity,
        context: { interruption: true, originalContext: event.context },
      });
    }

    await telemetry.save();

    logger.debug('[workspace-flow] Interruption tracked', { sessionId: event.sessionId, source: event.source });
  },

  // ─── Track Focus Duration ───────────────────────────────────────────────
  async trackFocusDuration(sessionId: string, duration: number): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    // Store focus duration in a custom field or use activeTime
    telemetry.activeTime += duration;

    await telemetry.save();
  },

  // ─── Track Realtime Feedback Impact ────────────────────────────────────
  async trackRealtimeFeedbackImpact(sessionId: string, impact: 'positive' | 'neutral' | 'negative'): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    // Track as emotional signal
    const intensity = impact === 'negative' ? 0.7 : impact === 'positive' ? 0.3 : 0.1;
    telemetry.emotionalSignals.push({
      timestamp: new Date(),
      signal: impact === 'negative' ? 'frustration' : impact === 'positive' ? 'engagement' : 'engagement',
      intensity,
      context: 'realtime_feedback',
    });

    await telemetry.save();
  },

  // ─── Track Keyboard Workflow Usage ────────────────────────────────────
  async trackKeyboardWorkflow(sessionId: string, action: string): Promise<void> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return;

    telemetry.workspaceEngagement.keyboardWorkflowUsage++;

    await telemetry.save();
  },

  // ─── Calculate Flow Metrics for Session ───────────────────────────────
  async calculateFlowMetrics(sessionId: string): Promise<FlowMetrics | null> {
    const telemetry = await BehavioralTelemetry.findOne({ sessionId });
    if (!telemetry) return null;

    // Calculate flow quality based on interruptions and emotional signals
    const interruptionCount = telemetry.workspaceEngagement.focusInterruptions;
    const frustrationSignals = telemetry.emotionalSignals.filter(s => s.signal === 'frustration').length;
    const engagementSignals = telemetry.emotionalSignals.filter(s => s.signal === 'engagement').length;

    const baseFlowQuality = 100;
    const interruptionPenalty = interruptionCount * 5;
    const frustrationPenalty = frustrationSignals * 10;
    const engagementBonus = engagementSignals * 2;

    const flowQuality = Math.max(0, Math.min(100, baseFlowQuality - interruptionPenalty - frustrationPenalty + engagementBonus));

    // Calculate average focus duration
    const sessionDuration = telemetry.sessionDuration || 0;
    const averageFocusDuration = interruptionCount > 0 ? sessionDuration / (interruptionCount + 1) : sessionDuration;

    // Analyze interruption sources
    const interruptionSources = new Map<string, number>();
    telemetry.frictionEvents.forEach(f => {
      if (f.context.interruption) {
        const source = f.element;
        interruptionSources.set(source, (interruptionSources.get(source) || 0) + 1);
      }
    });

    const interruptionSourcesArray = Array.from(interruptionSources.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate realtime feedback impact
    const realtimeFeedbackEvents = telemetry.emotionalSignals.filter(s => s.context === 'realtime_feedback');
    const negativeFeedback = realtimeFeedbackEvents.filter(s => s.signal === 'frustration').length;
    const realtimeFeedbackImpact = realtimeFeedbackEvents.length > 0
      ? (negativeFeedback / realtimeFeedbackEvents.length) * 100
      : 0;

    // Calculate keyboard workflow efficiency
    const totalActions = telemetry.workspaceEngagement.problemsAttempted || 1;
    const keyboardWorkflowEfficiency = (telemetry.workspaceEngagement.keyboardWorkflowUsage / totalActions) * 100;

    return {
      sessionId,
      userId: telemetry.userId.toString(),
      flowQuality,
      focusInterruptions: interruptionCount,
      averageFocusDuration,
      totalCodingTime: telemetry.activeTime,
      interruptionSources: interruptionSourcesArray,
      realtimeFeedbackImpact,
      keyboardWorkflowEfficiency: Math.min(100, keyboardWorkflowEfficiency),
    };
  },

  // ─── Generate Flow Analysis Report ────────────────────────────────────
  async generateFlowAnalysis(dateRange: { start: Date; end: Date }): Promise<FlowAnalysis> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    if (telemetry.length === 0) {
      return {
        averageFlowQuality: 0,
        averageFocusDuration: 0,
        totalInterruptions: 0,
        interruptionRate: 0,
        topInterruptionSources: [],
        realtimeFeedbackEffectiveness: 0,
        keyboardWorkflowAdoption: 0,
        recommendations: ['No data available for analysis'],
      };
    }

    // Calculate aggregate metrics
    const flowMetrics = await Promise.all(
      telemetry.map(t => this.calculateFlowMetrics(t.sessionId))
    );

    const validMetrics = flowMetrics.filter(m => m !== null) as FlowMetrics[];

    const averageFlowQuality = validMetrics.length > 0
      ? validMetrics.reduce((sum, m) => sum + m.flowQuality, 0) / validMetrics.length
      : 0;

    const averageFocusDuration = validMetrics.length > 0
      ? validMetrics.reduce((sum, m) => sum + m.averageFocusDuration, 0) / validMetrics.length
      : 0;

    const totalInterruptions = validMetrics.reduce((sum, m) => sum + m.focusInterruptions, 0);

    const totalSessionTime = telemetry.reduce((sum, t) => sum + (t.sessionDuration || 0), 0);
    const interruptionRate = totalSessionTime > 0 ? (totalInterruptions / (totalSessionTime / 3600000)) : 0;

    // Analyze interruption sources
    const sourceMap = new Map<string, number>();
    validMetrics.forEach(m => {
      m.interruptionSources.forEach(s => {
        sourceMap.set(s.source, (sourceMap.get(s.source) || 0) + s.count);
      });
    });

    const topInterruptionSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalInterruptions > 0 ? (count / totalInterruptions) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate realtime feedback effectiveness
    const realtimeFeedbackImpact = validMetrics.length > 0
      ? validMetrics.reduce((sum, m) => sum + m.realtimeFeedbackImpact, 0) / validMetrics.length
      : 0;
    const realtimeFeedbackEffectiveness = 100 - realtimeFeedbackImpact;

    // Calculate keyboard workflow adoption
    const keyboardWorkflowAdoption = validMetrics.length > 0
      ? validMetrics.reduce((sum, m) => sum + m.keyboardWorkflowEfficiency, 0) / validMetrics.length
      : 0;

    // Generate recommendations
    const recommendations = this.generateFlowRecommendations(
      averageFlowQuality,
      averageFocusDuration,
      interruptionRate,
      topInterruptionSources,
      realtimeFeedbackEffectiveness,
      keyboardWorkflowAdoption
    );

    return {
      averageFlowQuality,
      averageFocusDuration,
      totalInterruptions,
      interruptionRate,
      topInterruptionSources,
      realtimeFeedbackEffectiveness,
      keyboardWorkflowAdoption,
      recommendations,
    };
  },

  // ─── Generate Flow Recommendations ───────────────────────────────────
  generateFlowRecommendations(
    averageFlowQuality: number,
    averageFocusDuration: number,
    interruptionRate: number,
    topInterruptionSources: Array<{ source: string; count: number; percentage: number }>,
    realtimeFeedbackEffectiveness: number,
    keyboardWorkflowAdoption: number
  ): string[] {
    const recommendations: string[] = [];

    if (averageFlowQuality < 60) {
      recommendations.push('URGENT: Flow quality is below acceptable threshold - investigate major interruption sources');
    } else if (averageFlowQuality < 75) {
      recommendations.push('Flow quality could be improved - reduce non-essential interruptions');
    }

    if (averageFocusDuration < 60000) { // Less than 1 minute
      recommendations.push('Average focus duration is very short - users are being interrupted too frequently');
    } else if (averageFocusDuration < 300000) { // Less than 5 minutes
      recommendations.push('Consider extending focus duration by reducing notification frequency');
    }

    if (interruptionRate > 10) { // More than 10 interruptions per hour
      recommendations.push('Interruption rate is high - implement focus mode or batch notifications');
    }

    if (topInterruptionSources.length > 0) {
      const topSource = topInterruptionSources[0];
      if (topSource.percentage > 40) {
        recommendations.push(`Primary interruption source is "${topSource.source}" (${topSource.percentage.toFixed(1)}%) - optimize or make optional`);
      }
    }

    if (realtimeFeedbackEffectiveness < 60) {
      recommendations.push('Realtime feedback is causing frustration - reduce frequency or make less intrusive');
    }

    if (keyboardWorkflowAdoption < 30) {
      recommendations.push('Keyboard workflow adoption is low - improve discoverability and documentation');
    } else if (keyboardWorkflowAdoption < 50) {
      recommendations.push('Keyboard workflow adoption could be improved - add more shortcuts and visual hints');
    }

    if (recommendations.length === 0) {
      recommendations.push('Flow metrics are healthy - continue monitoring');
    }

    return recommendations;
  },
};

export default workspaceFlowAnalytics;
