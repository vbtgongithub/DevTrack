export class EvidenceCoverageCalculator {
  calculateCoverage(evidenceCount: number, expectedCount: number = 3): number {
    return Math.min(evidenceCount / expectedCount, 1.0);
  }
}
