import { DevelopmentHealthMonitor } from './monitor/DevelopmentHealthMonitor.js';
import { EnvironmentReadinessValidator } from './validators/EnvironmentReadinessValidator.js';
import { UnifiedRuntimeConsole } from './console/UnifiedRuntimeConsole.js';

async function healthCheck() {
  const console = new UnifiedRuntimeConsole();
  const validator = new EnvironmentReadinessValidator();

  console.startup('Running DevTrack Health Check...');

  const validation = await validator.validate();
  console.displayEnvironmentValidation(validation);

  if (validation.valid) {
    console.success('All health checks passed');
    process.exit(0);
  } else {
    console.error('Health checks failed');
    process.exit(1);
  }
}

healthCheck();
