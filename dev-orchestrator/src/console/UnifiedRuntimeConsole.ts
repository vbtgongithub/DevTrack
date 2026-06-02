import chalk from 'chalk';
import { RuntimeHealth, EnvironmentValidationResult } from '../types/orchestrator.js';

export class UnifiedRuntimeConsole {
  private logPrefix = '[DevTrack Runtime]';

  startup(message: string): void {
    console.log(chalk.cyan.bold(`${this.logPrefix} ${message}`));
  }

  success(message: string): void {
    console.log(chalk.green.bold(`${this.logPrefix} ✓ ${message}`));
  }

  error(message: string): void {
    console.log(chalk.red.bold(`${this.logPrefix} ✗ ${message}`));
  }

  warning(message: string): void {
    console.log(chalk.yellow.bold(`${this.logPrefix} ⚠ ${message}`));
  }

  info(message: string): void {
    console.log(chalk.blue(`${this.logPrefix} ${message}`));
  }

  serviceLog(service: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const coloredService = chalk.magenta.bold(`[${service}]`);
    const coloredMessage = level === 'error' ? chalk.red(message) : level === 'warn' ? chalk.yellow(message) : message;
    console.log(`${timestamp} ${coloredService} ${coloredMessage}`);
  }

  displayEnvironmentValidation(result: EnvironmentValidationResult): void {
    console.log('\n' + chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold.cyan('ENVIRONMENT VALIDATION'));
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    for (const check of result.checks) {
      const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
      const color = check.status === 'pass' ? 'green' : check.status === 'fail' ? 'red' : 'yellow';
      console.log(chalk[color](`${icon} ${check.name}: ${check.message}`));
    }

    if (result.errors.length > 0) {
      console.log('\n' + chalk.red.bold('Errors:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  • ${error}`));
      }
    }

    if (result.warnings.length > 0) {
      console.log('\n' + chalk.yellow.bold('Warnings:'));
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`  • ${warning}`));
      }
    }

    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  displayRuntimeStatus(health: RuntimeHealth[]): void {
    console.log('\n' + chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold.cyan('DEVTRACK RUNTIME STATUS'));
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    for (const service of health) {
      const icon = service.status === 'healthy' ? '✓' : 
                   service.status === 'unhealthy' ? '✗' : 
                   service.status === 'starting' ? '⟳' : '○';
      const color = service.status === 'healthy' ? 'green' : 
                   service.status === 'unhealthy' ? 'red' : 
                   service.status === 'starting' ? 'yellow' : 'gray';
      const uptime = service.uptime ? `${(service.uptime / 1000).toFixed(1)}s` : '-';
      
      console.log(
        chalk[color](`${icon} ${service.service.padEnd(20)} ${service.status.padEnd(10)} Uptime: ${uptime}`)
      );

      if (service.error) {
        console.log(chalk.red(`  Error: ${service.error}`));
      }
    }

    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  displayStartupSequence(steps: string[]): void {
    console.log('\n' + chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold.cyan('STARTUP SEQUENCE'));
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    steps.forEach((step, index) => {
      console.log(chalk.gray(`${index + 1}. ${step}`));
    });

    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  displayShutdownMessage(): void {
    console.log('\n' + chalk.yellow.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow.bold('GRACEFUL SHUTDOWN INITIATED'));
    console.log(chalk.yellow.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  displaySystemReady(): void {
    console.log('\n' + chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green.bold('SYSTEM READY'));
    console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    console.log(chalk.green.bold('✓ All services operational'));
    console.log(chalk.green.bold('✓ Development runtime active'));
    console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }
}
