// src/modules/observation/insights.service.ts — Heuristic AI Insights Engine
import { Types } from 'mongoose';
import { UserXp, UserStreakLog, DsaTopicProgress, ActivityEvent, DailyActivity } from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';

export interface HeuristicInsight {
  type: 'momentum' | 'weakness' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

export interface MomentumSummary {
  status: 'surging' | 'stable' | 'waning';
  xpDelta: number; // % change last 7d vs prev 7d
  activeDaysDelta: number;
  message: string;
}

export class InsightsService {
  /**
   * Calculates heuristic insights for a user.
   */
  async getInsights(userId: string): Promise<HeuristicInsight[]> {
    const userObjId = new Types.ObjectId(userId);
    const insights: HeuristicInsight[] = [];

    const [momentum, weaknesses, suggestions] = await Promise.all([
      this.calculateMomentum(userId),
      this.calculateWeaknesses(userId),
      this.calculateSuggestions(userId),
    ]);

    if (momentum) {
      insights.push({
        type: 'momentum',
        title: momentum.status === 'surging' ? 'High Momentum' : momentum.status === 'waning' ? 'Momentum Dropping' : 'Stable Momentum',
        description: momentum.message,
        priority: momentum.status === 'waning' ? 'high' : 'medium',
        metadata: momentum as any,
      });
    }

    weaknesses.forEach(w => {
      insights.push({
        type: 'weakness',
        title: `Focus needed: ${w.topic}`,
        description: `Your solve rate in ${w.topic} is ${w.solveRate}%. Consider practicing more ${w.difficulty} problems here.`,
        priority: 'medium',
        metadata: w as any,
      });
    });

    suggestions.forEach(s => {
      insights.push({
        type: 'suggestion',
        title: s.title,
        description: s.description,
        priority: 'low',
        metadata: s.metadata,
      });
    });

    return insights.sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });
  }

  private async calculateMomentum(userId: string): Promise<MomentumSummary | null> {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [last7dActivities, prev7dActivities] = await Promise.all([
      DailyActivity.find({ userId: userObjId, date: { $gte: last7d } }).lean(),
      DailyActivity.find({ userId: userObjId, date: { $gte: prev7d, $lt: last7d } }).lean(),
    ]);

    const last7dXp = last7dActivities.reduce((sum, a) => sum + (a.count || 0), 0);
    const prev7dXp = prev7dActivities.reduce((sum, a) => sum + (a.count || 0), 0);

    const xpDelta = prev7dXp > 0 ? ((last7dXp - prev7dXp) / prev7dXp) * 100 : last7dXp > 0 ? 100 : 0;
    
    let status: 'surging' | 'stable' | 'waning' = 'stable';
    let message = 'Your activity is steady. Keep it up!';

    if (xpDelta > 20) {
      status = 'surging';
      message = `You're on fire! Your activity is up ${Math.round(xpDelta)}% this week.`;
    } else if (xpDelta < -20) {
      status = 'waning';
      message = `Consistency alert: Your activity dropped by ${Math.abs(Math.round(xpDelta))}% recently.`;
    }

    return { status, xpDelta, activeDaysDelta: 0, message };
  }

  private async calculateWeaknesses(userId: string): Promise<Array<{ topic: string; solveRate: number; difficulty: string }>> {
    const userObjId = new Types.ObjectId(userId);
    const topics = await DsaTopicProgress.find({ userId: userObjId }).lean();
    
    return topics
      .filter(t => t.totalProblems > 3 && (t.solvedCount / t.totalProblems) < 0.6)
      .map(t => ({
        topic: t.topicName,
        solveRate: Math.round((t.solvedCount / t.totalProblems) * 100),
        difficulty: t.hardCount > t.mediumCount ? 'Hard' : 'Medium',
      }))
      .slice(0, 2);
  }

  private async calculateSuggestions(userId: string): Promise<Array<{ title: string; description: string; metadata: any }>> {
    // Rule: Suggest a focus session if none today
    const userObjId = new Types.ObjectId(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const focusToday = await ActivityEvent.findOne({
      userId: userObjId,
      type: 'focus_session',
      occurredAt: { $gte: today },
    });

    const suggestions = [];
    if (!focusToday) {
      suggestions.push({
        title: 'Ready for a Deep Work session?',
        description: 'You haven\'t started a focus session today. A 25-minute sprint could boost your momentum.',
        metadata: { action: 'start_focus' },
      });
    }

    return suggestions;
  }
}

export const insightsService = new InsightsService();
