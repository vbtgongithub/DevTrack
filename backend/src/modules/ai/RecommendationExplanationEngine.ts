import { ReadinessContextBuilder } from './ReadinessContextBuilder.js';
import { PromptSafetyLayer } from './PromptSafetyLayer.js';
import { AIProviderAdapter } from './AIProviderAdapter.js';

export const RecommendationExplanationEngine = {
  /**
   * Translates deterministic gaps into human-readable advice.
   */
  async explainRecommendation(userId: string, targetNode: string): Promise<string> {
    const context = await ReadinessContextBuilder.buildContext(userId);
    const systemPrompt = PromptSafetyLayer.getSystemPrompt();
    const userPrompt = `
      Based on the following context, explain technically why the user needs to learn or verify '${targetNode}' next.
      Keep it to 2 concise sentences.
      
      ${context}
    `;

    return await AIProviderAdapter.generateResponse(userId, systemPrompt, userPrompt);
  },

  async answerQuestion(userId: string, question: string): Promise<string> {
    const context = await ReadinessContextBuilder.buildContext(userId);
    const systemPrompt = PromptSafetyLayer.getSystemPrompt();
    const userPrompt = `
      Based on the following deterministic context, answer the user's question: "${question}"
      
      ${context}
    `;

    return await AIProviderAdapter.generateResponse(userId, systemPrompt, userPrompt);
  }
};
