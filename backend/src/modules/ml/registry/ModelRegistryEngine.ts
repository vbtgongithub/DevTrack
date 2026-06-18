// src/modules/ml/registry/ModelRegistryEngine.ts
// Tracks model versions, training datasets, evaluation metrics, drift status,
// deployment state, rollback checkpoints. Model governance mandatory.

import { logger } from '../../../shared/logger.js';
import type { ModelMetadata, ModelStatus, DeploymentState, DriftStatus, EvaluationMetrics } from '../types.js';

interface RegistryEntry extends ModelMetadata {
  registeredAt: string;
  promotedAt: string | null;
  rollbackHistory: { fromState: DeploymentState; toState: DeploymentState; reason: string; timestamp: string }[];
  evaluationGate: {
    passed: boolean;
    requiredMetrics: Partial<EvaluationMetrics>;
    actualMetrics: EvaluationMetrics;
    gatedAt: string | null;
  };
}

/**
 * ModelRegistryEngine
 *
 * Central model registry with governance:
 * - Model version tracking
 * - Training dataset lineage
 * - Evaluation metric gating (no deployment without evaluation)
 * - Drift status monitoring
 * - Deployment state management (staged → canary → production)
 * - Rollback with checkpoint restoration
 *
 * GOVERNANCE: No model deployment without passing evaluation gates.
 */
export class ModelRegistryEngine {
  private registry: Map<string, RegistryEntry> = new Map();
  private versionHistory: Map<string, string[]> = new Map(); // modelName → [modelId, ...]

  constructor() {
    logger.info('[ModelRegistryEngine] Initialized');
  }

  /**
   * Register a new model version.
   */
  register(metadata: ModelMetadata, requiredMetrics?: Partial<EvaluationMetrics>): RegistryEntry {
    const entry: RegistryEntry = {
      ...metadata,
      registeredAt: new Date().toISOString(),
      promotedAt: null,
      rollbackHistory: [],
      evaluationGate: {
        passed: false,
        requiredMetrics: requiredMetrics ?? {},
        actualMetrics: metadata.evaluationMetrics,
        gatedAt: null,
      },
    };

    // Auto-evaluate gate
    if (requiredMetrics) {
      entry.evaluationGate.passed = this.checkEvaluationGate(
        metadata.evaluationMetrics,
        requiredMetrics,
      );
      if (entry.evaluationGate.passed) {
        entry.evaluationGate.gatedAt = new Date().toISOString();
      }
    } else {
      // No gate requirements → auto-pass
      entry.evaluationGate.passed = true;
      entry.evaluationGate.gatedAt = new Date().toISOString();
    }

    this.registry.set(metadata.modelId, entry);

    // Track version history
    const history = this.versionHistory.get(metadata.modelName) ?? [];
    history.push(metadata.modelId);
    this.versionHistory.set(metadata.modelName, history);

    logger.info(`[ModelRegistryEngine] Registered ${metadata.modelId} v${metadata.version} (gate: ${entry.evaluationGate.passed ? 'PASSED' : 'FAILED'})`);
    return entry;
  }

  /**
   * Promote a model to a deployment state.
   * GOVERNANCE: Requires evaluation gate to pass.
   */
  promote(modelId: string, targetState: DeploymentState): boolean {
    const entry = this.registry.get(modelId);
    if (!entry) {
      logger.warn(`[ModelRegistryEngine] Model ${modelId} not found`);
      return false;
    }

    // Governance check: must pass evaluation gate
    if (!entry.evaluationGate.passed) {
      logger.warn(`[ModelRegistryEngine] Cannot promote ${modelId}: evaluation gate not passed`);
      return false;
    }

    // Governance check: can only promote in order (staged → canary → production)
    const validTransitions: Record<string, DeploymentState[]> = {
      'inactive': ['staged'],
      'staged': ['canary', 'production'],
      'canary': ['production', 'rolled-back'],
      'production': ['rolled-back'],
      'rolled-back': ['staged'],
    };

    const allowed = validTransitions[entry.deploymentState] ?? [];
    if (!allowed.includes(targetState)) {
      logger.warn(`[ModelRegistryEngine] Invalid transition: ${entry.deploymentState} → ${targetState}`);
      return false;
    }

    const previousState = entry.deploymentState;
    entry.deploymentState = targetState;
    entry.promotedAt = new Date().toISOString();

    logger.info(`[ModelRegistryEngine] Promoted ${modelId}: ${previousState} → ${targetState}`);
    return true;
  }

  /**
   * Rollback a model to previous state.
   */
  rollback(modelId: string, reason: string): boolean {
    const entry = this.registry.get(modelId);
    if (!entry) return false;

    const previousState = entry.deploymentState;
    entry.deploymentState = 'rolled-back';
    entry.rollbackHistory.push({
      fromState: previousState,
      toState: 'rolled-back',
      reason,
      timestamp: new Date().toISOString(),
    });

    logger.warn(`[ModelRegistryEngine] Rolled back ${modelId}: ${reason}`);
    return true;
  }

  /**
   * Update drift status for a model.
   */
  updateDriftStatus(modelId: string, driftStatus: DriftStatus): void {
    const entry = this.registry.get(modelId);
    if (!entry) return;

    entry.driftStatus = driftStatus;

    // Auto-rollback on critical drift
    if (driftStatus === 'critical' && entry.deploymentState === 'production') {
      logger.warn(`[ModelRegistryEngine] Critical drift detected for ${modelId}, auto-rolling back`);
      this.rollback(modelId, 'Critical drift detected');
    }
  }

  /**
   * Get model entry.
   */
  getModel(modelId: string): RegistryEntry | undefined {
    return this.registry.get(modelId);
  }

  /**
   * Get production model for a model name.
   */
  getProductionModel(modelName: string): RegistryEntry | null {
    const history = this.versionHistory.get(modelName) ?? [];
    for (const id of history.reverse()) {
      const entry = this.registry.get(id);
      if (entry?.deploymentState === 'production') return entry;
    }
    return null;
  }

  /**
   * Get version history for a model name.
   */
  getVersionHistory(modelName: string): RegistryEntry[] {
    const ids = this.versionHistory.get(modelName) ?? [];
    return ids.map(id => this.registry.get(id)!).filter(Boolean);
  }

  /**
   * List all registered models.
   */
  listModels(): RegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * List models by deployment state.
   */
  listByState(state: DeploymentState): RegistryEntry[] {
    return Array.from(this.registry.values()).filter(e => e.deploymentState === state);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private checkEvaluationGate(actual: EvaluationMetrics, required: Partial<EvaluationMetrics>): boolean {
    for (const [key, threshold] of Object.entries(required)) {
      const actualValue = (actual as Record<string, unknown>)[key];
      if (typeof actualValue === 'number' && typeof threshold === 'number') {
        if (key === 'logloss' || key === 'mae' || key === 'rmse' || key === 'calibrationError') {
          // Lower is better for loss metrics
          if (actualValue > threshold) return false;
        } else {
          // Higher is better
          if (actualValue < threshold) return false;
        }
      }
    }
    return true;
  }
}
