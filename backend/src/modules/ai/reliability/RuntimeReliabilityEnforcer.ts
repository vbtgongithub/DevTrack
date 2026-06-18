import { logger } from '../../../shared/logger.js';

export class RuntimeReliabilityEnforcer {
  private maxLatencyMs: number = 5000;
  private minConfidenceScore: number = 0.5;

  enforceLatency(latency: number): void {
    if (latency > this.maxLatencyMs) {
      throw new Error(`Latency timeout exceeded: ${latency}ms > ${this.maxLatencyMs}ms`);
    }
  }

  enforceConfidence(confidence: number): void {
    if (confidence < this.minConfidenceScore) {
      logger.warn(`[ReliabilityEnforcer] Dropping result due to low confidence: ${confidence}`);
      throw new Error(`Confidence below minimum threshold: ${confidence} < ${this.minConfidenceScore}`);
    }
  }
}
