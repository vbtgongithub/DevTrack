import { logger } from '../../../shared/logger.js';

export interface AuditLogEntry {
  logId: string;
  userId: string;
  timestamp: Date;
  requestType: string;
  prompt: string;
  systemPrompt: string;
  model: string;
  provider: string;
  latency: number;
  tokensUsed: number;
  cached: boolean;
  contextVersion: string;
  responseConfidence: number;
  moderationFlags: string[];
  hallucinationFlags: string[];
  safetyViolations: string[];
  response: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditStats {
  totalRequests: number;
  totalTokens: number;
  averageLatency: number;
  cacheHitRate: number;
  moderationFlagCount: number;
  hallucinationFlagCount: number;
  safetyViolationCount: number;
  failureCount: number;
  byProvider: Record<string, {
    requests: number;
    tokens: number;
    latency: number;
  }>;
  byModel: Record<string, {
    requests: number;
    tokens: number;
    latency: number;
  }>;
}

class AIResponseAuditLogClass {
  private auditLog: Map<string, AuditLogEntry> = new Map();
  private maxLogEntries: number = 10000;

  /**
   * Log AI request/response
   */
  log(entry: Omit<AuditLogEntry, 'logId' | 'timestamp'>): AuditLogEntry {
    const logId = this.generateLogId();
    const auditEntry: AuditLogEntry = {
      ...entry,
      logId,
      timestamp: new Date(),
    };

    this.auditLog.set(logId, auditEntry);

    // Keep log size bounded
    if (this.auditLog.size > this.maxLogEntries) {
      const oldestKey = this.auditLog.keys().next().value;
      if (oldestKey) {
        this.auditLog.delete(oldestKey);
      }
    }

    logger.info('[AIResponseAuditLog] Entry logged', { 
      logId, 
      userId: entry.userId, 
      requestType: entry.requestType,
      provider: entry.provider,
      success: entry.success 
    });

    return auditEntry;
  }

  /**
   * Get audit log entry by ID
   */
  getEntry(logId: string): AuditLogEntry | undefined {
    return this.auditLog.get(logId);
  }

  /**
   * Get audit log entries for a user
   */
  getUserEntries(userId: string, limit: number = 100): AuditLogEntry[] {
    const userEntries = Array.from(this.auditLog.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return userEntries.slice(0, limit);
  }

  /**
   * Get audit log entries by request type
   */
  getEntriesByType(requestType: string, limit: number = 100): AuditLogEntry[] {
    const typeEntries = Array.from(this.auditLog.values())
      .filter(entry => entry.requestType === requestType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return typeEntries.slice(0, limit);
  }

  /**
   * Get audit log entries with flags
   */
  getFlaggedEntries(flagType: 'moderation' | 'hallucination' | 'safety', limit: number = 100): AuditLogEntry[] {
    const flaggedEntries = Array.from(this.auditLog.values())
      .filter(entry => {
        if (flagType === 'moderation') return entry.moderationFlags.length > 0;
        if (flagType === 'hallucination') return entry.hallucinationFlags.length > 0;
        if (flagType === 'safety') return entry.safetyViolations.length > 0;
        return false;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return flaggedEntries.slice(0, limit);
  }

  /**
   * Get failed entries
   */
  getFailedEntries(limit: number = 100): AuditLogEntry[] {
    const failedEntries = Array.from(this.auditLog.values())
      .filter(entry => !entry.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return failedEntries.slice(0, limit);
  }

  /**
   * Calculate audit statistics
   */
  calculateStats(timeframe?: string): AuditStats {
    const entries = timeframe 
      ? this.getEntriesInTimeframe(timeframe)
      : Array.from(this.auditLog.values());

    const totalRequests = entries.length;
    const totalTokens = entries.reduce((sum, entry) => sum + entry.tokensUsed, 0);
    const averageLatency = totalRequests > 0 
      ? entries.reduce((sum, entry) => sum + entry.latency, 0) / totalRequests 
      : 0;
    const cachedCount = entries.filter(entry => entry.cached).length;
    const cacheHitRate = totalRequests > 0 ? (cachedCount / totalRequests) * 100 : 0;
    const moderationFlagCount = entries.reduce((sum, entry) => sum + entry.moderationFlags.length, 0);
    const hallucinationFlagCount = entries.reduce((sum, entry) => sum + entry.hallucinationFlags.length, 0);
    const safetyViolationCount = entries.reduce((sum, entry) => sum + entry.safetyViolations.length, 0);
    const failureCount = entries.filter(entry => !entry.success).length;

    // Calculate stats by provider
    const byProvider: Record<string, { requests: number; tokens: number; latency: number }> = {};
    entries.forEach(entry => {
      if (!byProvider[entry.provider]) {
        byProvider[entry.provider] = { requests: 0, tokens: 0, latency: 0 };
      }
      byProvider[entry.provider].requests++;
      byProvider[entry.provider].tokens += entry.tokensUsed;
      byProvider[entry.provider].latency += entry.latency;
    });

    // Calculate average latency by provider
    Object.keys(byProvider).forEach(provider => {
      byProvider[provider].latency = byProvider[provider].latency / byProvider[provider].requests;
    });

    // Calculate stats by model
    const byModel: Record<string, { requests: number; tokens: number; latency: number }> = {};
    entries.forEach(entry => {
      if (!byModel[entry.model]) {
        byModel[entry.model] = { requests: 0, tokens: 0, latency: 0 };
      }
      byModel[entry.model].requests++;
      byModel[entry.model].tokens += entry.tokensUsed;
      byModel[entry.model].latency += entry.latency;
    });

    // Calculate average latency by model
    Object.keys(byModel).forEach(model => {
      byModel[model].latency = byModel[model].latency / byModel[model].requests;
    });

    return {
      totalRequests,
      totalTokens,
      averageLatency: Math.round(averageLatency),
      cacheHitRate: Math.round(cacheHitRate),
      moderationFlagCount,
      hallucinationFlagCount,
      safetyViolationCount,
      failureCount,
      byProvider,
      byModel,
    };
  }

  /**
   * Get entries within a timeframe
   */
  private getEntriesInTimeframe(timeframe: string): AuditLogEntry[] {
    const now = new Date();
    let cutoff: Date;

    switch (timeframe) {
      case 'hour':
        cutoff = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = new Date(0);
    }

    return Array.from(this.auditLog.values())
      .filter(entry => entry.timestamp >= cutoff);
  }

  /**
   * Get recent entries
   */
  getRecentEntries(limit: number = 50): AuditLogEntry[] {
    return Array.from(this.auditLog.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Search audit log
   */
  search(query: string, limit: number = 100): AuditLogEntry[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.auditLog.values())
      .filter(entry => 
        entry.prompt.toLowerCase().includes(lowerQuery) ||
        entry.response.toLowerCase().includes(lowerQuery) ||
        entry.requestType.toLowerCase().includes(lowerQuery) ||
        entry.userId.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear audit log
   */
  clear(): void {
    this.auditLog.clear();
    logger.info('[AIResponseAuditLog] Audit log cleared');
  }

  /**
   * Clear old entries (older than specified days)
   */
  clearOldEntries(days: number): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let clearedCount = 0;

    this.auditLog.forEach((entry, logId) => {
      if (entry.timestamp < cutoff) {
        this.auditLog.delete(logId);
        clearedCount++;
      }
    });

    logger.info('[AIResponseAuditLog] Old entries cleared', { clearedCount, days });

    return clearedCount;
  }

  /**
   * Generate log ID
   */
  private generateLogId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `audit-${timestamp}-${random}`;
  }

  /**
   * Get log size
   */
  getLogSize(): number {
    return this.auditLog.size;
  }
}

export const AIResponseAuditLog = new AIResponseAuditLogClass();
