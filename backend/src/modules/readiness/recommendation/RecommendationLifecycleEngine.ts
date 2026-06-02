import { logger } from '../../../shared/logger.js';

export interface LifecycleEvent {
  eventId: string;
  recommendationId: string;
  userId: string;
  eventType: 'generated' | 'accepted' | 'completed' | 'ignored' | 'decayed' | 'retired';
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface RecommendationLifecycle {
  recommendationId: string;
  userId: string;
  type: string;
  title: string;
  state: 'active' | 'accepted' | 'completed' | 'ignored' | 'decayed' | 'retired';
  generatedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  ignoredAt?: Date;
  decayedAt?: Date;
  retiredAt?: Date;
  effectivenessScore?: number; // 0-100
  timeToAccept?: number; // hours
  timeToComplete?: number; // hours
  viewCount: number;
  lifecycleEvents: LifecycleEvent[];
  currentDecay: number; // 0-100, higher = more decayed
}

export interface LifecycleMetrics {
  totalRecommendations: number;
  acceptanceRate: number;
  completionRate: number;
  averageTimeToAccept: number;
  averageTimeToComplete: number;
  averageEffectiveness: number;
  decayedCount: number;
  retiredCount: number;
  byType: Record<string, {
    total: number;
    accepted: number;
    completed: number;
    effectiveness: number;
  }>;
}

class RecommendationLifecycleEngineClass {
  private lifecycles: Map<string, RecommendationLifecycle> = new Map();
  private events: Map<string, LifecycleEvent> = new Map();
  private decayThreshold: number = 0.7; // 70% decay triggers retirement
  private maxAge: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Create new recommendation lifecycle
   */
  createLifecycle(
    recommendationId: string,
    userId: string,
    type: string,
    title: string
  ): RecommendationLifecycle {
    const lifecycle: RecommendationLifecycle = {
      recommendationId,
      userId,
      type,
      title,
      state: 'active',
      generatedAt: new Date(),
      viewCount: 0,
      lifecycleEvents: [],
      currentDecay: 0,
    };

    this.lifecycles.set(recommendationId, lifecycle);
    
    // Record generation event
    this.recordEvent(recommendationId, userId, 'generated', {});

    logger.info('[RecommendationLifecycleEngine] Lifecycle created', { 
      recommendationId, 
      userId, 
      type 
    });

    return lifecycle;
  }

  /**
   * Record lifecycle event
   */
  recordEvent(
    recommendationId: string,
    userId: string,
    eventType: LifecycleEvent['eventType'],
    metadata: Record<string, any> = {}
  ): LifecycleEvent {
    const lifecycle = this.lifecycles.get(recommendationId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found for recommendation: ${recommendationId}`);
    }

    const event: LifecycleEvent = {
      eventId: this.generateEventId(recommendationId, eventType),
      recommendationId,
      userId,
      eventType,
      timestamp: new Date(),
      metadata,
    };

    this.events.set(event.eventId, event);
    lifecycle.lifecycleEvents.push(event);

    // Update lifecycle state based on event
    this.updateLifecycleState(lifecycle, eventType);

    this.lifecycles.set(recommendationId, lifecycle);

    return event;
  }

  /**
   * Update lifecycle state based on event
   */
  private updateLifecycleState(lifecycle: RecommendationLifecycle, eventType: LifecycleEvent['eventType']): void {
    const now = new Date();

    switch (eventType) {
      case 'accepted':
        lifecycle.state = 'accepted';
        lifecycle.acceptedAt = now;
        lifecycle.timeToAccept = (now.getTime() - lifecycle.generatedAt.getTime()) / (1000 * 60 * 60);
        break;

      case 'completed':
        lifecycle.state = 'completed';
        lifecycle.completedAt = now;
        lifecycle.timeToComplete = lifecycle.acceptedAt
          ? (now.getTime() - lifecycle.acceptedAt.getTime()) / (1000 * 60 * 60)
          : (now.getTime() - lifecycle.generatedAt.getTime()) / (1000 * 60 * 60);
        break;

      case 'ignored':
        lifecycle.state = 'ignored';
        lifecycle.ignoredAt = now;
        break;

      case 'decayed':
        lifecycle.state = 'decayed';
        lifecycle.decayedAt = now;
        break;

      case 'retired':
        lifecycle.state = 'retired';
        lifecycle.retiredAt = now;
        break;
    }
  }

  /**
   * Increment view count
   */
  incrementViewCount(recommendationId: string): void {
    const lifecycle = this.lifecycles.get(recommendationId);
    if (!lifecycle) return;

    lifecycle.viewCount++;
    this.lifecycles.set(recommendationId, lifecycle);
  }

  /**
   * Set effectiveness score
   */
  setEffectivenessScore(recommendationId: string, score: number): void {
    const lifecycle = this.lifecycles.get(recommendationId);
    if (!lifecycle) return;

    lifecycle.effectivenessScore = Math.min(100, Math.max(0, score));
    this.lifecycles.set(recommendationId, lifecycle);

    logger.info('[RecommendationLifecycleEngine] Effectiveness score set', { 
      recommendationId, 
      score 
    });
  }

  /**
   * Calculate and update decay for all active recommendations
   */
  updateDecay(): void {
    const now = new Date();

    this.lifecycles.forEach((lifecycle, id) => {
      if (lifecycle.state !== 'active') return;

      // Calculate decay based on age and view count
      const ageInHours = (now.getTime() - lifecycle.generatedAt.getTime()) / (1000 * 60 * 60);
      const ageDecay = Math.min(1, ageInHours / (24 * 7)); // 1 week to full decay
      
      // View count reduces decay
      const viewReduction = Math.min(0.5, lifecycle.viewCount * 0.1);
      
      lifecycle.currentDecay = Math.max(0, ageDecay - viewReduction);

      // Check if decay threshold reached
      if (lifecycle.currentDecay >= this.decayThreshold) {
        this.recordEvent(id, lifecycle.userId, 'decayed', { decay: lifecycle.currentDecay });
      }

      // Check if max age reached
      if (ageInHours * 60 * 60 * 1000 > this.maxAge) {
        this.recordEvent(id, lifecycle.userId, 'retired', { age: ageInHours });
      }

      this.lifecycles.set(id, lifecycle);
    });
  }

  /**
   * Get lifecycle for a recommendation
   */
  getLifecycle(recommendationId: string): RecommendationLifecycle | undefined {
    return this.lifecycles.get(recommendationId);
  }

  /**
   * Get all lifecycles for a user
   */
  getUserLifecycles(userId: string): RecommendationLifecycle[] {
    return Array.from(this.lifecycles.values())
      .filter(l => l.userId === userId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  /**
   * Get active lifecycles for a user
   */
  getActiveLifecycles(userId: string): RecommendationLifecycle[] {
    return this.getUserLifecycles(userId).filter(l => l.state === 'active');
  }

  /**
   * Calculate lifecycle metrics
   */
  calculateMetrics(userId?: string): LifecycleMetrics {
    const lifecycles = userId
      ? this.getUserLifecycles(userId)
      : Array.from(this.lifecycles.values());

    const totalRecommendations = lifecycles.length;
    const acceptedCount = lifecycles.filter(l => l.state === 'accepted' || l.state === 'completed').length;
    const completedCount = lifecycles.filter(l => l.state === 'completed').length;
    const decayedCount = lifecycles.filter(l => l.state === 'decayed').length;
    const retiredCount = lifecycles.filter(l => l.state === 'retired').length;

    const acceptanceRate = totalRecommendations > 0 ? (acceptedCount / totalRecommendations) * 100 : 0;
    const completionRate = acceptedCount > 0 ? (completedCount / acceptedCount) * 100 : 0;

    const timeToAccept = lifecycles
      .filter(l => l.timeToAccept)
      .map(l => l.timeToAccept!);
    const averageTimeToAccept = timeToAccept.length > 0
      ? timeToAccept.reduce((sum, t) => sum + t, 0) / timeToAccept.length
      : 0;

    const timeToComplete = lifecycles
      .filter(l => l.timeToComplete)
      .map(l => l.timeToComplete!);
    const averageTimeToComplete = timeToComplete.length > 0
      ? timeToComplete.reduce((sum, t) => sum + t, 0) / timeToComplete.length
      : 0;

    const effectivenessScores = lifecycles
      .filter(l => l.effectivenessScore !== undefined)
      .map(l => l.effectivenessScore!);
    const averageEffectiveness = effectivenessScores.length > 0
      ? effectivenessScores.reduce((sum, s) => sum + s, 0) / effectivenessScores.length
      : 0;

    // Calculate metrics by type
    const byType: Record<string, { total: number; accepted: number; completed: number; effectiveness: number }> = {};
    lifecycles.forEach(l => {
      if (!byType[l.type]) {
        byType[l.type] = { total: 0, accepted: 0, completed: 0, effectiveness: 0 };
      }
      byType[l.type].total++;
      if (l.state === 'accepted' || l.state === 'completed') byType[l.type].accepted++;
      if (l.state === 'completed') byType[l.type].completed++;
      if (l.effectivenessScore !== undefined) {
        byType[l.type].effectiveness += l.effectivenessScore;
      }
    });

    // Calculate average effectiveness by type
    Object.keys(byType).forEach(type => {
      const completed = byType[type].completed;
      if (completed > 0) {
        byType[type].effectiveness = byType[type].effectiveness / completed;
      }
    });

    return {
      totalRecommendations,
      acceptanceRate: Math.round(acceptanceRate),
      completionRate: Math.round(completionRate),
      averageTimeToAccept: Math.round(averageTimeToAccept),
      averageTimeToComplete: Math.round(averageTimeToComplete),
      averageEffectiveness: Math.round(averageEffectiveness),
      decayedCount,
      retiredCount,
      byType,
    };
  }

  /**
   * Get lifecycle events for a recommendation
   */
  getLifecycleEvents(recommendationId: string): LifecycleEvent[] {
    const lifecycle = this.lifecycles.get(recommendationId);
    if (!lifecycle) return [];

    return lifecycle.lifecycleEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get recommendation effectiveness by type
   */
  getEffectivenessByType(userId: string, type: string): number {
    const userLifecycles = this.getUserLifecycles(userId);
    const typeLifecycles = userLifecycles.filter(l => l.type === type && l.state === 'completed');

    if (typeLifecycles.length === 0) return 50;

    const avgEffectiveness = typeLifecycles.reduce(
      (sum, l) => sum + (l.effectivenessScore || 50),
      0
    ) / typeLifecycles.length;

    return Math.round(avgEffectiveness);
  }

  /**
   * Clean up old lifecycles
   */
  cleanup(): number {
    const now = new Date();
    let cleanedCount = 0;

    this.lifecycles.forEach((lifecycle, id) => {
      // Remove retired lifecycles older than max age
      if (lifecycle.state === 'retired' && lifecycle.retiredAt) {
        const age = now.getTime() - lifecycle.retiredAt.getTime();
        if (age > this.maxAge * 2) {
          this.lifecycles.delete(id);
          cleanedCount++;
        }
      }

      // Remove completed lifecycles older than max age
      if (lifecycle.state === 'completed' && lifecycle.completedAt) {
        const age = now.getTime() - lifecycle.completedAt.getTime();
        if (age > this.maxAge * 2) {
          this.lifecycles.delete(id);
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      logger.info('[RecommendationLifecycleEngine] Cleaned up old lifecycles', { cleanedCount });
    }

    return cleanedCount;
  }

  /**
   * Generate event ID
   */
  private generateEventId(recommendationId: string, eventType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${recommendationId}-${eventType}-${timestamp}-${random}`;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.lifecycles.clear();
    this.events.clear();
    logger.info('[RecommendationLifecycleEngine] All data cleared');
  }
}

export const RecommendationLifecycleEngine = new RecommendationLifecycleEngineClass();
