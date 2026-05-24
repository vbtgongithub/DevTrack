// ============================================================================
// momentumEngine.service.ts — Adaptive Momentum Intelligence Engine
// ============================================================================
// Deterministic, heuristic-based behavioral intelligence layer.
// No LLM dependency. All calculations are explainable and low-latency.
// 
// Provides: momentum scoring, trend analysis, burnout detection,
// peak productivity windows, consistency forecasting, recovery suggestions.
// ============================================================================

import { Types } from 'mongoose';
import {
  DailyActivity,
  ActivityEvent,
  DsaTopicProgress,
  UserAnalytics,
  UserXp,
  UserStreakLog,
  PlatformStats,
} from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';
import { formatISODate } from '../../shared/date.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MomentumScore {
  overall: number; // 0–100
  breakdown: {
    activityFrequency: number;   // 0–100 — how often the user is active
    xpVelocity: number;          // 0–100 — rate of XP gain
    streakHealth: number;        // 0–100 — streak consistency
    focusConsistency: number;    // 0–100 — focus session regularity
    problemDiversity: number;    // 0–100 — variety in problem solving
  };
  trend: 'surging' | 'rising' | 'stable' | 'declining' | 'critical';
  message: string;
  lastCalculatedAt: string;
}

export interface ProductivityTrend {
  metric: string;
  current: number;
  previous: number;
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
  period: '7d' | '14d' | '30d';
}

export interface ConsistencyForecast {
  streakSurvivalProbability: number; // 0–100
  projectedStreakDays: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: string;
}

export interface BurnoutRiskAssessment {
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  score: number; // 0–100
  indicators: string[];
  suggestion: string;
}

export interface PeakProductivityWindow {
  startHour: number; // 0–23
  endHour: number;
  activityCount: number;
  confidence: number; // 0–100
  label: string; // e.g., "8 PM – 11 PM"
}

export interface RecoverySuggestion {
  id: string;
  title: string;
  description: string;
  actionType: 'solve_problem' | 'focus_session' | 'review_topic' | 'take_break';
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

export interface WeakTopicCluster {
  topic: string;
  solveRate: number;
  totalProblems: number;
  solvedCount: number;
  trendDirection: 'improving' | 'stagnant' | 'declining';
  suggestedDifficulty: string;
}

export interface MomentumIntelligence {
  momentumScore: MomentumScore;
  trends: ProductivityTrend[];
  consistencyForecast: ConsistencyForecast;
  burnoutRisk: BurnoutRiskAssessment;
  peakWindows: PeakProductivityWindow[];
  recoverySuggestions: RecoverySuggestion[];
  weakTopics: WeakTopicCluster[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class MomentumEngine {
  /**
   * Full momentum intelligence payload for a user.
   */
  async getFullIntelligence(userId: string): Promise<MomentumIntelligence> {
    const [
      momentumScore,
      trends,
      consistencyForecast,
      burnoutRisk,
      peakWindows,
      weakTopics,
    ] = await Promise.all([
      this.calculateMomentumScore(userId),
      this.getProductivityTrends(userId),
      this.predictConsistency(userId),
      this.detectBurnoutRisk(userId),
      this.findPeakWindows(userId),
      this.getWeakTopics(userId),
    ]);

    const recoverySuggestions = this.getRecoverySuggestions(
      momentumScore,
      burnoutRisk,
      weakTopics,
      consistencyForecast
    );

    return {
      momentumScore,
      trends,
      consistencyForecast,
      burnoutRisk,
      peakWindows,
      recoverySuggestions,
      weakTopics,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Momentum Score ─────────────────────────────────────────────────────

  async calculateMomentumScore(userId: string): Promise<MomentumScore> {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch parallel data
    const [
      recentActivities,
      prevActivities,
      analytics,
      recentEvents,
      focusSessions,
    ] = await Promise.all([
      DailyActivity.find({ userId: userObjId, date: { $gte: last7d } }).lean(),
      DailyActivity.find({ userId: userObjId, date: { $gte: last14d, $lt: last7d } }).lean(),
      UserAnalytics.findOne({ userId: userObjId }).lean(),
      ActivityEvent.find({ userId: userObjId, occurredAt: { $gte: last7d } }).lean(),
      ActivityEvent.find({
        userId: userObjId,
        type: 'focus_session',
        occurredAt: { $gte: last14d },
      }).lean(),
    ]);

    // 1. Activity Frequency (0–100): active days / 7 * 100
    const activeDays = recentActivities.filter(a => a.count > 0).length;
    const activityFrequency = Math.min(100, Math.round((activeDays / 7) * 100));

    // 2. XP Velocity (0–100): compare 7d XP to previous 7d
    const recentXp = recentActivities.reduce((s, a) => s + (a.count || 0), 0);
    const prevXp = prevActivities.reduce((s, a) => s + (a.count || 0), 0);
    const xpGrowth = prevXp > 0 ? ((recentXp - prevXp) / prevXp) : (recentXp > 0 ? 1 : 0);
    const xpVelocity = Math.min(100, Math.max(0, Math.round(50 + xpGrowth * 50)));

    // 3. Streak Health (0–100): current streak relative to best, penalized by risk
    const currentStreak = analytics?.currentStreak ?? 0;
    const bestStreak = analytics?.bestStreak ?? 1;
    const streakRatio = Math.min(1, currentStreak / Math.max(bestStreak, 7));
    const streakHealth = Math.round(streakRatio * 100);

    // 4. Focus Consistency (0–100): focus sessions in last 7d
    const recentFocus = focusSessions.filter(
      e => new Date(e.occurredAt).getTime() >= last7d.getTime()
    ).length;
    const focusConsistency = Math.min(100, Math.round((recentFocus / 5) * 100));

    // 5. Problem Diversity (0–100): variety of event types
    const eventTypes = new Set(recentEvents.map(e => e.type));
    const problemDiversity = Math.min(100, Math.round((eventTypes.size / 5) * 100));

    // Weighted overall score
    const weights = {
      activityFrequency: 0.30,
      xpVelocity: 0.25,
      streakHealth: 0.20,
      focusConsistency: 0.15,
      problemDiversity: 0.10,
    };

    const overall = Math.round(
      activityFrequency * weights.activityFrequency +
      xpVelocity * weights.xpVelocity +
      streakHealth * weights.streakHealth +
      focusConsistency * weights.focusConsistency +
      problemDiversity * weights.problemDiversity
    );

    // Determine trend
    let trend: MomentumScore['trend'];
    if (overall >= 80) trend = 'surging';
    else if (overall >= 60) trend = 'rising';
    else if (overall >= 40) trend = 'stable';
    else if (overall >= 20) trend = 'declining';
    else trend = 'critical';

    // Dynamic message
    const messages: Record<MomentumScore['trend'], string> = {
      surging: `You're on fire! Momentum score ${overall}/100 — keep this intensity going.`,
      rising: `Solid progress! Your momentum is building at ${overall}/100.`,
      stable: `Steady pace at ${overall}/100. Push a bit harder to accelerate.`,
      declining: `Momentum dropping to ${overall}/100. A quick session could turn this around.`,
      critical: `Momentum at ${overall}/100. Let's rebuild — start with something small today.`,
    };

    return {
      overall,
      breakdown: {
        activityFrequency,
        xpVelocity,
        streakHealth,
        focusConsistency,
        problemDiversity,
      },
      trend,
      message: messages[trend],
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  // ─── Productivity Trends ────────────────────────────────────────────────

  async getProductivityTrends(userId: string): Promise<ProductivityTrend[]> {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [recentActivities, prevActivities, recentEvents, prevEvents] = await Promise.all([
      DailyActivity.find({ userId: userObjId, date: { $gte: last7d } }).lean(),
      DailyActivity.find({ userId: userObjId, date: { $gte: prev7d, $lt: last7d } }).lean(),
      ActivityEvent.find({ userId: userObjId, occurredAt: { $gte: last7d } }).lean(),
      ActivityEvent.find({ userId: userObjId, occurredAt: { $gte: prev7d, $lt: last7d } }).lean(),
    ]);

    const buildTrend = (metric: string, current: number, previous: number): ProductivityTrend => {
      const changePercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0);
      const direction: 'up' | 'down' | 'flat' = changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'flat';
      return { metric, current, previous, changePercent, direction, period: '7d' };
    };

    const recentActivityCount = recentActivities.reduce((s, a) => s + a.count, 0);
    const prevActivityCount = prevActivities.reduce((s, a) => s + a.count, 0);

    const recentProblemsSolved = recentEvents.filter(e => e.type === 'problem_solved').length;
    const prevProblemsSolved = prevEvents.filter(e => e.type === 'problem_solved').length;

    const recentCommits = recentEvents.filter(e => e.type === 'commit_pushed').length;
    const prevCommits = prevEvents.filter(e => e.type === 'commit_pushed').length;

    const recentFocusSessions = recentEvents.filter(e => e.type === 'focus_session').length;
    const prevFocusSessions = prevEvents.filter(e => e.type === 'focus_session').length;

    const recentActiveDays = recentActivities.filter(a => a.count > 0).length;
    const prevActiveDays = prevActivities.filter(a => a.count > 0).length;

    return [
      buildTrend('Total Activity', recentActivityCount, prevActivityCount),
      buildTrend('Problems Solved', recentProblemsSolved, prevProblemsSolved),
      buildTrend('Commits', recentCommits, prevCommits),
      buildTrend('Focus Sessions', recentFocusSessions, prevFocusSessions),
      buildTrend('Active Days', recentActiveDays, prevActiveDays),
    ];
  }

  // ─── Consistency Forecasting ────────────────────────────────────────────

  async predictConsistency(userId: string): Promise<ConsistencyForecast> {
    const userObjId = new Types.ObjectId(userId);
    const analytics = await UserAnalytics.findOne({ userId: userObjId }).lean();
    const now = new Date();
    const last14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const activities = await DailyActivity.find({
      userId: userObjId,
      date: { $gte: last14d },
    }).sort({ date: -1 }).lean();

    const currentStreak = analytics?.currentStreak ?? 0;
    const bestStreak = analytics?.bestStreak ?? 0;

    // Calculate consistency ratio (active days / total days in last 14d)
    const activeDays14d = activities.filter(a => a.count > 0).length;
    const consistencyRatio = activeDays14d / 14;

    // Check recent gaps — how many gaps in last 7 days
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recent7dActivities = activities.filter(a => new Date(a.date) >= last7d);
    const activeDays7d = recent7dActivities.filter(a => a.count > 0).length;
    const recentGaps = 7 - activeDays7d;

    // Survival probability heuristic
    let probability = 50;

    // Boost for high consistency
    probability += consistencyRatio * 30;

    // Boost for current streak strength
    if (currentStreak >= 7) probability += 15;
    else if (currentStreak >= 3) probability += 8;

    // Penalty for recent gaps
    probability -= recentGaps * 8;

    // Penalty for waning activity
    if (activeDays7d < 3) probability -= 15;

    probability = Math.max(5, Math.min(95, Math.round(probability)));

    // Project streak days
    const projectedStreakDays = Math.round(currentStreak + (probability / 100) * 7);

    // Risk level
    let riskLevel: ConsistencyForecast['riskLevel'];
    if (probability >= 75) riskLevel = 'low';
    else if (probability >= 50) riskLevel = 'medium';
    else if (probability >= 25) riskLevel = 'high';
    else riskLevel = 'critical';

    // Factors
    const factors: string[] = [];
    if (currentStreak > 0) factors.push(`${currentStreak}-day active streak`);
    if (recentGaps > 2) factors.push(`${recentGaps} gap days in the last week`);
    if (consistencyRatio > 0.7) factors.push('Strong 14-day consistency');
    if (consistencyRatio < 0.4) factors.push('Low 14-day consistency');
    if (activeDays7d >= 5) factors.push('Active 5+ days this week');

    // Recommendation
    const recommendations: Record<ConsistencyForecast['riskLevel'], string> = {
      low: "You're in great shape. Keep showing up daily to build an unbreakable habit.",
      medium: 'You have a solid foundation. Try to reduce gap days this week.',
      high: 'Your consistency is wavering. Even a small daily action counts — solve one problem.',
      critical: 'Streak is at risk. Start small — a 15-minute focus session can restart your momentum.',
    };

    return {
      streakSurvivalProbability: probability,
      projectedStreakDays,
      riskLevel,
      factors,
      recommendation: recommendations[riskLevel],
    };
  }

  // ─── Burnout Risk Detection ─────────────────────────────────────────────

  async detectBurnoutRisk(userId: string): Promise<BurnoutRiskAssessment> {
    const userObjId = new Types.ObjectId(userId);
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [recentActivities, prevActivities] = await Promise.all([
      DailyActivity.find({ userId: userObjId, date: { $gte: last7d } }).lean(),
      DailyActivity.find({ userId: userObjId, date: { $gte: prev7d, $lt: last7d } }).lean(),
    ]);

    const recentTotal = recentActivities.reduce((s, a) => s + a.count, 0);
    const prevTotal = prevActivities.reduce((s, a) => s + a.count, 0);

    let score = 0;
    const indicators: string[] = [];

    // Indicator 1: Sharp decline after high activity
    if (prevTotal > 20 && recentTotal < prevTotal * 0.4) {
      score += 35;
      indicators.push('Sharp activity decline after high-intensity period');
    }

    // Indicator 2: Decreasing daily activity counts
    const dailyCounts = recentActivities
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(a => a.count);
    if (dailyCounts.length >= 3) {
      const isDecreasing = dailyCounts.slice(-3).every((v, i, arr) =>
        i === 0 || v <= arr[i - 1]
      );
      if (isDecreasing && dailyCounts[dailyCounts.length - 1] < dailyCounts[0] * 0.5) {
        score += 20;
        indicators.push('Consistently decreasing daily activity');
      }
    }

    // Indicator 3: Increased gap days
    const recentActiveDays = recentActivities.filter(a => a.count > 0).length;
    const prevActiveDays = prevActivities.filter(a => a.count > 0).length;
    if (prevActiveDays >= 5 && recentActiveDays <= 2) {
      score += 25;
      indicators.push('Active days dropped from ' + prevActiveDays + ' to ' + recentActiveDays);
    }

    // Indicator 4: No focus sessions recently
    const recentFocus = await ActivityEvent.countDocuments({
      userId: userObjId,
      type: 'focus_session',
      occurredAt: { $gte: last7d },
    });
    if (recentFocus === 0 && recentTotal > 0) {
      score += 10;
      indicators.push('No focus sessions in the last 7 days');
    }

    // Indicator 5: Very high activity (overwork)
    if (recentTotal > 50) {
      score += 15;
      indicators.push('Very high activity volume — potential overwork');
    }

    score = Math.min(100, score);

    let riskLevel: BurnoutRiskAssessment['riskLevel'];
    if (score >= 70) riskLevel = 'critical';
    else if (score >= 50) riskLevel = 'high';
    else if (score >= 30) riskLevel = 'moderate';
    else if (score >= 15) riskLevel = 'low';
    else riskLevel = 'none';

    const suggestions: Record<BurnoutRiskAssessment['riskLevel'], string> = {
      none: 'Your workload balance looks healthy. Keep it up!',
      low: 'Slight fatigue signals detected. Consider shorter sessions today.',
      moderate: 'Take a strategic break. Quality over quantity preserves long-term momentum.',
      high: 'Your patterns suggest fatigue. Scale back to 1–2 easy problems and a short focus session.',
      critical: 'Strong burnout signals detected. Rest today — your streak is safe with a freeze.',
    };

    return {
      riskLevel,
      score,
      indicators,
      suggestion: suggestions[riskLevel],
    };
  }

  // ─── Peak Productivity Windows ──────────────────────────────────────────

  async findPeakWindows(userId: string): Promise<PeakProductivityWindow[]> {
    const userObjId = new Types.ObjectId(userId);
    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await ActivityEvent.find({
      userId: userObjId,
      occurredAt: { $gte: last30d },
    }).select('occurredAt').lean();

    if (events.length < 5) {
      return [{
        startHour: 9,
        endHour: 12,
        activityCount: 0,
        confidence: 0,
        label: 'Not enough data yet',
      }];
    }

    // Bucket events by hour
    const hourBuckets = new Array(24).fill(0);
    for (const event of events) {
      const hour = new Date(event.occurredAt).getHours();
      hourBuckets[hour]++;
    }

    // Find top 2 contiguous windows (3-hour blocks)
    const windows: PeakProductivityWindow[] = [];
    const totalEvents = events.length;

    for (let i = 0; i < 24; i++) {
      const count = hourBuckets[i] + hourBuckets[(i + 1) % 24] + hourBuckets[(i + 2) % 24];
      if (count > 0) {
        windows.push({
          startHour: i,
          endHour: (i + 3) % 24,
          activityCount: count,
          confidence: Math.min(95, Math.round((count / totalEvents) * 100 * 3)),
          label: `${formatHour(i)} – ${formatHour((i + 3) % 24)}`,
        });
      }
    }

    // Sort by activity count, return top 2
    windows.sort((a, b) => b.activityCount - a.activityCount);

    // Deduplicate overlapping windows
    const result: PeakProductivityWindow[] = [];
    for (const w of windows) {
      const overlaps = result.some(r =>
        Math.abs(r.startHour - w.startHour) < 3
      );
      if (!overlaps) {
        result.push(w);
      }
      if (result.length >= 2) break;
    }

    return result.length > 0 ? result : [{
      startHour: 9,
      endHour: 12,
      activityCount: 0,
      confidence: 0,
      label: 'Not enough data yet',
    }];
  }

  // ─── Weak Topic Clustering ──────────────────────────────────────────────

  async getWeakTopics(userId: string): Promise<WeakTopicCluster[]> {
    const userObjId = new Types.ObjectId(userId);
    const topics = await DsaTopicProgress.find({ userId: userObjId }).lean();

    return topics
      .filter(t => t.totalProblems >= 3)
      .map(t => {
        const solveRate = Math.round((t.solvedCount / t.totalProblems) * 100);
        let trendDirection: WeakTopicCluster['trendDirection'] = 'stagnant';
        if (solveRate >= 70) trendDirection = 'improving';
        else if (solveRate < 40) trendDirection = 'declining';

        return {
          topic: t.topicName,
          solveRate,
          totalProblems: t.totalProblems,
          solvedCount: t.solvedCount,
          trendDirection,
          suggestedDifficulty: t.hardCount > t.mediumCount ? 'Medium' : 'Easy',
        };
      })
      .filter(t => t.solveRate < 70)
      .sort((a, b) => a.solveRate - b.solveRate)
      .slice(0, 5);
  }

  // ─── Recovery Suggestions ──────────────────────────────────────────────

  getRecoverySuggestions(
    momentum: MomentumScore,
    burnout: BurnoutRiskAssessment,
    weakTopics: WeakTopicCluster[],
    forecast: ConsistencyForecast
  ): RecoverySuggestion[] {
    const suggestions: RecoverySuggestion[] = [];

    // Momentum-based suggestions
    if (momentum.overall < 40) {
      suggestions.push({
        id: 'momentum_easy_problem',
        title: 'Warm up with an easy problem',
        description: 'Start small to rebuild momentum. An easy problem can kickstart your flow state.',
        actionType: 'solve_problem',
        priority: 'high',
        metadata: { difficulty: 'easy' },
      });
    }

    if (momentum.breakdown.focusConsistency < 30) {
      suggestions.push({
        id: 'momentum_short_focus',
        title: 'Try a 15-minute focus sprint',
        description: 'Short, intense focus sessions can rebuild your deep work habit.',
        actionType: 'focus_session',
        priority: 'medium',
        metadata: { duration: 15 },
      });
    }

    // Burnout-based suggestions
    if (burnout.riskLevel === 'high' || burnout.riskLevel === 'critical') {
      suggestions.push({
        id: 'burnout_break',
        title: 'Take a strategic break',
        description: 'Rest is productive. Step away for a few hours to recharge.',
        actionType: 'take_break',
        priority: 'high',
      });
    }

    // Weak topic suggestions
    if (weakTopics.length > 0) {
      const weakest = weakTopics[0];
      suggestions.push({
        id: `weak_topic_${weakest.topic}`,
        title: `Strengthen: ${weakest.topic}`,
        description: `Your solve rate in ${weakest.topic} is ${weakest.solveRate}%. Practice ${weakest.suggestedDifficulty} problems to improve.`,
        actionType: 'review_topic',
        priority: 'medium',
        metadata: { topic: weakest.topic, difficulty: weakest.suggestedDifficulty },
      });
    }

    // Consistency-based suggestions
    if (forecast.riskLevel === 'high' || forecast.riskLevel === 'critical') {
      suggestions.push({
        id: 'consistency_rescue',
        title: 'Protect your streak',
        description: forecast.recommendation,
        actionType: 'solve_problem',
        priority: 'high',
        metadata: { urgency: forecast.riskLevel },
      });
    }

    return suggestions.sort((a, b) => {
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    }).slice(0, 4);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const momentumEngine = new MomentumEngine();
