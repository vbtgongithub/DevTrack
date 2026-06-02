import { logger } from '../../../shared/logger.js';
import { AIProviderAdapter } from '../provider/AIProviderAdapter.js';

export class ProviderFailoverRuntime {
  async executeWithFailover(operation: () => Promise<any>): Promise<any> {
    try {
      return await operation();
    } catch (error) {
      logger.warn('[ProviderFailover] Primary operation failed, failing over.', { error });
      // In a real system, we might switch provider configuration in AIProviderAdapter here
      AIProviderAdapter.setCurrentProvider('gemini'); // e.g. switch from openai to gemini
      try {
        return await operation();
      } catch (fallbackError) {
        logger.error('[ProviderFailover] Fallback also failed. Using degraded mode.', { fallbackError });
        return { content: 'AI services are currently unavailable (degraded mode)' };
      }
    }
  }
}
