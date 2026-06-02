import { spawn, ChildProcess } from 'child_process';
import { RuntimeService, OrchestratorConfig, RuntimeHealth } from '../types/orchestrator.js';
import { DevelopmentHealthMonitor } from '../monitor/DevelopmentHealthMonitor.js';
import { UnifiedRuntimeConsole } from '../console/UnifiedRuntimeConsole.js';
import { EnvironmentReadinessValidator } from '../validators/EnvironmentReadinessValidator.js';

export class DevelopmentRuntimeOrchestrator {
  private processes: Map<string, ChildProcess> = new Map();
  private healthMonitor: DevelopmentHealthMonitor;
  private console: UnifiedRuntimeConsole;
  private validator: EnvironmentReadinessValidator;
  private config: OrchestratorConfig;
  private isShuttingDown: boolean = false;
  private recoveringServices: Set<string> = new Set();
  private crashCounters: Map<string, { count: number; lastCrash: number }> = new Map();

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.healthMonitor = new DevelopmentHealthMonitor();
    this.console = new UnifiedRuntimeConsole();
    this.validator = new EnvironmentReadinessValidator();
  }

  async start(): Promise<void> {
    this.console.startup('Initializing DevTrack Development Runtime...');

    // Step 1: Environment Validation
    this.console.info('Validating environment...');
    const validation = await this.validator.validate();
    this.console.displayEnvironmentValidation(validation);

    if (!validation.valid) {
      this.console.error('Environment validation failed. Please fix the errors above.');
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      this.console.warning(`Environment validation passed with ${validation.warnings.length} warnings.`);
    }

    // Step 2: Register all services
    for (const service of this.config.services) {
      this.healthMonitor.registerService(service.name);
    }

    // Step 3: Display startup sequence
    const startupSteps = this.config.services.map(s => s.name);
    this.console.displayStartupSequence(startupSteps);

    // Step 4: Start services in dependency order
    await this.startServices();

    // Step 5: Start health monitoring
    this.startHealthMonitoring();

    // Step 6: Setup graceful shutdown
    this.setupGracefulShutdown();

    this.console.displaySystemReady();
  }

  private async startServices(): Promise<void> {
    const sortedServices = this.sortServicesByPriority(this.config.services);

    for (const service of sortedServices) {
      if (this.isShuttingDown) break;

      this.console.info(`Starting ${service.name}...`);
      this.healthMonitor.updateServiceStatus(service.name, 'starting');

      try {
        await this.startService(service);
        this.healthMonitor.updateServiceStatus(service.name, 'healthy');
        this.console.success(`${service.name} started successfully`);
      } catch (error) {
        this.healthMonitor.updateServiceStatus(
          service.name,
          'unhealthy',
          error instanceof Error ? error.message : 'Unknown error'
        );
        this.console.error(`Failed to start ${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // If it's a critical service, stop everything
        if (service.priority <= 2) {
          this.console.error(`Critical service ${service.name} failed. Shutting down...`);
          await this.shutdown();
          process.exit(1);
        }
      }

      // Wait a bit between services
      await this.sleep(1000);
    }
  }

  private startService(service: RuntimeService): Promise<void> {
    return new Promise((resolve, reject) => {
      const cwd = service.cwd || process.cwd();
      const [command, ...args] = service.command.split(' ');
      let isStarted = false;

      const childProcess = spawn(command, args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      this.processes.set(service.name, childProcess);

      // Stream output
      childProcess.stdout?.on('data', (data) => {
        this.console.serviceLog(service.name, data.toString().trim());
      });

      childProcess.stderr?.on('data', (data) => {
        this.console.serviceLog(service.name, data.toString().trim(), 'error');
      });

      childProcess.on('error', (error) => {
        if (!isStarted) {
          reject(error);
        } else {
          this.handleServiceCrash(service, error);
        }
      });

      childProcess.on('exit', (code) => {
        if (!isStarted) {
          if (code !== 0 && !this.isShuttingDown) {
            reject(new Error(`Process exited with code ${code}`));
          } else {
            isStarted = true;
            resolve();
          }
        } else {
          if (code !== 0 && !this.isShuttingDown) {
            this.handleServiceCrash(service, new Error(`Process exited with code ${code}`));
          }
        }
      });

      const markStarted = () => {
        if (!isStarted) {
          isStarted = true;
          resolve();
        }
      };

      // Wait for service to be ready
      const timeout = setTimeout(() => {
        if (!this.isShuttingDown && !isStarted) {
          reject(new Error('Service startup timeout'));
        }
      }, this.config.startupTimeout);

      // If health check is available, use it
      if (service.healthCheck) {
        const checkInterval = setInterval(async () => {
          try {
            const isHealthy = await service.healthCheck!();
            if (isHealthy) {
              clearTimeout(timeout);
              clearInterval(checkInterval);
              markStarted();
            }
          } catch (error) {
            // Health check failed, continue trying
          }
        }, 1000);
      } else {
        // No health check, assume ready after a delay
        setTimeout(() => {
          clearTimeout(timeout);
          markStarted();
        }, 2000);
      }
    });
  }

  private sortServicesByPriority(services: RuntimeService[]): RuntimeService[] {
    return [...services].sort((a, b) => a.priority - b.priority);
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      if (this.isShuttingDown) return;

      for (const service of this.config.services) {
        if (service.type === 'infrastructure') {
          // Infrastructure is daemonized, we don't monitor process status directly
          continue;
        }

        const proc = this.processes.get(service.name);
        const isAlive = proc && !proc.killed && proc.exitCode === null;

        let isHealthy = !!isAlive;
        let healthError = isAlive ? undefined : 'Process not running';

        if (isAlive && service.healthCheck) {
          try {
            isHealthy = await service.healthCheck();
            if (!isHealthy) {
              healthError = 'Health check returned unhealthy state';
            }
          } catch (err: any) {
            isHealthy = false;
            healthError = `Health check failed: ${err.message}`;
          }
        }

        const currentHealth = this.healthMonitor.getServiceHealth(service.name);

        if (!isHealthy) {
          this.healthMonitor.updateServiceStatus(service.name, 'unhealthy', healthError);
          if (!this.isShuttingDown && !this.recoveringServices.has(service.name)) {
            this.console.warning(`Health monitor detected silent failure for ${service.name}: ${healthError}. Triggering recovery...`);
            this.handleServiceCrash(service, new Error(healthError));
          }
        } else if (currentHealth?.status !== 'healthy' && !this.recoveringServices.has(service.name)) {
          this.healthMonitor.updateServiceStatus(service.name, 'healthy');
        }
      }

      const health = this.healthMonitor.getAllHealth();
      this.console.displayRuntimeStatus(health);
    }, this.config.healthCheckInterval);
  }

  private handleServiceCrash(service: RuntimeService, error?: Error): void {
    if (this.isShuttingDown || this.recoveringServices.has(service.name)) {
      return;
    }

    this.recoveringServices.add(service.name);

    const now = Date.now();
    let crashRecord = this.crashCounters.get(service.name);

    if (!crashRecord || (now - crashRecord.lastCrash > 60000)) {
      crashRecord = { count: 0, lastCrash: now };
    }

    crashRecord.count++;
    crashRecord.lastCrash = now;
    this.crashCounters.set(service.name, crashRecord);

    const maxRetries = 3;
    if (crashRecord.count > maxRetries) {
      this.console.error(`Service ${service.name} has crashed ${crashRecord.count} times in the last 60 seconds. Exceeded maximum retry threshold (${maxRetries}). Recovery disabled.`);
      this.healthMonitor.updateServiceStatus(service.name, 'unhealthy', 'Exceeded maximum crash retry threshold');
      this.recoveringServices.delete(service.name);

      if (service.priority <= 2) {
        this.console.error(`Critical service ${service.name} failed to recover. Shutting down system...`);
        this.shutdown().then(() => process.exit(1));
      }
      return;
    }

    this.console.warning(`Service ${service.name} crashed or exited unexpectedly (Error: ${error?.message || 'Unknown'}). Restarting (Attempt ${crashRecord.count}/${maxRetries}) in 2 seconds...`);

    setTimeout(() => {
      this.restartService(service).finally(() => {
        this.recoveringServices.delete(service.name);
      });
    }, 2000);
  }

  private async restartService(service: RuntimeService): Promise<void> {
    if (this.isShuttingDown) return;

    this.console.info(`Attempting auto-recovery for ${service.name}...`);
    this.healthMonitor.updateServiceStatus(service.name, 'starting');

    // Clean up old process mapping if any exists
    const oldProc = this.processes.get(service.name);
    if (oldProc) {
      try {
        oldProc.kill('SIGKILL');
      } catch (e) {}
      this.processes.delete(service.name);
    }

    try {
      await this.startService(service);
      this.healthMonitor.updateServiceStatus(service.name, 'healthy');
      this.console.success(`Service ${service.name} recovered successfully`);
    } catch (error) {
      this.healthMonitor.updateServiceStatus(
        service.name,
        'unhealthy',
        error instanceof Error ? error.message : 'Recovery failed'
      );
      this.console.error(`Recovery failed for ${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // If critical, shut down
      if (service.priority <= 2) {
        this.console.error(`Critical service ${service.name} failed to recover. Shutting down system...`);
        await this.shutdown();
        process.exit(1);
      }
    }
  }

  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      this.console.displayShutdownMessage();
      await this.shutdown();

      process.exit(0);
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  }

  private async shutdown(): Promise<void> {
    this.console.info('Shutting down services...');

    // Stop services in reverse priority order
    const sortedServices = this.sortServicesByPriority(this.config.services).reverse();

    for (const service of sortedServices) {
      const process = this.processes.get(service.name);
      if (process) {
        this.console.info(`Stopping ${service.name}...`);
        this.healthMonitor.updateServiceStatus(service.name, 'stopped');

        try {
          process.kill('SIGTERM');
          
          // Wait for graceful shutdown
          await Promise.race([
            new Promise<void>((resolve) => {
              process.on('exit', () => resolve());
            }),
            new Promise<void>((resolve) => {
              setTimeout(resolve, this.config.gracefulShutdownTimeout);
            })
          ]);

          // If still running, force kill
          if (process.pid && !process.killed) {
            process.kill('SIGKILL');
          }

          this.console.success(`${service.name} stopped`);
        } catch (error) {
          this.console.warning(`Failed to gracefully stop ${service.name}, force killing`);
          process.kill('SIGKILL');
        }

        this.processes.delete(service.name);
      }
    }

    this.console.success('All services stopped');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
