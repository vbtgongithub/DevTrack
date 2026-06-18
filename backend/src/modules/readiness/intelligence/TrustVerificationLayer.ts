import { ReadinessCore } from '../../../db/models/readinessCore.model.js';
import { ProviderHealthRegistry } from '../provider/ProviderHealthRegistry.js';
import { logger } from '../../../shared/logger.js';

export const TrustVerificationLayer = {
  /**
   * Evaluates evidence chains and appends trust confidence to the readiness snapshot.
   * If a provider fails, the score does not collapse, but confidence degrades.
   */
  async computeConfidence(userId: string): Promise<void> {
    const providers = await ProviderHealthRegistry.getAllProviders();
    const staleProviders = providers.filter(p => p.status !== 'healthy').map(p => p.name);
    
    let baseConfidence = 100;
    
    // Degrade confidence based on provider health
    providers.forEach(p => {
      if (p.status === 'degraded') baseConfidence -= 10;
      if (p.status === 'down') baseConfidence -= 25;
    });
    
    const finalConfidence = Math.max(0, baseConfidence);
    const isDegraded = finalConfidence < 90;

    await ReadinessCore.findOneAndUpdate(
      { userId },
      {
        confidence: finalConfidence,
        isDegraded,
        staleProviders
      },
      { upsert: true }
    );
    
    logger.info('[TrustVerificationLayer] Applied trust verification', { userId, finalConfidence });
  }
};
