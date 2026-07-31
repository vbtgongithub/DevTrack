import { Embedding } from '../../../db/models/embedding.model.js';
import { logger } from '../../../shared/logger.js';
import { createHash } from 'crypto';

export class EmbeddingPersistenceLayer {
  /**
   * Save embedding to MongoDB with metadata
   */
  async saveEmbedding(
    sessionId: string,
    chunkIndex: number,
    vector: number[],
    provider: 'openai' | 'gemini',
    providerModel: string,
    content: string,
    contentType: 'resume' | 'project' | 'skill' | 'other' = 'resume',
    userId?: string,
    contentId?: string
  ): Promise<void> {
    const contentHash = this.generateContentHash(content);
    const embeddingVersion = '1.0.0';

    const updateFields: Record<string, any> = {
      sessionId,
      chunkIndex,
      vector,
      dimensions: vector.length,
      provider,
      providerModel,
      content,
      contentType,
      embeddingVersion,
      generatedAt: new Date(),
    };
    if (userId) updateFields.userId = userId;
    if (contentId) updateFields.contentId = contentId;

    try {
      await Embedding.findOneAndUpdate(
        { contentHash },
        {
          $set: updateFields,
          $inc: { accessCount: 1 },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      logger.info(`[EmbeddingPersistence] Saved embedding for session: ${sessionId}`);
    } catch (error) {
      logger.error('[EmbeddingPersistence] Error saving embedding:', error);
      throw error;
    }
  }

  /**
   * Get embedding by session ID
   */
  async getEmbedding(sessionId: string): Promise<number[] | null> {
    try {
      const embedding = await Embedding.findOne({ sessionId });
      
      if (!embedding) {
        return null;
      }

      // Update access metadata
      embedding.lastAccessedAt = new Date();
      embedding.accessCount += 1;
      await embedding.save();

      return embedding.vector;
    } catch (error) {
      logger.error('[EmbeddingPersistence] Error getting embedding:', error);
      throw error;
    }
  }

  /**
   * Get all embeddings
   */
  async getAllEmbeddings(): Promise<Map<string, number[]>> {
    try {
      const embeddings = await Embedding.find({});
      const map = new Map<string, number[]>();

      for (const embedding of embeddings) {
        map.set(embedding.sessionId, embedding.vector);
      }

      return map;
    } catch (error) {
      logger.error('[EmbeddingPersistence] Error getting all embeddings:', error);
      throw error;
    }
  }

  /**
   * Delete embedding by session ID
   */
  async deleteEmbedding(sessionId: string): Promise<void> {
    try {
      await Embedding.deleteOne({ sessionId });
      logger.info(`[EmbeddingPersistence] Deleted embedding for session: ${sessionId}`);
    } catch (error) {
      logger.error('[EmbeddingPersistence] Error deleting embedding:', error);
      throw error;
    }
  }

  /**
   * Clear all embeddings (use with caution)
   */
  async clear(): Promise<void> {
    try {
      await Embedding.deleteMany({});
      logger.warn('[EmbeddingPersistence] Cleared all embeddings');
    } catch (error) {
      logger.error('[EmbeddingPersistence] Error clearing embeddings:', error);
      throw error;
    }
  }

  /**
   * Get embedding metadata
   */
  async getEmbeddingMetadata(sessionId: string): Promise<any> {
    try {
      const embedding = await Embedding.findOne({ sessionId });
      return embedding;
    } catch (error) {
      logger.error('[EmbeddingPersistence] Error getting embedding metadata:', error);
      throw error;
    }
  }

  /**
   * Generate content hash for deduplication
   */
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
