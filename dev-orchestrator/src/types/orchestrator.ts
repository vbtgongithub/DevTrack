export interface RuntimeService {
  name: string;
  type: 'frontend' | 'backend' | 'worker' | 'infrastructure';
  command: string;
  cwd?: string;
  port?: number;
  healthCheck?: () => Promise<boolean>;
  dependencies?: string[];
  priority: number;
  color?: string;
}

export interface RuntimeHealth {
  service: string;
  status: 'pending' | 'starting' | 'healthy' | 'unhealthy' | 'stopped';
  uptime?: number;
  lastCheck?: Date;
  error?: string;
}

export interface EnvironmentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
  }[];
}

export interface OrchestratorConfig {
  services: RuntimeService[];
  healthCheckInterval: number;
  startupTimeout: number;
  gracefulShutdownTimeout: number;
}
