// src/modules/analytics/featureUsageAnalytics.service.ts — Feature Usage Analytics Service
// Phase-I: Feature Discovery + Usage Analytics - Tracks adoption, retention, and value scoring

import mongoose from 'mongoose';
import { FeatureUsageAnalytics, type IFeatureUsageAnalytics } from '../../db/models/featureUsageAnalytics.model.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface FeatureDiscoveryEvent {
  featureName: string;
  featureCategory: string;
  userId: string;
}

export interface FeatureUsageEvent {
  featureName: string;
  userId: string;
  timeSpent: number;
  completed: boolean;
}

const FEATURE_KEYS = {
  dailyUsage: (featureName: string, date: string) => `feature:usage:${featureName}:${date}`,
  discoveryBuffer: (featureName: string) => `feature:discovery:${featureName}`,
};

export const featureUsageAnalytics = {
  // ─── Feature Discovery Tracking ───────────────────────────────────────
  async trackDiscovery(event: FeatureDiscoveryEvent): Promise<void> {
    let analytics = await FeatureUsageAnalytics.findOne({ featureName: event.featureName });

    if (!analytics) {
      analytics = new FeatureUsageAnalytics({
        featureName: event.featureName,
        featureCategory: event.featureCategory,
        totalDiscoveries: 0,
        uniqueUsersDiscovered: 0,
        discoveryRate: 0,
        totalUses: 0,
        uniqueUsers: 0,
        averageUsagePerUser: 0,
        usageFrequency: 'rarely',
        firstUseRetention: 0,
        thirtyDayRetention: 0,
        repeatUsageRate: 0,
        averageTimeSpent: 0,
        completionRate: 0,
        errorRate: 0,
        satisfactionScore: 0,
        featureValueScore: 0,
        businessImpact: 'unknown',
        peakUsageTimes: [],
        userSegments: [],
        ignoreRate: 0,
        abandonmentRate: 0,
        correlatedFeatures: [],
      });
    }

    analytics.totalDiscoveries++;

    // Track unique users
    const redis = getRedisClient();
    const discoveryKey = FEATURE_KEYS.discoveryBuffer(event.featureName);
    const isNewUser = await redis.sadd(discoveryKey, event.userId);
    if (isNewUser === 1) {
      analytics.uniqueUsersDiscovered++;
    }
    await redis.expire(discoveryKey, 86400 * 30); // 30 days

    // Calculate discovery rate
    const totalUsers = await this.getTotalUserCount();
    analytics.discoveryRate = totalUsers > 0 ? (analytics.uniqueUsersDiscovered / totalUsers) * 100 : 0;

    analytics.lastUpdated = new Date();
    await analytics.save();

    logger.debug('[feature-usage] Discovery tracked', { featureName: event.featureName, userId: event.userId });
  },

  // ─── Feature Usage Tracking ───────────────────────────────────────────
  async trackUsage(event: FeatureUsageEvent): Promise<void> {
    let analytics = await FeatureUsageAnalytics.findOne({ featureName: event.featureName });

    if (!analytics) {
      logger.warn('[feature-usage] Feature not found for usage tracking', { featureName: event.featureName });
      return;
    }

    analytics.totalUses++;

    // Track unique users
    const redis = getRedisClient();
    const dailyKey = FEATURE_KEYS.dailyUsage(event.featureName, new Date().toISOString().split('T')[0]);
    const isNewUserToday = await redis.sadd(dailyKey, event.userId);
    if (isNewUserToday === 1) {
      analytics.uniqueUsers++;
    }
    await redis.expire(dailyKey, 86400 * 7); // 7 days

    // Update metrics
    analytics.averageUsagePerUser = analytics.uniqueUsers > 0 ? analytics.totalUses / analytics.uniqueUsers : 0;
    analytics.averageTimeSpent = analytics.totalUses > 0
      ? (analytics.averageTimeSpent * (analytics.totalUses - 1) + event.timeSpent) / analytics.totalUses
      : event.timeSpent;
    analytics.completionRate = analytics.totalUses > 0
      ? (analytics.completionRate * (analytics.totalUses - 1) + (event.completed ? 100 : 0)) / analytics.totalUses
      : (event.completed ? 100 : 0);

    // Update usage frequency
    await this.updateUsageFrequency(analytics);

    // Update peak usage times
    await this.updatePeakUsageTimes(analytics);

    // Calculate feature value score
    await this.calculateFeatureValueScore(analytics);

    analytics.lastUpdated = new Date();
    await analytics.save();

    logger.debug('[feature-usage] Usage tracked', { featureName: event.featureName, userId: event.userId });
  },

  // ─── Retention Tracking ───────────────────────────────────────────────
  async calculateRetention(featureName: string): Promise<void> {
    const analytics = await FeatureUsageAnalytics.findOne({ featureName });
    if (!analytics) return;

    // This would require querying user behavior over time
    // For now, placeholder implementation
    // In production, this would be calculated by a worker job

    logger.debug('[feature-usage] Retention calculated', { featureName });
  },

  // ─── Error Rate Tracking ───────────────────────────────────────────────
  async trackError(featureName: string): Promise<void> {
    const analytics = await FeatureUsageAnalytics.findOne({ featureName });
    if (!analytics) return;

    const totalEvents = analytics.totalUses;
    analytics.errorRate = totalEvents > 0 ? (analytics.errorRate * (totalEvents - 1) + 1) / totalEvents : 100;

    await analytics.save();
  },

  // ─── Satisfaction Tracking ────────────────────────────────────────────
  async trackSatisfaction(featureName: string, score: number): Promise<void> {
    const analytics = await FeatureUsageAnalytics.findOne({ featureName });
    if (!analytics) return;

    // Weighted average of satisfaction scores
    analytics.satisfactionScore = (analytics.satisfactionScore + score) / 2;

    await analytics.save();
  },

  // ─── Helper: Update Usage Frequency ───────────────────────────────────
  async updateUsageFrequency(analytics: IFeatureUsageAnalytics): Promise<void> {
    const redis = getRedisClient();
    const dailyKey = FEATURE_KEYS.dailyUsage(analytics.featureName, new Date().toISOString().split('T')[0]);
    const dailyUsers = await redis.scard(dailyKey);

    // Check usage over last 7 days
    let weeklyUsers = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = FEATURE_KEYS.dailyUsage(analytics.featureName, date.toISOString().split('T')[0]);
      weeklyUsers += await redis.scard(key);
    }

    const avgDailyUsers = weeklyUsers / 7;
    const ratio = analytics.uniqueUsers > 0 ? avgDailyUsers / analytics.uniqueUsers : 0;

    if (ratio > 0.5) {
      analytics.usageFrequency = 'daily';
    } else if (ratio > 0.2) {
      analytics.usageFrequency = 'weekly';
    } else if (ratio > 0.05) {
      analytics.usageFrequency = 'monthly';
    } else {
      analytics.usageFrequency = 'rarely';
    }
  },

  // ─── Helper: Update Peak Usage Times ─────────────────────────────────
  async updatePeakUsageTimes(analytics: IFeatureUsageAnalytics): Promise<void> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    const existing = analytics.peakUsageTimes.find(t => t.hour === hour && t.dayOfWeek === dayOfWeek);
    if (existing) {
      existing.usageCount++;
    } else {
      analytics.peakUsageTimes.push({ hour, dayOfWeek, usageCount: 1 });
    }

    // Keep only top 50 peak times
    analytics.peakUsageTimes.sort((a, b) => b.usageCount - a.usageCount);
    analytics.peakUsageTimes = analytics.peakUsageTimes.slice(0, 50);
  },

  // ─── Helper: Calculate Feature Value Score ────────────────────────────
  async calculateFeatureValueScore(analytics: IFeatureUsageAnalytics): Promise<void> {
    // Composite score based on multiple factors
    const discoveryScore = analytics.discoveryRate;
    const usageScore = Math.min(analytics.averageUsagePerUser * 10, 100);
    const retentionScore = (analytics.firstUseRetention + analytics.thirtyDayRetention) / 2;
    const satisfactionScore = analytics.satisfactionScore;
    const completionScore = analytics.completionRate;

    // Weighted average
    analytics.featureValueScore = (
      discoveryScore * 0.2 +
      usageScore * 0.25 +
      retentionScore * 0.25 +
      satisfactionScore * 0.15 +
      completionScore * 0.15
    );

    // Determine business impact
    if (analytics.featureValueScore >= 80) {
      analytics.businessImpact = 'critical';
    } else if (analytics.featureValueScore >= 60) {
      analytics.businessImpact = 'high';
    } else if (analytics.featureValueScore >= 40) {
      analytics.businessImpact = 'medium';
    } else if (analytics.featureValueScore >= 20) {
      analytics.businessImpact = 'low';
    } else {
      analytics.businessImpact = 'unknown';
    }
  },

  // ─── Helper: Get Total User Count ─────────────────────────────────────
  async getTotalUserCount(): Promise<number> {
    // This would query the User collection
    // For now, return a placeholder
    return 1000;
  },

  // ─── Analytics Queries ─────────────────────────────────────────────────
  async getFeatureAnalytics(featureName: string): Promise<IFeatureUsageAnalytics | null> {
    return FeatureUsageAnalytics.findOne({ featureName });
  },

  async getAllFeatures(): Promise<IFeatureUsageAnalytics[]> {
    return FeatureUsageAnalytics.find().sort({ featureValueScore: -1 });
  },

  async getLowValueFeatures(threshold: number = 30): Promise<IFeatureUsageAnalytics[]> {
    return FeatureUsageAnalytics.find({ featureValueScore: { $lt: threshold } }).sort({ featureValueScore: 1 });
  },

  async getHighValueFeatures(threshold: number = 70): Promise<IFeatureUsageAnalytics[]> {
    return FeatureUsageAnalytics.find({ featureValueScore: { $gte: threshold } }).sort({ featureValueScore: -1 });
  },

  async getIgnoredFeatures(threshold: number = 50): Promise<IFeatureUsageAnalytics[]> {
    return FeatureUsageAnalytics.find({ ignoreRate: { $gte: threshold } }).sort({ ignoreRate: -1 });
  },

  async getUsageReport(): Promise<{
    totalFeatures: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    unknownImpact: number;
    averageValueScore: number;
  }> {
    const features = await FeatureUsageAnalytics.find();

    const highImpact = features.filter(f => f.businessImpact === 'critical' || f.businessImpact === 'high').length;
    const mediumImpact = features.filter(f => f.businessImpact === 'medium').length;
    const lowImpact = features.filter(f => f.businessImpact === 'low').length;
    const unknownImpact = features.filter(f => f.businessImpact === 'unknown').length;

    const averageValueScore = features.length > 0
      ? features.reduce((sum, f) => sum + f.featureValueScore, 0) / features.length
      : 0;

    return {
      totalFeatures: features.length,
      highImpact,
      mediumImpact,
      lowImpact,
      unknownImpact,
      averageValueScore,
    };
  },
};

export default featureUsageAnalytics;
