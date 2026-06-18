// src/features/intelligence-experience/narrative/EngineeringNarrativeEngine.ts
// Utility engine for translating raw metrics into human-readable narratives.

export class EngineeringNarrativeEngine {
  static generateProgressionNarrative(metric: string, oldVal: number, newVal: number): string {
    const delta = newVal - oldVal;
    if (delta > 0) {
      return `Your ${metric} accelerated significantly, driven by recent verifiable commits.`;
    } else if (delta < 0) {
      return `Your ${metric} has stagnated due to a lack of recent complex implementations.`;
    }
    return `Your ${metric} remains stable.`;
  }
}
