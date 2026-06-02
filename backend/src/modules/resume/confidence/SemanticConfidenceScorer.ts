export class SemanticConfidenceScorer {
  score(similarityScore: number): number {
    // Normalizes a similarity score (0 to 1) into a confidence score (0 to 1)
    if (similarityScore > 0.9) return 1.0;
    if (similarityScore > 0.7) return 0.8;
    if (similarityScore > 0.5) return 0.5;
    return 0.1;
  }
}
