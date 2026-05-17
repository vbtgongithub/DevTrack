// src/modules/analytics/performanceValidation.service.ts — Real-World Performance Validation
// Phase-I: Real-World Performance Validation - Testing infrastructure for low-end devices, poor networks, and production reliability

import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface PerformanceMetrics {
  deviceType: 'high_end' | 'mid_range' | 'low_end';
  networkType: 'fast' | 'medium' | 'slow';
  loadTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  animationSmoothness: number; // 0-100
  realtimeLatency: number;
  hydrationConsistency: boolean;
}

export interface PerformanceTestResult {
  testId: string;
  timestamp: Date;
  metrics: PerformanceMetrics;
  passed: boolean;
  issues: string[];
  recommendations: string[];
}

export interface PerformanceReport {
  overallScore: number; // 0-100
  devicePerformance: {
    highEnd: number;
    midRange: number;
    lowEnd: number;
  };
  networkPerformance: {
    fast: number;
    medium: number;
    slow: number;
  };
  criticalIssues: string[];
  optimizationOpportunities: string[];
  productionReadiness: 'ready' | 'needs_improvement' | 'not_ready';
}

export const performanceValidation = {
  // ─── Record Performance Metrics ────────────────────────────────────────
  async recordMetrics(metrics: PerformanceMetrics): Promise<string> {
    const testId = `perf_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const result: PerformanceTestResult = {
      testId,
      timestamp: new Date(),
      metrics,
      passed: this.evaluatePerformance(metrics),
      issues: this.identifyIssues(metrics),
      recommendations: this.generateRecommendations(metrics),
    };

    // Store in Redis
    const redis = getRedisClient();
    await redis.setex(`perf_test:${testId}`, 86400 * 30, JSON.stringify(result));

    // Store in aggregated metrics
    const aggKey = `perf_agg:${metrics.deviceType}_${metrics.networkType}`;
    await redis.lpush(aggKey, JSON.stringify(metrics));
    await redis.ltrim(aggKey, 0, 999); // Keep last 1000
    await redis.expire(aggKey, 86400 * 7);

    logger.debug('[performance-validation] Metrics recorded', { testId, deviceType: metrics.deviceType });

    return testId;
  },

  // ─── Evaluate Performance ─────────────────────────────────────────────
  evaluatePerformance(metrics: PerformanceMetrics): boolean {
    // Thresholds based on device type and network
    const thresholds = this.getThresholds(metrics.deviceType, metrics.networkType);

    return (
      metrics.loadTime <= thresholds.loadTime &&
      metrics.firstContentfulPaint <= thresholds.firstContentfulPaint &&
      metrics.timeToInteractive <= thresholds.timeToInteractive &&
      metrics.cumulativeLayoutShift <= thresholds.cumulativeLayoutShift &&
      metrics.firstInputDelay <= thresholds.firstInputDelay &&
      metrics.animationSmoothness >= thresholds.animationSmoothness &&
      metrics.realtimeLatency <= thresholds.realtimeLatency &&
      metrics.hydrationConsistency
    );
  },

  // ─── Get Thresholds ───────────────────────────────────────────────────
  getThresholds(deviceType: string, networkType: string): {
    loadTime: number;
    firstContentfulPaint: number;
    timeToInteractive: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    animationSmoothness: number;
    realtimeLatency: number;
  } {
    const baseThresholds = {
      loadTime: 3000,
      firstContentfulPaint: 1500,
      timeToInteractive: 4000,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100,
      animationSmoothness: 60,
      realtimeLatency: 200,
    };

    // Adjust based on device type
    if (deviceType === 'low_end') {
      baseThresholds.loadTime *= 2;
      baseThresholds.firstContentfulPaint *= 2;
      baseThresholds.timeToInteractive *= 2;
      baseThresholds.animationSmoothness = 40;
    }

    // Adjust based on network type
    if (networkType === 'slow') {
      baseThresholds.loadTime *= 2;
      baseThresholds.firstContentfulPaint *= 2;
      baseThresholds.timeToInteractive *= 2;
      baseThresholds.realtimeLatency *= 3;
    }

    return baseThresholds;
  },

  // ─── Identify Issues ───────────────────────────────────────────────────
  identifyIssues(metrics: PerformanceMetrics): string[] {
    const issues: string[] = [];
    const thresholds = this.getThresholds(metrics.deviceType, metrics.networkType);

    if (metrics.loadTime > thresholds.loadTime) {
      issues.push(`Load time (${metrics.loadTime}ms) exceeds threshold (${thresholds.loadTime}ms)`);
    }
    if (metrics.firstContentfulPaint > thresholds.firstContentfulPaint) {
      issues.push(`First Contentful Paint (${metrics.firstContentfulPaint}ms) exceeds threshold (${thresholds.firstContentfulPaint}ms)`);
    }
    if (metrics.timeToInteractive > thresholds.timeToInteractive) {
      issues.push(`Time to Interactive (${metrics.timeToInteractive}ms) exceeds threshold (${thresholds.timeToInteractive}ms)`);
    }
    if (metrics.cumulativeLayoutShift > thresholds.cumulativeLayoutShift) {
      issues.push(`Cumulative Layout Shift (${metrics.cumulativeLayoutShift}) exceeds threshold (${thresholds.cumulativeLayoutShift})`);
    }
    if (metrics.firstInputDelay > thresholds.firstInputDelay) {
      issues.push(`First Input Delay (${metrics.firstInputDelay}ms) exceeds threshold (${thresholds.firstInputDelay}ms)`);
    }
    if (metrics.animationSmoothness < thresholds.animationSmoothness) {
      issues.push(`Animation smoothness (${metrics.animationSmoothness}%) below threshold (${thresholds.animationSmoothness}%)`);
    }
    if (metrics.realtimeLatency > thresholds.realtimeLatency) {
      issues.push(`Realtime latency (${metrics.realtimeLatency}ms) exceeds threshold (${thresholds.realtimeLatency}ms)`);
    }
    if (!metrics.hydrationConsistency) {
      issues.push('Hydration inconsistency detected');
    }

    return issues;
  },

  // ─── Generate Recommendations ─────────────────────────────────────────
  generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.loadTime > 2000) {
      recommendations.push('Optimize bundle size and implement code splitting');
    }
    if (metrics.firstContentfulPaint > 1500) {
      recommendations.push('Reduce render-blocking resources and optimize critical CSS');
    }
    if (metrics.timeToInteractive > 4000) {
      recommendations.push('Defer non-critical JavaScript and optimize main thread work');
    }
    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Reserve space for dynamic content to prevent layout shifts');
    }
    if (metrics.firstInputDelay > 100) {
      recommendations.push('Reduce JavaScript execution time and optimize event handlers');
    }
    if (metrics.animationSmoothness < 60) {
      recommendations.push('Optimize animations using CSS transforms and will-change property');
    }
    if (metrics.realtimeLatency > 200) {
      recommendations.push('Optimize SSE connection and implement message batching');
    }
    if (!metrics.hydrationConsistency) {
      recommendations.push('Implement consistent hydration patterns and reduce hydration mismatches');
    }

    if (metrics.deviceType === 'low_end') {
      recommendations.push('Implement progressive enhancement for low-end devices');
    }
    if (metrics.networkType === 'slow') {
      recommendations.push('Implement offline-first capabilities and optimistic UI updates');
    }

    return recommendations;
  },

  // ─── Generate Performance Report ───────────────────────────────────────
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const redis = getRedisClient();

    // Get aggregated metrics for each device/network combination
    const combinations = [
      { device: 'high_end', network: 'fast' },
      { device: 'high_end', network: 'medium' },
      { device: 'high_end', network: 'slow' },
      { device: 'mid_range', network: 'fast' },
      { device: 'mid_range', network: 'medium' },
      { device: 'mid_range', network: 'slow' },
      { device: 'low_end', network: 'fast' },
      { device: 'low_end', network: 'medium' },
      { device: 'low_end', network: 'slow' },
    ];

    const deviceScores = { highEnd: 0, midRange: 0, lowEnd: 0 };
    const networkScores = { fast: 0, medium: 0, slow: 0 };
    let totalScore = 0;
    let count = 0;

    for (const combo of combinations) {
      const aggKey = `perf_agg:${combo.device}_${combo.network}`;
      const metrics = await redis.lrange(aggKey, 0, -1);

      if (metrics.length > 0) {
        const parsedMetrics = metrics.map(m => JSON.parse(m));
        const avgScore = this.calculateAverageScore(parsedMetrics);

        // Aggregate by device
        if (combo.device === 'high_end') deviceScores.highEnd += avgScore;
        else if (combo.device === 'mid_range') deviceScores.midRange += avgScore;
        else deviceScores.lowEnd += avgScore;

        // Aggregate by network
        if (combo.network === 'fast') networkScores.fast += avgScore;
        else if (combo.network === 'medium') networkScores.medium += avgScore;
        else networkScores.slow += avgScore;

        totalScore += avgScore;
        count++;
      }
    }

    // Normalize scores
    if (count > 0) {
      deviceScores.highEnd /= 3; // 3 network types
      deviceScores.midRange /= 3;
      deviceScores.lowEnd /= 3;
      networkScores.fast /= 3; // 3 device types
      networkScores.medium /= 3;
      networkScores.slow /= 3;
    }

    const overallScore = count > 0 ? totalScore / count : 0;

    // Identify critical issues
    const criticalIssues = await this.identifyCriticalIssues();

    // Identify optimization opportunities
    const optimizationOpportunities = await this.identifyOptimizationOpportunities();

    // Determine production readiness
    let productionReadiness: 'ready' | 'needs_improvement' | 'not_ready';
    if (overallScore >= 80 && criticalIssues.length === 0) {
      productionReadiness = 'ready';
    } else if (overallScore >= 60) {
      productionReadiness = 'needs_improvement';
    } else {
      productionReadiness = 'not_ready';
    }

    return {
      overallScore,
      devicePerformance: deviceScores,
      networkPerformance: networkScores,
      criticalIssues,
      optimizationOpportunities,
      productionReadiness,
    };
  },

  // ─── Calculate Average Score ─────────────────────────────────────────
  calculateAverageScore(metricsArray: PerformanceMetrics[]): number {
    if (!metricsArray.length) return 0;

    let totalScore = 0;
    metricsArray.forEach(metrics => {
      const thresholds = this.getThresholds(metrics.deviceType, metrics.networkType);

      let score = 100;
      score -= Math.min(30, (metrics.loadTime / thresholds.loadTime - 1) * 30);
      score -= Math.min(20, (metrics.firstContentfulPaint / thresholds.firstContentfulPaint - 1) * 20);
      score -= Math.min(20, (metrics.timeToInteractive / thresholds.timeToInteractive - 1) * 20);
      score -= Math.min(10, (metrics.cumulativeLayoutShift / thresholds.cumulativeLayoutShift - 1) * 10);
      score -= Math.min(10, (metrics.firstInputDelay / thresholds.firstInputDelay - 1) * 10);
      score -= Math.min(10, (1 - metrics.animationSmoothness / 100) * 10);
      if (!metrics.hydrationConsistency) score -= 10;

      totalScore += Math.max(0, score);
    });

    return totalScore / metricsArray.length;
  },

  // ─── Identify Critical Issues ─────────────────────────────────────────
  async identifyCriticalIssues(): Promise<string[]> {
    const redis = getRedisClient();
    const criticalIssues: string[] = [];

    // Check for recent failures on low-end devices
    const lowEndSlowKey = 'perf_agg:low_end_slow';
    const lowEndSlowMetrics = await redis.lrange(lowEndSlowKey, 0, -1);

    if (lowEndSlowMetrics.length > 0) {
      const parsedMetrics = lowEndSlowMetrics.map(m => JSON.parse(m));
      const failures = parsedMetrics.filter(m => !this.evaluatePerformance(m));

      if (failures.length > parsedMetrics.length * 0.5) {
        criticalIssues.push('Critical: More than 50% of tests failing on low-end devices with slow networks');
      }
    }

    // Check for hydration consistency issues
    const allKeys = await redis.keys('perf_agg:*');
    let hydrationInconsistencies = 0;
    let totalTests = 0;

    for (const key of allKeys) {
      const metrics = await redis.lrange(key, 0, -1);
      metrics.forEach(m => {
        const parsed = JSON.parse(m);
        totalTests++;
        if (!parsed.hydrationConsistency) hydrationInconsistencies++;
      });
    }

    if (hydrationInconsistencies > totalTests * 0.3) {
      criticalIssues.push('Critical: High rate of hydration inconsistencies detected');
    }

    return criticalIssues;
  },

  // ─── Identify Optimization Opportunities ───────────────────────────────
  async identifyOptimizationOpportunities(): Promise<string[]> {
    const redis = getRedisClient();
    const opportunities: string[] = [];

    // Check for common patterns across all metrics
    const allKeys = await redis.keys('perf_agg:*');
    let avgLoadTime = 0;
    let avgFCP = 0;
    let avgTTI = 0;
    let count = 0;

    for (const key of allKeys) {
      const metrics = await redis.lrange(key, 0, -1);
      metrics.forEach(m => {
        const parsed = JSON.parse(m);
        avgLoadTime += parsed.loadTime;
        avgFCP += parsed.firstContentfulPaint;
        avgTTI += parsed.timeToInteractive;
        count++;
      });
    }

    if (count > 0) {
      avgLoadTime /= count;
      avgFCP /= count;
      avgTTI /= count;

      if (avgLoadTime > 3000) {
        opportunities.push('Optimize overall load time - implement lazy loading and code splitting');
      }
      if (avgFCP > 2000) {
        opportunities.push('Improve First Contentful Paint - optimize critical rendering path');
      }
      if (avgTTI > 5000) {
        opportunities.push('Reduce Time to Interactive - defer non-critical JavaScript');
      }
    }

    return opportunities;
  },

  // ─── Simulate Low-End Device Test ─────────────────────────────────────
  async simulateLowEndDeviceTest(): Promise<PerformanceTestResult> {
    // This would run actual tests on low-end device simulation
    // For now, return a placeholder result
    const metrics: PerformanceMetrics = {
      deviceType: 'low_end',
      networkType: 'slow',
      loadTime: 4500,
      firstContentfulPaint: 2800,
      timeToInteractive: 6500,
      cumulativeLayoutShift: 0.15,
      firstInputDelay: 150,
      animationSmoothness: 45,
      realtimeLatency: 350,
      hydrationConsistency: false,
    };

    const testId = await this.recordMetrics(metrics);
    const redis = getRedisClient();
    const resultData = await redis.get(`perf_test:${testId}`);

    return resultData ? JSON.parse(resultData) : {
      testId,
      timestamp: new Date(),
      metrics,
      passed: false,
      issues: ['Simulated test - not actual measurement'],
      recommendations: ['Run actual performance tests on low-end devices'],
    };
  },

  // ─── Test Network Resilience ───────────────────────────────────────────
  async testNetworkResilience(): Promise<{
    reconnectionSuccess: boolean;
    reconnectionTime: number;
    messageLossRate: number;
    recommendations: string[];
  }> {
    // This would test actual network resilience
    // For now, return placeholder results
    return {
      reconnectionSuccess: true,
      reconnectionTime: 1500,
      messageLossRate: 0.02,
      recommendations: [
        'Implement exponential backoff for reconnection',
        'Add message queue for offline scenarios',
        'Implement optimistic UI updates',
      ],
    };
  },
};

export default performanceValidation;
