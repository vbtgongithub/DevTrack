import { RuntimeHealth } from '../types/orchestrator.js';

export class DevelopmentHealthMonitor {
  private healthStatus: Map<string, RuntimeHealth> = new Map();
  private startTime: Date = new Date();

  registerService(serviceName: string): void {
    this.healthStatus.set(serviceName, {
      service: serviceName,
      status: 'pending',
      lastCheck: new Date()
    });
  }

  updateServiceStatus(
    serviceName: string,
    status: RuntimeHealth['status'],
    error?: string
  ): void {
    const current = this.healthStatus.get(serviceName);
    this.healthStatus.set(serviceName, {
      service: serviceName,
      status,
      uptime: current?.lastCheck 
        ? Date.now() - current.lastCheck.getTime() 
        : 0,
      lastCheck: new Date(),
      error
    });
  }

  getServiceHealth(serviceName: string): RuntimeHealth | undefined {
    return this.healthStatus.get(serviceName);
  }

  getAllHealth(): RuntimeHealth[] {
    return Array.from(this.healthStatus.values());
  }

  isSystemHealthy(): boolean {
    const health = this.getAllHealth();
    return health.every(h => h.status === 'healthy' || h.status === 'pending');
  }

  getSystemUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  getHealthSummary(): {
    total: number;
    healthy: number;
    unhealthy: number;
    pending: number;
    stopped: number;
  } {
    const health = this.getAllHealth();
    return {
      total: health.length,
      healthy: health.filter(h => h.status === 'healthy').length,
      unhealthy: health.filter(h => h.status === 'unhealthy').length,
      pending: health.filter(h => h.status === 'pending').length,
      stopped: health.filter(h => h.status === 'stopped').length
    };
  }

  reset(): void {
    this.healthStatus.clear();
    this.startTime = new Date();
  }
}
