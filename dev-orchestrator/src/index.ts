import { DevelopmentRuntimeOrchestrator } from './orchestrator/DevelopmentRuntimeOrchestrator.js';
import { RuntimeService, OrchestratorConfig } from './types/orchestrator.js';

// Define runtime services
const services: RuntimeService[] = [
  {
    name: 'Infrastructure',
    type: 'infrastructure',
    command: 'docker-compose up -d mongo redis',
    priority: 1,
    color: 'cyan'
  },
  {
    name: 'Backend API',
    type: 'backend',
    command: 'npm run dev',
    cwd: './backend',
    port: 3001,
    priority: 2,
    color: 'green',
    dependencies: ['Infrastructure']
  },
  {
    name: 'Workers',
    type: 'worker',
    command: 'npm run worker',
    cwd: './backend',
    priority: 3,
    color: 'yellow',
    dependencies: ['Backend API']
  },
  {
    name: 'Frontend',
    type: 'frontend',
    command: 'npm run dev',
    cwd: './frontend',
    port: 5173,
    priority: 4,
    color: 'blue',
    dependencies: ['Backend API']
  }
];

// Orchestrator configuration
const config: OrchestratorConfig = {
  services,
  healthCheckInterval: 30000, // 30 seconds
  startupTimeout: 30000, // 30 seconds
  gracefulShutdownTimeout: 10000 // 10 seconds
};

// Start the orchestrator
async function main() {
  const orchestrator = new DevelopmentRuntimeOrchestrator(config);
  
  try {
    await orchestrator.start();
  } catch (error) {
    console.error('Failed to start development runtime:', error);
    process.exit(1);
  }
}

main();
