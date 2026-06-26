import { getRedisClient } from '../../../shared/redis/index.js';
import { logger } from '../../../shared/logger.js';

export interface ProviderHealth {
  providerId: string;
  providerName: string;
  name?: string; // compatibility field
  status: 'healthy' | 'degraded' | 'down';
  lastSyncAt?: Date; // compatibility field
  syncLatencyMs?: number; // compatibility field
  confidenceScore?: number; // compatibility field
  errorCount?: number; // compatibility field
  
  lastCheck: Date;
  lastSuccess: Date | null;
  failureCount: number;
  lastFailure: Date | null;
  avgResponseTime: number;
  errorRate: number;
  degradedModeEnabled: boolean;
  degradedModeReason?: string;
}

export interface HealthCheckResult {
  providerId: string;
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}

const REGISTRY_KEY = 'provider_health_registry';
const PROVIDERS_CONFIG = new Map([
  ['github', { name: 'GitHub API', endpoint: 'https://api.github.com', timeout: 5000 }],
  ['leetcode', { name: 'LeetCode API', endpoint: 'https://leetcode.com', timeout: 5000 }],
  ['codeforces', { name: 'Codeforces API', endpoint: 'https://codeforces.com', timeout: 5000 }],
  ['codechef', { name: 'CodeChef API', endpoint: 'https://codechef.com', timeout: 5000 }],
]);

// Internal in-memory cache to support synchronous getters
const healthCache: Map<string, ProviderHealth> = new Map();

// Helper to populate default health structure
function createDefaultHealth(providerId: string): ProviderHealth {
  const config = PROVIDERS_CONFIG.get(providerId) || { name: providerId };
  return {
    providerId,
    providerName: config.name,
    name: config.name,
    status: 'healthy',
    lastSyncAt: new Date(),
    syncLatencyMs: 0,
    confidenceScore: 100,
    errorCount: 0,
    lastCheck: new Date(),
    lastSuccess: null,
    failureCount: 0,
    lastFailure: null,
    avgResponseTime: 0,
    errorRate: 0,
    degradedModeEnabled: false,
  };
}

export const ProviderHealthRegistry = {
  /**
   * Initialize provider health registry in Redis and cache
   */
  async initialize(): Promise<void> {
    try {
      const redis = getRedisClient();
      for (const [providerId, config] of PROVIDERS_CONFIG.entries()) {
        const exists = await redis.hexists(REGISTRY_KEY, providerId);
        if (!exists) {
          const defaultHealth = createDefaultHealth(providerId);
          await redis.hset(REGISTRY_KEY, providerId, JSON.stringify(defaultHealth));
          healthCache.set(providerId, defaultHealth);
        } else {
          const data = await redis.hget(REGISTRY_KEY, providerId);
          if (data) {
            const parsed = JSON.parse(data) as ProviderHealth;
            // Parse Date strings
            parsed.lastCheck = new Date(parsed.lastCheck);
            if (parsed.lastSuccess) parsed.lastSuccess = new Date(parsed.lastSuccess);
            if (parsed.lastFailure) parsed.lastFailure = new Date(parsed.lastFailure);
            if (parsed.lastSyncAt) parsed.lastSyncAt = new Date(parsed.lastSyncAt);
            healthCache.set(providerId, parsed);
          }
        }
      }
      logger.info('[ProviderHealthRegistry] Initialized Redis health registry with providers');
    } catch (err) {
      logger.warn('[ProviderHealthRegistry] Redis connection error during init, using memory defaults', { error: String(err) });
      // Fallback in-memory initialization
      for (const providerId of PROVIDERS_CONFIG.keys()) {
        healthCache.set(providerId, createDefaultHealth(providerId));
      }
    }
  },

  /**
   * Synchronously fetch provider health from in-memory cache
   */
  getHealthSync(providerId: string): ProviderHealth {
    let health = healthCache.get(providerId);
    if (!health) {
      health = createDefaultHealth(providerId);
      healthCache.set(providerId, health);
    }
    return health;
  },

  // Legacy async support
  async getHealth(providerId: string): Promise<ProviderHealth> {
    // Keep cache fresh
    try {
      const redis = getRedisClient();
      const data = await redis.hget(REGISTRY_KEY, providerId);
      if (data) {
        const parsed = JSON.parse(data) as ProviderHealth;
        parsed.lastCheck = new Date(parsed.lastCheck);
        if (parsed.lastSuccess) parsed.lastSuccess = new Date(parsed.lastSuccess);
        if (parsed.lastFailure) parsed.lastFailure = new Date(parsed.lastFailure);
        if (parsed.lastSyncAt) parsed.lastSyncAt = new Date(parsed.lastSyncAt);
        healthCache.set(providerId, parsed);
        return parsed;
      }
    } catch (err) {
      logger.debug('[ProviderHealthRegistry] Redis read failed in getHealth, using memory cache', { providerId, error: err instanceof Error ? err.message : String(err) });
    }
    return this.getHealthSync(providerId);
  },

  // Synchronous Getter
  getProviderHealth(providerId: string): ProviderHealth {
    return this.getHealthSync(providerId);
  },

  /**
   * Synchronously fetch all providers from in-memory cache
   */
  getAllProvidersSync(): ProviderHealth[] {
    if (healthCache.size === 0) {
      for (const providerId of PROVIDERS_CONFIG.keys()) {
        healthCache.set(providerId, createDefaultHealth(providerId));
      }
    }
    return Array.from(healthCache.values());
  },

  // Legacy async support
  async getAllProviders(): Promise<ProviderHealth[]> {
    try {
      const redis = getRedisClient();
      const data = await redis.hgetall(REGISTRY_KEY);
      for (const [id, val] of Object.entries(data)) {
        const parsed = JSON.parse(val) as ProviderHealth;
        parsed.lastCheck = new Date(parsed.lastCheck);
        if (parsed.lastSuccess) parsed.lastSuccess = new Date(parsed.lastSuccess);
        if (parsed.lastFailure) parsed.lastFailure = new Date(parsed.lastFailure);
        if (parsed.lastSyncAt) parsed.lastSyncAt = new Date(parsed.lastSyncAt);
        healthCache.set(id, parsed);
      }
    } catch (err) {
      logger.debug('[ProviderHealthRegistry] Redis read failed in getAllProviders, using memory cache', { error: err instanceof Error ? err.message : String(err) });
    }
    return this.getAllProvidersSync();
  },

  // Synchronous Getter
  getAllProviderHealth(): ProviderHealth[] {
    return this.getAllProvidersSync();
  },

  /**
   * Perform/simulate health check for a provider
   */
  async checkProviderHealth(providerId: string): Promise<HealthCheckResult> {
    const config = PROVIDERS_CONFIG.get(providerId);
    if (!config) {
      return {
        providerId,
        isHealthy: false,
        responseTime: 0,
        error: 'Provider not configured',
      };
    }

    const startTime = Date.now();
    let isHealthy = false;
    let error: string | undefined;

    try {
      // Simulate delay
      const delay = Math.random() * 200 + 50;
      await new Promise(resolve => setTimeout(resolve, delay));
      if (Math.random() < 0.02) {
        throw new Error('Provider timeout');
      }
      isHealthy = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown health check error';
      isHealthy = false;
    }

    const responseTime = Date.now() - startTime;
    await this.updateProviderHealth(providerId, isHealthy, responseTime, error);

    return {
      providerId,
      isHealthy,
      responseTime,
      error,
    };
  },

  /**
   * Update provider health status
   */
  async updateProviderHealth(
    providerId: string,
    isHealthy: boolean,
    responseTime: number,
    error?: string
  ): Promise<void> {
    const currentHealth = this.getHealthSync(providerId);
    const now = new Date();
    
    // Update EMA avgResponseTime
    const alpha = 0.3;
    currentHealth.avgResponseTime = alpha * responseTime + (1 - alpha) * currentHealth.avgResponseTime;

    if (isHealthy) {
      currentHealth.status = 'healthy';
      currentHealth.lastSuccess = now;
      currentHealth.lastSyncAt = now;
      currentHealth.syncLatencyMs = responseTime;
      currentHealth.failureCount = 0;
      currentHealth.lastFailure = null;
      currentHealth.errorCount = 0;
      currentHealth.confidenceScore = 100;
      currentHealth.errorRate = currentHealth.errorRate * 0.9;
      
      if (currentHealth.degradedModeEnabled && currentHealth.failureCount === 0) {
        currentHealth.degradedModeEnabled = false;
        currentHealth.degradedModeReason = undefined;
        logger.info('[ProviderHealthRegistry] Disabled degraded mode', { providerId });
      }
    } else {
      currentHealth.failureCount++;
      currentHealth.errorCount = (currentHealth.errorCount || 0) + 1;
      currentHealth.lastFailure = now;
      currentHealth.errorRate = Math.min(1, currentHealth.errorRate * 1.1 + 0.1);
      currentHealth.confidenceScore = Math.max(0, 100 - (currentHealth.errorCount * 25));

      if (currentHealth.failureCount >= 5 || currentHealth.errorRate > 0.5) {
        currentHealth.status = 'down';
      } else if (currentHealth.failureCount >= 3 || currentHealth.errorRate > 0.2) {
        currentHealth.status = 'degraded';
      }

      if (!currentHealth.degradedModeEnabled && currentHealth.status !== 'healthy') {
        currentHealth.degradedModeEnabled = true;
        currentHealth.degradedModeReason = error || 'High error rate';
        logger.warn('[ProviderHealthRegistry] Enabled degraded mode', { 
          providerId, 
          status: currentHealth.status,
          reason: currentHealth.degradedModeReason 
        });
      }
    }

    currentHealth.lastCheck = now;
    healthCache.set(providerId, currentHealth);

    try {
      const redis = getRedisClient();
      await redis.hset(REGISTRY_KEY, providerId, JSON.stringify(currentHealth));
    } catch (err) {
      logger.debug('[ProviderHealthRegistry] Redis write failed in updateProviderHealth', { providerId, error: err instanceof Error ? err.message : String(err) });
    }
  },

  /**
   * Compatibility methods for legacy workers
   */
  async recordSuccess(providerName: string, latencyMs: number): Promise<void> {
    await this.updateProviderHealth(providerName, true, latencyMs);
  },

  async recordFailure(providerName: string): Promise<void> {
    await this.updateProviderHealth(providerName, false, 500, 'Sync task failed');
  },

  /**
   * Synchronous Getter: Check if provider is in degraded mode
   */
  isProviderInDegradedMode(providerId: string): boolean {
    const health = this.getHealthSync(providerId);
    return health?.degradedModeEnabled || false;
  },

  /**
   * Synchronous Getter: Check if any provider is in degraded mode
   */
  isAnyProviderDegraded(): boolean {
    const all = this.getAllProvidersSync();
    return all.some(h => h.degradedModeEnabled);
  },

  /**
   * Synchronous Getter: Get degraded providers
   */
  getDegradedProviders(): ProviderHealth[] {
    const all = this.getAllProvidersSync();
    return all.filter(h => h.degradedModeEnabled);
  },

  /**
   * Manually enable degraded mode for a provider
   */
  async enableDegradedMode(providerId: string, reason: string): Promise<void> {
    const health = this.getHealthSync(providerId);
    health.degradedModeEnabled = true;
    health.degradedModeReason = reason;
    health.status = 'degraded';
    
    healthCache.set(providerId, health);
    try {
      const redis = getRedisClient();
      await redis.hset(REGISTRY_KEY, providerId, JSON.stringify(health));
    } catch (err) {
      logger.warn('[ProviderHealthRegistry] Redis write failed in enableDegradedMode', { providerId, error: err instanceof Error ? err.message : String(err) });
    }

    logger.warn('[ProviderHealthRegistry] Manually enabled degraded mode', { 
      providerId, 
      reason 
    });
  },

  /**
   * Manually disable degraded mode for a provider
   */
  async disableDegradedMode(providerId: string): Promise<void> {
    const health = this.getHealthSync(providerId);
    health.degradedModeEnabled = false;
    health.degradedModeReason = undefined;
    health.status = 'healthy';
    health.failureCount = 0;
    health.errorCount = 0;
    health.confidenceScore = 100;
    
    healthCache.set(providerId, health);
    try {
      const redis = getRedisClient();
      await redis.hset(REGISTRY_KEY, providerId, JSON.stringify(health));
    } catch (err) {
      logger.warn('[ProviderHealthRegistry] Redis write failed in disableDegradedMode', { providerId, error: err instanceof Error ? err.message : String(err) });
    }

    logger.info('[ProviderHealthRegistry] Manually disabled degraded mode', { providerId });
  },

  /**
   * Reset provider health status
   */
  async resetProviderHealth(providerId: string): Promise<void> {
    const config = PROVIDERS_CONFIG.get(providerId);
    if (!config) return;

    const defaultHealth = createDefaultHealth(providerId);
    healthCache.set(providerId, defaultHealth);

    try {
      const redis = getRedisClient();
      await redis.hset(REGISTRY_KEY, providerId, JSON.stringify(defaultHealth));
    } catch (err) {
      logger.warn('[ProviderHealthRegistry] Redis write failed in resetProviderHealth', { providerId, error: err instanceof Error ? err.message : String(err) });
    }

    logger.info('[ProviderHealthRegistry] Reset provider health', { providerId });
  },

  /**
   * Run health checks for all providers
   */
  async runAllHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    for (const providerId of PROVIDERS_CONFIG.keys()) {
      const result = await this.checkProviderHealth(providerId);
      results.push(result);
    }
    logger.info('[ProviderHealthRegistry] Completed all health checks');
    return results;
  },

  /**
   * Synchronous Getter: Get health summary
   */
  getHealthSummary(): {
    totalProviders: number;
    healthyCount: number;
    degradedCount: number;
    downCount: number;
    degradedModeCount: number;
  } {
    const allHealth = this.getAllProvidersSync();
    return {
      totalProviders: allHealth.length,
      healthyCount: allHealth.filter(h => h.status === 'healthy').length,
      degradedCount: allHealth.filter(h => h.status === 'degraded').length,
      downCount: allHealth.filter(h => h.status === 'down').length,
      degradedModeCount: allHealth.filter(h => h.degradedModeEnabled).length,
    };
  }
};

// Initialize registry on load
void ProviderHealthRegistry.initialize();

// Start a periodic background sync to pull latest statuses from Redis (every 10s)
setInterval(() => {
  void ProviderHealthRegistry.getAllProviders().catch((err) => {
    logger.debug('[ProviderHealthRegistry] Background sync failed', { error: err instanceof Error ? err.message : String(err) });
  });
}, 10000);
