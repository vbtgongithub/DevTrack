// src/modules/ml/serving/ModelExecutionRouter.ts
// Routes inference requests to the correct model version based on registry state.

import { logger } from '../../../shared/logger.js';
import type { InferenceRequest, InferenceResult, ModelMetadata, DeploymentState } from '../types.js';

interface RouteConfig {
  modelId: string;
  versions: {
    version: string;
    deploymentState: DeploymentState;
    weight: number;  // Traffic weight for canary deployments
  }[];
  fallbackVersion: string;
}

/**
 * ModelExecutionRouter
 *
 * Routes inference requests to the correct model version.
 * Supports:
 * - Version-based routing
 * - Canary deployments (traffic splitting)
 * - Automatic fallback on failure
 * - A/B testing across model versions
 */
export class ModelExecutionRouter {
  private routes: Map<string, RouteConfig> = new Map();
  private executors: Map<string, (request: InferenceRequest) => Promise<InferenceResult>> = new Map();

  constructor() {
    logger.info('[ModelExecutionRouter] Initialized');
  }

  /**
   * Register a route for a model.
   */
  registerRoute(config: RouteConfig): void {
    this.routes.set(config.modelId, config);
    logger.info(`[ModelExecutionRouter] Route registered for ${config.modelId} with ${config.versions.length} versions`);
  }

  /**
   * Register an executor for a specific model version.
   */
  registerExecutor(modelId: string, version: string, executor: (request: InferenceRequest) => Promise<InferenceResult>): void {
    const key = `${modelId}:${version}`;
    this.executors.set(key, executor);
  }

  /**
   * Route a request to the appropriate model version.
   */
  async route(request: InferenceRequest): Promise<InferenceResult> {
    const routeConfig = this.routes.get(request.modelId);
    if (!routeConfig) {
      throw new Error(`No route configured for model ${request.modelId}`);
    }

    // Select version based on traffic weights
    const selectedVersion = this.selectVersion(routeConfig);

    // Get executor
    const executorKey = `${request.modelId}:${selectedVersion}`;
    const executor = this.executors.get(executorKey);

    if (!executor) {
      // Try fallback version
      logger.warn(`[ModelExecutionRouter] No executor for ${executorKey}, trying fallback`);
      const fallbackKey = `${request.modelId}:${routeConfig.fallbackVersion}`;
      const fallbackExecutor = this.executors.get(fallbackKey);

      if (!fallbackExecutor) {
        throw new Error(`No executor available for model ${request.modelId}`);
      }

      return fallbackExecutor(request);
    }

    try {
      return await executor(request);
    } catch (error) {
      // Fallback on failure
      logger.error(`[ModelExecutionRouter] Execution failed for ${executorKey}, trying fallback`, error);
      const fallbackKey = `${request.modelId}:${routeConfig.fallbackVersion}`;
      const fallbackExecutor = this.executors.get(fallbackKey);

      if (fallbackExecutor) {
        return fallbackExecutor(request);
      }
      throw error;
    }
  }

  /**
   * Get route configuration for a model.
   */
  getRoute(modelId: string): RouteConfig | undefined {
    return this.routes.get(modelId);
  }

  /**
   * List all registered routes.
   */
  listRoutes(): { modelId: string; versions: string[]; activeVersion: string }[] {
    return Array.from(this.routes.entries()).map(([modelId, config]) => ({
      modelId,
      versions: config.versions.map(v => v.version),
      activeVersion: config.versions.find(v => v.deploymentState === 'production')?.version ?? config.fallbackVersion,
    }));
  }

  // ---------------------------------------------------------------------------
  // Version selection (weighted random for canary)
  // ---------------------------------------------------------------------------

  private selectVersion(config: RouteConfig): string {
    const productionVersions = config.versions.filter(v =>
      v.deploymentState === 'production' || v.deploymentState === 'canary',
    );

    if (productionVersions.length === 0) {
      return config.fallbackVersion;
    }

    // If single production version, return it
    if (productionVersions.length === 1) {
      return productionVersions[0].version;
    }

    // Weighted random selection for canary
    const totalWeight = productionVersions.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const version of productionVersions) {
      random -= version.weight;
      if (random <= 0) return version.version;
    }

    return productionVersions[0].version;
  }
}
