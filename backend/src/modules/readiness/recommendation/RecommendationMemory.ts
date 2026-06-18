import { logger } from '../../../shared/logger.js';

export interface RecommendationMemoryEntry {
  recommendationId: string;
  userId: string;
  type: string;
  title: string;
  state: 'active' | 'completed' | 'ignored' | 'expired' | 'retired';
  generatedAt: Date;
  lastSeenAt: Date;
  completedAt?: Date;
  ignoredAt?: Date;
  expiresAt: Date;
  cooldownUntil?: Date;
  viewCount: number;
  effectivenessScore?: number; // 0-100, based on user feedback/completion
  age: number; // hours since generation
  priority: 'critical' | 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
}

export interface RecommendationHistory {
  userId: string;
  totalRecommendations: number;
  activeRecommendations: number;
  completedRecommendations: number;
  ignoredRecommendations: number;
  averageEffectiveness: number;
  averageTimeToComplete: number; // hours
  mostIgnoredTypes: string[];
  mostCompletedTypes: string[];
}

class RecommendationMemoryClass {
  private memory: Map<string, RecommendationMemoryEntry> = new Map();
  private history: Map<string, RecommendationHistory> = new Map();
  private cooldownPeriods: Map<string, number> = new Map(); // type -> hours
  private maxAge: number = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  constructor() {
    this.initializeCooldownPeriods();
  }

  /**
   * Initialize cooldown periods for different recommendation types
   */
  private initializeCooldownPeriods(): void {
    this.cooldownPeriods.set('dsa', 24); // 24 hours
    this.cooldownPeriods.set('skill', 48); // 48 hours
    this.cooldownPeriods.set('project', 72); // 72 hours
    this.cooldownPeriods.set('infrastructure', 48); // 48 hours
    this.cooldownPeriods.set('roadmap', 24); // 24 hours
  }

  /**
   * Add a recommendation to memory
   */
  addRecommendation(entry: Omit<RecommendationMemoryEntry, 'generatedAt' | 'lastSeenAt' | 'viewCount' | 'age'>): RecommendationMemoryEntry {
    const now = new Date();
    const memoryEntry: RecommendationMemoryEntry = {
      ...entry,
      generatedAt: now,
      lastSeenAt: now,
      viewCount: 0,
      age: 0,
    };

    this.memory.set(entry.recommendationId, memoryEntry);
    this.updateHistory(entry.userId);

    logger.info('[RecommendationMemory] Recommendation added', { 
      recommendationId: entry.recommendationId,
      userId: entry.userId,
      type: entry.type 
    });

    return memoryEntry;
  }

  /**
   * Get active recommendations for a user
   */
  getActiveRecommendations(userId: string): RecommendationMemoryEntry[] {
    const now = new Date();
    const userRecs = Array.from(this.memory.values()).filter(
      r => r.userId === userId && r.state === 'active'
    );

    // Filter out recommendations in cooldown
    const activeRecs = userRecs.filter(r => {
      if (r.cooldownUntil && r.cooldownUntil > now) {
        return false;
      }
      return true;
    });

    // Update last seen time and view count
    activeRecs.forEach(r => {
      r.lastSeenAt = now;
      r.viewCount++;
      this.memory.set(r.recommendationId, r);
    });

    return activeRecs;
  }

  /**
   * Check if a recommendation should be regenerated
   */
  shouldRegenerateRecommendation(userId: string, type: string, title: string): boolean {
    const now = new Date();
    const userRecs = Array.from(this.memory.values()).filter(
      r => r.userId === userId && r.type === type
    );

    // Check if similar recommendation exists and is in cooldown
    const similarRec = userRecs.find(r => 
      r.title.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(r.title.toLowerCase())
    );

    if (similarRec) {
      // If in cooldown, don't regenerate
      if (similarRec.cooldownUntil && similarRec.cooldownUntil > now) {
        return false;
      }

      // If recently generated (within cooldown period), don't regenerate
      const cooldownPeriod = this.cooldownPeriods.get(type) || 24;
      const hoursSinceGeneration = (now.getTime() - similarRec.generatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceGeneration < cooldownPeriod) {
        return false;
      }

      // If ignored recently, extend cooldown
      if (similarRec.state === 'ignored') {
        const hoursSinceIgnored = similarRec.ignoredAt 
          ? (now.getTime() - similarRec.ignoredAt.getTime()) / (1000 * 60 * 60)
          : Infinity;
        if (hoursSinceIgnored < cooldownPeriod * 2) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Mark recommendation as completed
   */
  markAsCompleted(recommendationId: string, effectivenessScore?: number): void {
    const entry = this.memory.get(recommendationId);
    if (!entry) return;

    entry.state = 'completed';
    entry.completedAt = new Date();
    entry.effectivenessScore = effectivenessScore;
    
    // Set cooldown to prevent immediate regeneration
    const cooldownPeriod = this.cooldownPeriods.get(entry.type) || 24;
    entry.cooldownUntil = new Date(Date.now() + cooldownPeriod * 60 * 60 * 1000);

    this.memory.set(recommendationId, entry);
    this.updateHistory(entry.userId);

    logger.info('[RecommendationMemory] Recommendation marked as completed', { 
      recommendationId,
      effectivenessScore 
    });
  }

  /**
   * Mark recommendation as ignored
   */
  markAsIgnored(recommendationId: string): void {
    const entry = this.memory.get(recommendationId);
    if (!entry) return;

    entry.state = 'ignored';
    entry.ignoredAt = new Date();
    
    // Set extended cooldown for ignored recommendations
    const cooldownPeriod = this.cooldownPeriods.get(entry.type) || 24;
    entry.cooldownUntil = new Date(Date.now() + cooldownPeriod * 2 * 60 * 60 * 1000);

    this.memory.set(recommendationId, entry);
    this.updateHistory(entry.userId);

    logger.info('[RecommendationMemory] Recommendation marked as ignored', { recommendationId });
  }

  /**
   * Update recommendation age
   */
  updateAges(): void {
    const now = new Date();
    
    this.memory.forEach((entry, id) => {
      const ageInHours = (now.getTime() - entry.generatedAt.getTime()) / (1000 * 60 * 60);
      entry.age = ageInHours;

      // Expire old recommendations
      if (ageInHours * 60 * 60 * 1000 > this.maxAge) {
        entry.state = 'expired';
      }

      this.memory.set(id, entry);
    });
  }

  /**
   * Get recommendation history for a user
   */
  getHistory(userId: string): RecommendationHistory | undefined {
    return this.history.get(userId);
  }

  /**
   * Update user history
   */
  private updateHistory(userId: string): void {
    const userRecs = Array.from(this.memory.values()).filter(r => r.userId === userId);
    
    const activeCount = userRecs.filter(r => r.state === 'active').length;
    const completedCount = userRecs.filter(r => r.state === 'completed').length;
    const ignoredCount = userRecs.filter(r => r.state === 'ignored').length;
    
    const completedRecs = userRecs.filter(r => r.state === 'completed' && r.completedAt);
    const avgEffectiveness = completedRecs.length > 0
      ? completedRecs.reduce((sum, r) => sum + (r.effectivenessScore || 0), 0) / completedRecs.length
      : 0;
    
    const avgTimeToComplete = completedRecs.length > 0
      ? completedRecs.reduce((sum, r) => {
          if (r.completedAt) {
            return sum + (r.completedAt.getTime() - r.generatedAt.getTime()) / (1000 * 60 * 60);
          }
          return sum;
        }, 0) / completedRecs.length
      : 0;

    // Calculate most ignored/completed types
    const typeCounts: Record<string, { completed: number; ignored: number }> = {};
    userRecs.forEach(r => {
      if (!typeCounts[r.type]) {
        typeCounts[r.type] = { completed: 0, ignored: 0 };
      }
      if (r.state === 'completed') typeCounts[r.type].completed++;
      if (r.state === 'ignored') typeCounts[r.type].ignored++;
    });

    const mostIgnoredTypes = Object.entries(typeCounts)
      .filter(([_, counts]) => counts.ignored > 0)
      .sort((a, b) => b[1].ignored - a[1].ignored)
      .slice(0, 3)
      .map(([type]) => type);

    const mostCompletedTypes = Object.entries(typeCounts)
      .filter(([_, counts]) => counts.completed > 0)
      .sort((a, b) => b[1].completed - a[1].completed)
      .slice(0, 3)
      .map(([type]) => type);

    const history: RecommendationHistory = {
      userId,
      totalRecommendations: userRecs.length,
      activeRecommendations: activeCount,
      completedRecommendations: completedCount,
      ignoredRecommendations: ignoredCount,
      averageEffectiveness: Math.round(avgEffectiveness),
      averageTimeToComplete: Math.round(avgTimeToComplete),
      mostIgnoredTypes,
      mostCompletedTypes,
    };

    this.history.set(userId, history);
  }

  /**
   * Clean up old/expired recommendations
   */
  cleanup(): number {
    const now = new Date();
    let cleanedCount = 0;

    this.memory.forEach((entry, id) => {
      // Remove expired recommendations older than max age
      if (entry.state === 'expired' && entry.age * 60 * 60 * 1000 > this.maxAge) {
        this.memory.delete(id);
        cleanedCount++;
      }

      // Remove completed recommendations that are very old
      if (entry.state === 'completed' && entry.age * 60 * 60 * 1000 > this.maxAge * 2) {
        this.memory.delete(id);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      logger.info('[RecommendationMemory] Cleaned up old recommendations', { cleanedCount });
    }

    return cleanedCount;
  }

  /**
   * Get recommendation effectiveness by type
   */
  getEffectivenessByType(userId: string, type: string): number {
    const userRecs = Array.from(this.memory.values()).filter(
      r => r.userId === userId && r.type === type && r.state === 'completed'
    );

    if (userRecs.length === 0) return 50; // Default effectiveness

    const avgEffectiveness = userRecs.reduce(
      (sum, r) => sum + (r.effectivenessScore || 50),
      0
    ) / userRecs.length;

    return Math.round(avgEffectiveness);
  }

  /**
   * Get recommendation statistics
   */
  getStats(): {
    totalRecommendations: number;
    activeRecommendations: number;
    completedRecommendations: number;
    ignoredRecommendations: number;
    expiredRecommendations: number;
    averageViewCount: number;
    averageAge: number;
  } {
    const allRecs = Array.from(this.memory.values());
    
    const activeCount = allRecs.filter(r => r.state === 'active').length;
    const completedCount = allRecs.filter(r => r.state === 'completed').length;
    const ignoredCount = allRecs.filter(r => r.state === 'ignored').length;
    const expiredCount = allRecs.filter(r => r.state === 'expired').length;
    
    const avgViewCount = allRecs.length > 0
      ? allRecs.reduce((sum, r) => sum + r.viewCount, 0) / allRecs.length
      : 0;
    
    const avgAge = allRecs.length > 0
      ? allRecs.reduce((sum, r) => sum + r.age, 0) / allRecs.length
      : 0;

    return {
      totalRecommendations: allRecs.length,
      activeRecommendations: activeCount,
      completedRecommendations: completedCount,
      ignoredRecommendations: ignoredCount,
      expiredRecommendations: expiredCount,
      averageViewCount: Math.round(avgViewCount),
      averageAge: Math.round(avgAge),
    };
  }

  /**
   * Clear all memory (for testing)
   */
  clear(): void {
    this.memory.clear();
    this.history.clear();
    logger.info('[RecommendationMemory] Memory cleared');
  }
}

export const RecommendationMemory = new RecommendationMemoryClass();
