/**
 * TemporalEvidenceValidator
 * 
 * Validates if evidence is still relevant or has expired (e.g., stale cloud signals).
 */
export class TemporalEvidenceValidator {
  isStale(timestamp: Date, ttlDays: number = 30): boolean {
    const diff = (new Date().getTime() - timestamp.getTime()) / (1000 * 3600 * 24);
    return diff > ttlDays;
  }
}
