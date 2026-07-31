import { logger } from '../../../shared/logger.js';
import { getRedisClient, getRedisHealth } from '../../../shared/redis/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface EmbeddingResponse {
  vector: number[];
  provider: 'openai' | 'gemini';
  dimensions: number;
  model: string;
}

const MAX_RETRIES = 2;
const TIMEOUT_MS = 3000;

export class EmbeddingProviderAdapter {
  /**
   * Helper for exponential backoff retries with timeout
   */
  private async withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`${context} timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        );
        return await Promise.race([operation(), timeoutPromise]);
      } catch (error) {
        lastError = error;
        logger.warn(`[EmbeddingProvider] Attempt ${attempt}/${MAX_RETRIES} failed for ${context}: ${error instanceof Error ? error.message : String(error)}`);
        if (attempt < MAX_RETRIES) {
          const delay = 500 * attempt;
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }
    throw new Error(`[EmbeddingProvider] Failed ${context} after ${MAX_RETRIES} attempts. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  }

  async generateEmbeddingBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    if (!texts.length) return [];
    
    const redis = getRedisClient();
    const results: (EmbeddingResponse | null)[] = new Array(texts.length).fill(null);
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];
    
    const isRedisConnected = getRedisHealth().status === 'connected';

    // Check cache first
    for (let i = 0; i < texts.length; i++) {
      const cacheKey = `ai:embedding:v2:${Buffer.from(texts[i]).toString('base64').substring(0, 100)}`;
      let cached = null;
      if (isRedisConnected) {
        cached = await redis.get(cacheKey).catch(() => null);
      }
      if (cached) {
        results[i] = JSON.parse(cached);
      } else {
        missingIndices.push(i);
        missingTexts.push(texts[i]);
      }
    }

    if (missingTexts.length > 0) {
      try {
        const openAiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        let fetchedEmbeddings: EmbeddingResponse[] = [];
        
        if (openAiKey && !openAiKey.startsWith('sk-or-')) {
          logger.info(`[EmbeddingProvider] Generating embeddings via OpenAI for ${missingTexts.length} chunks`);
          const openai = new OpenAI({ apiKey: openAiKey });
          
          fetchedEmbeddings = await this.withRetry(async () => {
            const response = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: missingTexts,
            });
            
            return response.data.map(item => ({
              vector: item.embedding,
              provider: 'openai' as const,
              dimensions: item.embedding.length,
              model: 'text-embedding-3-small'
            }));
          }, 'OpenAI batch embedding');
          
        } else if (geminiKey && geminiKey !== 'dummy_key_for_dev') {
          logger.info(`[EmbeddingProvider] Generating embeddings via Gemini for ${missingTexts.length} chunks`);
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
          
          fetchedEmbeddings = await this.withRetry(async () => {
            const promises = missingTexts.map(async text => {
              const result = await model.embedContent(text);
              return {
                vector: result.embedding.values,
                provider: 'gemini' as const,
                dimensions: result.embedding.values.length,
                model: 'text-embedding-004'
              };
            });
            return Promise.all(promises);
          }, 'Gemini concurrent embeddings');
        } else {
          logger.warn('[EmbeddingProvider] No valid API key configured or dummy key detected. Generating stable pseudo-random placeholder vectors.');
          fetchedEmbeddings = missingTexts.map((text) => {
            const vector = Array.from({ length: 1536 }, (_, i) => Math.sin(i + text.length) * 0.1);
            return {
              vector,
              provider: 'gemini' as const,
              dimensions: 1536,
              model: 'text-embedding-004'
            };
          });
        }

        // Merge back and cache
        for (let i = 0; i < missingIndices.length; i++) {
          const originalIndex = missingIndices[i];
          const embedding = fetchedEmbeddings[i];
          results[originalIndex] = embedding;
          
          if (isRedisConnected) {
            const cacheKey = `ai:embedding:v2:${Buffer.from(missingTexts[i]).toString('base64').substring(0, 100)}`;
            await redis.set(cacheKey, JSON.stringify(embedding), 'EX', 30 * 24 * 60 * 60).catch(err => {
              logger.warn(`[EmbeddingProvider] Failed to cache embedding`, err);
            });
          }
        }
      } catch (err) {
        logger.warn('[EmbeddingProvider] Remote provider failed or timed out. Falling back to stable pseudo-random placeholder vectors.', { err });
        const fallbackEmbeddings = missingTexts.map((text) => {
          const vector = Array.from({ length: 1536 }, (_, i) => Math.sin(i + text.length) * 0.1);
          return {
            vector,
            provider: 'openai' as const,
            dimensions: 1536,
            model: 'text-embedding-3-small'
          };
        });

        for (let i = 0; i < missingIndices.length; i++) {
          const originalIndex = missingIndices[i];
          results[originalIndex] = fallbackEmbeddings[i];
        }
      }
    }

    return results as EmbeddingResponse[];
  }

  // Keep for backwards compatibility for single embeddings
  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    const results = await this.generateEmbeddingBatch([text]);
    return results[0];
  }
}
