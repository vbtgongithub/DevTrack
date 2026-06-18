import { ReadinessContextBuilder, ReadinessContext } from '../context/ReadinessContextBuilder.js';
import { ProviderHealthRegistry } from '../../readiness/provider/ProviderHealthRegistry.js';
import { logger } from '../../../shared/logger.js';

export interface TrustAwareResponse {
  content: string;
  confidence: number;
  confidenceReasoning: string;
  staleDataWarnings: string[];
  providerFreshnessWarnings: string[];
  evidenceCoverage: number;
  trustScore: number;
  contextVersion: string;
}

export interface TrustAwareInput {
  userId: string;
  targetRole?: string;
  aiResponse: string;
  contextVersion?: string;
}

class TrustAwareAIResponseClass {
  /**
   * Wrap AI response with trust-aware context
   */
  async wrapResponse(input: TrustAwareInput): Promise<TrustAwareResponse> {
    const { userId, targetRole, aiResponse, contextVersion } = input;
    
    try {
      logger.info('[TrustAwareAIResponse] Wrapping response with trust context', { userId });
      
      // Build deterministic context
      const context = await ReadinessContextBuilder.buildContext({
        userId,
        targetRole,
        contextType: 'general',
      });
      
      // Calculate trust score
      const trustScore = this.calculateTrustScore(context);
      
      // Generate confidence reasoning
      const confidenceReasoning = this.generateConfidenceReasoning(context);
      
      // Generate stale data warnings
      const staleDataWarnings = this.generateStaleDataWarnings(context);
      
      // Generate provider freshness warnings
      const providerFreshnessWarnings = this.generateProviderFreshnessWarnings(context);
      
      // Add trust-aware context to response
      const enhancedContent = this.enhanceResponseWithTrustContext(
        aiResponse,
        context,
        staleDataWarnings,
        providerFreshnessWarnings
      );
      
      logger.info('[TrustAwareAIResponse] Response wrapped with trust context', { 
        userId, 
        trustScore,
        confidence: context.trustConfidence.overallConfidence 
      });
      
      return {
        content: enhancedContent,
        confidence: context.trustConfidence.overallConfidence,
        confidenceReasoning,
        staleDataWarnings,
        providerFreshnessWarnings,
        evidenceCoverage: context.trustConfidence.evidenceCoverage,
        trustScore,
        contextVersion: contextVersion || context.contextVersion,
      };
    } catch (error) {
      logger.error('[TrustAwareAIResponse] Failed to wrap response', { userId, error });
      
      // Return response without trust context on error
      return {
        content: aiResponse,
        confidence: 50,
        confidenceReasoning: 'Unable to calculate confidence due to error.',
        staleDataWarnings: [],
        providerFreshnessWarnings: [],
        evidenceCoverage: 50,
        trustScore: 50,
        contextVersion: contextVersion || 'unknown',
      };
    }
  }

  /**
   * Calculate trust score based on context
   */
  private calculateTrustScore(context: ReadinessContext): number {
    let trustScore = context.trustConfidence.overallConfidence;
    
    // Reduce trust score if providers are stale
    if (context.providerFreshness.staleProviders.length > 0) {
      trustScore -= 20 * context.providerFreshness.staleProviders.length;
    }
    
    // Reduce trust score if evidence coverage is low
    if (context.trustConfidence.evidenceCoverage < 50) {
      trustScore -= 15;
    }
    
    // Ensure trust score stays within bounds
    return Math.max(0, Math.min(100, trustScore));
  }

  /**
   * Generate confidence reasoning
   */
  private generateConfidenceReasoning(context: ReadinessContext): string {
    let reasoning = `Overall confidence is ${context.trustConfidence.overallConfidence}%. `;
    
    if (context.trustConfidence.evidenceCoverage < 50) {
      reasoning += 'Evidence coverage is limited, which reduces confidence. ';
    } else {
      reasoning += 'Evidence coverage is good. ';
    }
    
    if (context.providerFreshness.staleProviders.length > 0) {
      reasoning += `Some data providers are stale: ${context.providerFreshness.staleProviders.join(', ')}. This may reduce confidence in certain metrics. `;
    }
    
    if (context.readinessSummary.confidenceScore < 70) {
      reasoning += 'Some readiness components have limited evidence coverage, reducing overall confidence. ';
    }
    
    return reasoning.trim();
  }

  /**
   * Generate stale data warnings
   */
  private generateStaleDataWarnings(context: ReadinessContext): string[] {
    const warnings: string[] = [];
    
    if (context.providerFreshness.githubFreshness < 80) {
      warnings.push('GitHub signals are stale, reducing project maturity confidence.');
    }
    
    if (context.providerFreshness.leetcodeFreshness < 80) {
      warnings.push('LeetCode data is stale, reducing DSA confidence.');
    }
    
    if (context.providerFreshness.codeforcesFreshness < 80) {
      warnings.push('Codeforces data is stale, reducing competitive programming confidence.');
    }
    
    if (context.trustConfidence.evidenceCoverage < 50) {
      warnings.push('Overall evidence coverage is limited, reducing confidence in readiness scores.');
    }
    
    return warnings;
  }

  /**
   * Generate provider freshness warnings
   */
  private generateProviderFreshnessWarnings(context: ReadinessContext): string[] {
    const warnings: string[] = [];
    
    const allProviders = ProviderHealthRegistry.getAllProviderHealth();
    const degradedProviders = allProviders.filter(p => p.status === 'degraded' || p.status === 'down');
    
    degradedProviders.forEach(provider => {
      warnings.push(`${provider.providerName} provider is ${provider.status}, affecting data freshness.`);
    });
    
    return warnings;
  }

  /**
   * Enhance AI response with trust context
   */
  private enhanceResponseWithTrustContext(
    aiResponse: string,
    context: ReadinessContext,
    staleDataWarnings: string[],
    providerFreshnessWarnings: string[]
  ): string {
    let enhancedResponse = aiResponse;
    
    // Add confidence disclaimer if confidence is low
    if (context.trustConfidence.overallConfidence < 70) {
      enhancedResponse += `\n\n[Confidence: ${context.trustConfidence.overallConfidence}%] This explanation is based on available evidence, but confidence is limited due to ${context.trustConfidence.evidenceCoverage < 50 ? 'limited evidence coverage' : 'data freshness constraints'}.`;
    }
    
    // Add stale data warnings if any
    if (staleDataWarnings.length > 0) {
      enhancedResponse += `\n\n[Data Freshness Note] ${staleDataWarnings.join(' ')}`;
    }
    
    // Add provider freshness warnings if any
    if (providerFreshnessWarnings.length > 0) {
      enhancedResponse += `\n\n[Provider Status] ${providerFreshnessWarnings.join(' ')}`;
    }
    
    // Add evidence coverage note
    if (context.trustConfidence.evidenceCoverage < 60) {
      enhancedResponse += `\n\n[Evidence Coverage: ${context.trustConfidence.evidenceCoverage}%] Some readiness components have limited evidence. Consider updating your data sources for more accurate insights.`;
    }
    
    return enhancedResponse;
  }

  /**
   * Batch wrap multiple responses
   */
  async wrapBatchResponses(inputs: TrustAwareInput[]): Promise<TrustAwareResponse[]> {
    const responses: TrustAwareResponse[] = [];
    
    for (const input of inputs) {
      try {
        const response = await this.wrapResponse(input);
        responses.push(response);
      } catch (error) {
        logger.error('[TrustAwareAIResponse] Failed to wrap response in batch', { 
          userId: input.userId,
          error 
        });
      }
    }
    
    return responses;
  }

  /**
   * Get trust score for a user
   */
  async getUserTrustScore(userId: string, targetRole?: string): Promise<number> {
    try {
      const context = await ReadinessContextBuilder.buildContext({
        userId,
        targetRole,
        contextType: 'general',
      });
      
      return this.calculateTrustScore(context);
    } catch (error) {
      logger.error('[TrustAwareAIResponse] Failed to get user trust score', { userId, error });
      return 50;
    }
  }

  /**
   * Get trust breakdown for a user
   */
  async getUserTrustBreakdown(userId: string, targetRole?: string): Promise<{
    overallScore: number;
    confidenceScore: number;
    evidenceCoverage: number;
    providerFreshness: number;
    staleProviders: string[];
  }> {
    try {
      const context = await ReadinessContextBuilder.buildContext({
        userId,
        targetRole,
        contextType: 'general',
      });
      
      const providerFreshness = Math.min(
        context.providerFreshness.githubFreshness,
        context.providerFreshness.leetcodeFreshness,
        context.providerFreshness.codeforcesFreshness
      );
      
      return {
        overallScore: this.calculateTrustScore(context),
        confidenceScore: context.trustConfidence.overallConfidence,
        evidenceCoverage: context.trustConfidence.evidenceCoverage,
        providerFreshness,
        staleProviders: context.providerFreshness.staleProviders,
      };
    } catch (error) {
      logger.error('[TrustAwareAIResponse] Failed to get user trust breakdown', { userId, error });
      return {
        overallScore: 50,
        confidenceScore: 50,
        evidenceCoverage: 50,
        providerFreshness: 50,
        staleProviders: [],
      };
    }
  }
}

export const TrustAwareAIResponse = new TrustAwareAIResponseClass();
