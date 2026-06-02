import { logger } from '../../shared/logger.js';
import { EvidenceGraphEngine } from '../resume/evidence/EvidenceGraphEngine.js';
import { RealEmbeddingPipeline } from '../ai/embedding/RealEmbeddingPipeline.js';
import { VectorRetrievalEngine } from '../ai/retrieval/VectorRetrievalEngine.js';

export class EndToEndRuntimeValidationSuite {
  private evidenceEngine = new EvidenceGraphEngine();
  private embeddingPipeline = new RealEmbeddingPipeline();
  
  async validateRuntime(userId: any): Promise<boolean> {
    try {
      logger.info('[E2E] Starting end-to-end validation');
      await this.evidenceEngine.buildGraphForUser(userId);
      logger.info('[E2E] Evidence graph built');

      await this.embeddingPipeline.processAndStore(userId.toString(), "Test Resume Text for Validation");
      logger.info('[E2E] Embeddings generated and persisted');

      const store = await this.embeddingPipeline.getStore();
      const retrievalEngine = new VectorRetrievalEngine(store);
      const testVector = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
      const results = await retrievalEngine.retrieveTopK(testVector, 5);
      
      logger.info(`[E2E] Retrieval executed, got ${results.length} matches`);
      logger.info('[E2E] End-to-end validation successful');
      return true;
    } catch (error) {
      logger.error('[E2E] End-to-end validation failed', { error });
      return false;
    }
  }
}
