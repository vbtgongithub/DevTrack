import { logger } from '../../../shared/logger.js';
import { getRedisClient } from '../../../shared/redis/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'openai' | 'gemini';
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  providerPreference?: AIProvider;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  tokensUsed: number;
  latency: number;
  cached: boolean;
  fallbackTriggered: boolean;
}

export interface ProviderHealth {
  provider: AIProvider;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  lastSuccess: Date | null;
  failureCount: number;
  avgLatency: number;
  rateLimitRemaining: number;
}

export interface TokenUsage {
  provider: AIProvider;
  model: string;
  tokens: number;
  timestamp: Date;
}

class AIProviderAdapterClass {
  private providerHealth: Map<AIProvider, ProviderHealth> = new Map();
  private tokenUsage: TokenUsage[] = [];
  private currentProvider: AIProvider = 'openai';
  private fallbackChain: AIProvider[] = ['openai', 'gemini'];  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms
  private cacheTTL: number = 60 * 60 * 1000; // 1 hour for general AI responses

  constructor() {
    this.initializeProviderHealth();
  }

  /**
   * Initialize provider health tracking
   */
  private initializeProviderHealth(): void {
    const now = new Date();
    
    this.providerHealth.set('openai', {
      provider: 'openai',
      status: 'healthy',
      lastCheck: now,
      lastSuccess: null,
      failureCount: 0,
      avgLatency: 0,
      rateLimitRemaining: 100000,
    });
    
    this.providerHealth.set('gemini', {
      provider: 'gemini',
      status: 'healthy',
      lastCheck: now,
      lastSuccess: null,
      failureCount: 0,
      avgLatency: 0,
      rateLimitRemaining: 100000,
    });  }

  /**
   * Generate AI response with provider abstraction
   */
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      logger.info('[AIProviderAdapter] Returning cached response', { provider: cached.provider });
      return cached;
    }

    const startTime = Date.now();
    let lastError: Error | null = null;
    let fallbackTriggered = false;

    // Build the chain with preference if provided
    let chain = [...this.fallbackChain];
    if (request.providerPreference) {
      chain = [request.providerPreference, ...chain.filter(p => p !== request.providerPreference)];
    }

    // Try providers in fallback chain
    for (const provider of chain) {
      const health = this.providerHealth.get(provider);
      if (!health || health.status === 'down') {
        continue;
      }

      try {
        const response = await this.generateWithRetry(provider, request);
        const latency = Date.now() - startTime;
        
        // Update provider health on success
        this.updateProviderHealth(provider, true, latency);
        
        // Track token usage
        this.trackTokenUsage(provider, response.model, response.tokensUsed);
        
        // Cache response
        await this.setCache(cacheKey, { ...response, latency, cached: true, fallbackTriggered });
        
        logger.info('[AIProviderAdapter] Response generated', { 
          provider, 
          model: response.model,
          latency,
          fallbackTriggered 
        });
        
        return { ...response, latency, cached: false, fallbackTriggered };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error('[AIProviderAdapter] Provider failed', { provider, error });
        
        // Update provider health on failure
        this.updateProviderHealth(provider, false, 0);
        
        // Mark fallback as triggered if not the last provider
        if (provider !== chain[chain.length - 1]) {
          fallbackTriggered = true;
        }
      }
    }

    // All providers failed
    logger.error('[AIProviderAdapter] All providers failed', { error: lastError?.message });
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Generate with retry logic
   */
  private async generateWithRetry(provider: AIProvider, request: AIRequest): Promise<Omit<AIResponse, 'latency' | 'cached' | 'fallbackTriggered'>> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.callProvider(provider, request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt;
          logger.info('[AIProviderAdapter] Retrying', { provider, attempt, delay });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Unknown error in generateWithRetry');
  }

  /**
   * Call specific provider
   */
  private async callProvider(provider: AIProvider, request: AIRequest): Promise<Omit<AIResponse, 'latency' | 'cached' | 'fallbackTriggered'>> {
    switch (provider) {
      case 'openai':
        return this.callOpenAI(request);
      case 'gemini':
        return this.callGemini(request);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(request: AIRequest): Promise<Omit<AIResponse, 'latency' | 'cached' | 'fallbackTriggered'>> {
    const model = request.model || 'gpt-4o-mini';
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey.startsWith('sk-or-')) {
      throw new Error('OPENAI_API_KEY is not set or is an OpenRouter key. AI services require valid configuration.');
    }

    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API Error: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || this.estimateTokens(request.prompt + content);
    
    return {
      content,
      model,
      provider: 'openai',
      tokensUsed,
    };
  }

  /**
   * Call Gemini API
   */
  private async callGemini(request: AIRequest): Promise<Omit<AIResponse, 'latency' | 'cached' | 'fallbackTriggered'>> {
    const modelName = request.model || 'gemini-1.5-flash';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'dummy_key_for_dev') {
      throw new Error('GEMINI_API_KEY is not set or is dummy. AI services require valid configuration.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: request.systemPrompt ? { parts: [{ text: request.systemPrompt }], role: 'system' } : undefined
    });

    const generationConfig = {
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.maxTokens ?? 1000,
      responseMimeType: "application/json",
    };

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig
      });

      const content = result.response.text();
      const tokensUsed = result.response.usageMetadata?.totalTokenCount || this.estimateTokens(request.prompt + content);
      
      return {
        content,
        model: modelName,
        provider: 'gemini',
        tokensUsed,
      };
    } catch (err: any) {
      throw new Error(`Gemini API Error: ${err.message}`);
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Update provider health
   */
  private updateProviderHealth(provider: AIProvider, success: boolean, latency: number): void {
    const health = this.providerHealth.get(provider);
    if (!health) return;

    health.lastCheck = new Date();
    
    if (success) {
      health.lastSuccess = new Date();
      health.failureCount = 0;
      health.status = 'healthy';
      
      // Update average latency
      health.avgLatency = (health.avgLatency * 0.9) + (latency * 0.1);
    } else {
      health.failureCount++;
      health.lastSuccess = null;
      
      if (health.failureCount >= 5) {
        health.status = 'down';
      } else if (health.failureCount >= 3) {
        health.status = 'degraded';
      }
    }

    this.providerHealth.set(provider, health);
  }

  /**
   * Track token usage
   */
  private trackTokenUsage(provider: AIProvider, model: string, tokens: number): void {
    const usage: TokenUsage = {
      provider,
      model,
      tokens,
      timestamp: new Date(),
    };

    this.tokenUsage.push(usage);
    
    // Keep only last 1000 entries
    if (this.tokenUsage.length > 1000) {
      this.tokenUsage = this.tokenUsage.slice(-1000);
    }
  }

  /**
   * Get provider health
   */
  getProviderHealth(provider: AIProvider): ProviderHealth | undefined {
    return this.providerHealth.get(provider);
  }

  /**
   * Get all provider health
   */
  getAllProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerHealth.values());
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Set current provider
   */
  setCurrentProvider(provider: AIProvider): void {
    this.currentProvider = provider;
    logger.info('[AIProviderAdapter] Current provider changed', { provider });
  }

  /**
   * Get token usage statistics
   */
  getTokenUsageStats(): {
    totalTokens: number;
    byProvider: Record<string, number>;
    byModel: Record<string, number>;
  } {
    const totalTokens = this.tokenUsage.reduce((sum, u) => sum + u.tokens, 0);
    
    const byProvider: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    
    this.tokenUsage.forEach(usage => {
      byProvider[usage.provider] = (byProvider[usage.provider] || 0) + usage.tokens;
      byModel[usage.model] = (byModel[usage.model] || 0) + usage.tokens;
    });
    
    return {
      totalTokens,
      byProvider,
      byModel,
    };
  }

  /**
   * Cache operations
   */
  private generateCacheKey(request: AIRequest): string {
    const key = `${request.prompt}-${request.systemPrompt || ''}-${request.temperature || 0}-${request.maxTokens || 1000}`;
    return Buffer.from(key).toString('base64');
  }

  private async getFromCache(key: string): Promise<AIResponse | null> {
    try {
      const redis = getRedisClient();
      if (redis.status !== 'ready') {
        logger.warn('[AIProviderAdapter] Redis not ready, skipping cache get');
        return null;
      }
      const cached = await redis.get(`ai:cache:${key}`);
      if (!cached) return null;
      return JSON.parse(cached) as AIResponse;
    } catch (err) {
      logger.warn('[AIProviderAdapter] Redis cache get failed', { err });
      return null;
    }
  }

  private async setCache(key: string, response: AIResponse): Promise<void> {
    try {
      const redis = getRedisClient();
      if (redis.status !== 'ready') {
        return;
      }
      await redis.set(`ai:cache:${key}`, JSON.stringify(response), 'EX', Math.floor(this.cacheTTL / 1000));
    } catch (err) {
      logger.warn('[AIProviderAdapter] Redis cache set failed', { err });
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    try {
      const redis = getRedisClient();
      if (redis.status !== 'ready') {
        return;
      }
      const keys = await redis.keys('ai:cache:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      logger.info('[AIProviderAdapter] Cache cleared');
    } catch (err) {
      logger.warn('[AIProviderAdapter] Redis cache clear failed', { err });
    }
  }

  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    await this.clearCache();
    this.tokenUsage = [];
    this.initializeProviderHealth();
    logger.info('[AIProviderAdapter] All data cleared');
  }
}

export const AIProviderAdapter = new AIProviderAdapterClass();
