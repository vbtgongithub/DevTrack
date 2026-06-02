import { logger } from '../../../shared/logger.js';
import { EmbeddingProviderAdapter } from './EmbeddingProviderAdapter.js';
import { EmbeddingPersistenceLayer } from './EmbeddingPersistenceLayer.js';

export class RealEmbeddingPipeline {
  private provider: EmbeddingProviderAdapter;
  private persistence: EmbeddingPersistenceLayer;

  constructor(persistence?: EmbeddingPersistenceLayer) {
    this.provider = new EmbeddingProviderAdapter();
    this.persistence = persistence || new EmbeddingPersistenceLayer();
  }

  async processAndStore(id: string, text: string, userId?: string): Promise<void> {
    logger.info(`[EmbeddingPipeline] Processing text for ${id}`);
    const { vector, provider } = await this.provider.generateEmbedding(text);
    await this.persistence.saveEmbedding(
      id,
      0, // chunkIndex
      vector,
      provider,
      provider === 'openai' ? 'text-embedding-3-small' : 'text-embedding-004',
      text,
      'resume',
      userId
    );
  }
  
  async getEmbeddingForId(id: string): Promise<number[] | null> {
    return this.persistence.getEmbedding(id);
  }
  
  async getStore(): Promise<EmbeddingPersistenceLayer> {
    return this.persistence;
  }
}
