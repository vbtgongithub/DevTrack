export class FreshnessConfidenceCalculator {
  calculate(lastUpdated: Date): number {
    const ageDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 30) return 1.0;
    if (ageDays < 90) return 0.8;
    if (ageDays < 180) return 0.5;
    return 0.2; // Stale evidence loses confidence
  }
}
