import { CosineSimilarityEngine } from './CosineSimilarityEngine.js';

export class SemanticSimilarityService {
  private engine: CosineSimilarityEngine;

  constructor() {
    this.engine = new CosineSimilarityEngine();
  }

  calculate(vectorA: number[], vectorB: number[]): number {
    return this.engine.calculateSimilarity(vectorA, vectorB);
  }

  rankCandidates(queryVector: number[], candidates: { id: string, vector: number[] }[]): { id: string, score: number }[] {
    return candidates.map(c => ({
      id: c.id,
      score: this.calculate(queryVector, c.vector)
    })).sort((a, b) => b.score - a.score);
  }
}
