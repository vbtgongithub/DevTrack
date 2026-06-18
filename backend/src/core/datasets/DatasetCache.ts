// src/core/datasets/DatasetCache.ts
// Memory-efficient LRU cache with Time-To-Live (TTL) support for datasets & heavy embeddings.

import { logger } from '../../shared/logger.js';
import { LRUCacheConfig } from './types.js';

interface CacheEntry<T> {
  value: T;
  expiry: number; // timestamp in ms
  lastAccessed: number; // timestamp in ms
}

export class DatasetCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTtl: number;

  constructor(config: LRUCacheConfig = {}) {
    this.maxSize = config.maxSize || 1000; // default 1000 items
    this.defaultTtl = config.ttl || 1000 * 60 * 30; // default 30 minutes TTL
    logger.info(`[DatasetCache] Initialized with maxSize: ${this.maxSize}, defaultTtl: ${this.defaultTtl}ms`);
  }

  /**
   * Retrieve a value from the cache. Returns null if missing or expired.
   */
  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.expiry < now) {
      // Item expired
      this.cache.delete(key);
      logger.debug(`[DatasetCache] Cache expired for key: ${key}`);
      return null;
    }

    // Update last accessed time (for LRU tracking)
    entry.lastAccessed = now;
    return entry.value;
  }

  /**
   * Save a value to the cache. Evicts LRU item if cache size exceeds limit.
   */
  public set(key: string, value: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl !== undefined ? customTtl : this.defaultTtl;
    const expiry = now + ttl;

    // If cache is at capacity, perform LRU eviction
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiry,
      lastAccessed: now,
    });
  }

  /**
   * Remove a specific key from the cache.
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear the entire cache.
   */
  public clear(): void {
    this.cache.clear();
    logger.info('[DatasetCache] Cache cleared');
  }

  /**
   * Returns current cache size.
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Evict the least recently used or expired cache item
   */
  private evictLRU(): void {
    const now = Date.now();
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Proactively clean up expired items
      if (entry.expiry < now) {
        this.cache.delete(key);
        logger.debug(`[DatasetCache] Evicted expired item: ${key}`);
        continue;
      }

      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    // If we proactively cleaned up expired items and brought the size below capacity, return
    if (this.cache.size < this.maxSize) {
      return;
    }

    // Otherwise, delete the LRU key
    if (lruKey) {
      this.cache.delete(lruKey);
      logger.info(`[DatasetCache] LRU Evicted item: ${lruKey} (accessed: ${new Date(lruTime).toISOString()})`);
    }
  }
}
