// src/modules/ml/governance/MLGovernanceLayer.ts
// Enforces confidence minimums, drift detection, unsafe model blocking,
// degraded-mode inference, rollback protection, model explainability.
// ML systems remain bounded, observable, and explainable.

import { logger } from '../../../shared/logger.js';
import type {
  GovernancePolicy,
  GovernanceConstraint,
  GovernanceAction,
  GovernanceViolation,
  MLPrediction,
  ModelMetadata,
  DriftStatus,
} from '../types.js';

interface GovernanceDecision {
  allowed: boolean;
  action: GovernanceAction;
  violations: GovernanceViolation[];
  explanation: string[];
}

interface ModelSafetyCheck {
  modelId: string;
  safe: boolean;
  concerns: string[];
  timestamp: string;
}

/**
 * MLGovernanceLayer
 *
 * Enforces ML safety and governance:
 * 1. Confidence minimums — block predictions below threshold
 * 2. Drift detection — suppress drifting models
 * 3. Unsafe model blocking — prevent deployment of untested models
 * 4. Degraded-mode inference — fallback to deterministic when ML fails
 * 5. Rollback protection — auto-rollback on governance violations
 * 6. Model explainability — require explanation for all outputs
 *
 * INVARIANT: ML systems remain bounded, observable, and explainable.
 * No black-box intelligence. No uncontrolled autonomous reasoning.
 */
export class MLGovernanceLayer {
  private policies: Map<string, GovernancePolicy> = new Map();
  private violations: GovernanceViolation[] = [];
  private blockedModels: Set<string> = new Set();

  // Global thresholds
  private globalConfidenceMinimum: number;
  private globalLatencyMaximumMs: number;
  private globalErrorRateMaximum: number;
  private maxViolationsBeforeBlock: number;

  constructor(config?: {
    confidenceMinimum?: number;
    latencyMaximumMs?: number;
    errorRateMaximum?: number;
    maxViolationsBeforeBlock?: number;
  }) {
    this.globalConfidenceMinimum = config?.confidenceMinimum ?? 0.2;
    this.globalLatencyMaximumMs = config?.latencyMaximumMs ?? 5000;
    this.globalErrorRateMaximum = config?.errorRateMaximum ?? 0.1;
    this.maxViolationsBeforeBlock = config?.maxViolationsBeforeBlock ?? 5;

    logger.info('[MLGovernanceLayer] Initialized', {
      confidenceMinimum: this.globalConfidenceMinimum,
      latencyMaximumMs: this.globalLatencyMaximumMs,
    });
  }

  /**
   * Register a governance policy for a model.
   */
  registerPolicy(policy: GovernancePolicy): void {
    this.policies.set(policy.policyId, policy);
    logger.info(`[MLGovernance] Policy registered: ${policy.policyName} for model ${policy.modelId}`);
  }

  /**
   * Evaluate whether a prediction should be allowed.
   */
  evaluatePrediction(prediction: MLPrediction): GovernanceDecision {
    const violations: GovernanceViolation[] = [];
    const explanations: string[] = [];

    // 1. Global confidence minimum
    if (prediction.confidence < this.globalConfidenceMinimum) {
      violations.push({
        policyId: 'global_confidence',
        modelId: prediction.modelId,
        constraintType: 'confidence_minimum',
        threshold: this.globalConfidenceMinimum,
        actualValue: prediction.confidence,
        action: 'suppress',
        timestamp: new Date().toISOString(),
      });
      explanations.push(`Confidence ${prediction.confidence.toFixed(3)} below minimum ${this.globalConfidenceMinimum}`);
    }

    // 2. Latency check
    if (prediction.latencyMs > this.globalLatencyMaximumMs) {
      violations.push({
        policyId: 'global_latency',
        modelId: prediction.modelId,
        constraintType: 'latency_maximum',
        threshold: this.globalLatencyMaximumMs,
        actualValue: prediction.latencyMs,
        action: 'warn',
        timestamp: new Date().toISOString(),
      });
      explanations.push(`Latency ${prediction.latencyMs}ms exceeds maximum ${this.globalLatencyMaximumMs}ms`);
    }

    // 3. Check model-specific policies
    for (const policy of this.policies.values()) {
      if (policy.modelId !== prediction.modelId || !policy.enabled) continue;

      for (const constraint of policy.constraints) {
        const currentValue = this.getConstraintValue(constraint.type, prediction);
        if (currentValue !== null && !this.checkConstraint(constraint, currentValue)) {
          violations.push({
            policyId: policy.policyId,
            modelId: policy.modelId,
            constraintType: constraint.type,
            threshold: constraint.threshold,
            actualValue: currentValue,
            action: policy.action,
            timestamp: new Date().toISOString(),
          });
          explanations.push(`Policy "${policy.policyName}": ${constraint.type} = ${currentValue.toFixed(3)}, threshold = ${constraint.threshold}`);
        }
      }
    }

    // 4. Check if model is blocked
    if (this.blockedModels.has(prediction.modelId)) {
      violations.push({
        policyId: 'model_blocked',
        modelId: prediction.modelId,
        constraintType: 'confidence_minimum',
        threshold: 0,
        actualValue: 0,
        action: 'block',
        timestamp: new Date().toISOString(),
      });
      explanations.push(`Model ${prediction.modelId} is blocked due to governance violations`);
    }

    // Record violations
    this.violations.push(...violations);

    // Check if we should auto-block the model
    this.checkAutoBlock(prediction.modelId);

    // Determine action
    const allowed = violations.length === 0;
    const action = this.determineAction(violations);

    return {
      allowed,
      action,
      violations,
      explanation: explanations,
    };
  }

  /**
   * Check model safety before deployment.
   */
  checkModelSafety(metadata: ModelMetadata): ModelSafetyCheck {
    const concerns: string[] = [];

    // Must have evaluation metrics
    const metrics = metadata.evaluationMetrics;
    if (!metrics.ndcg && !metrics.f1 && !metrics.accuracy) {
      concerns.push('No evaluation metrics available — model not tested');
    }

    // Must not be drifting
    if (metadata.driftStatus === 'critical') {
      concerns.push('Model has critical drift — unsafe for deployment');
    }

    // Must have a version
    if (!metadata.version) {
      concerns.push('Model has no version — unversioned models cannot be governed');
    }

    // Must have a training dataset
    if (!metadata.trainingDatasetId) {
      concerns.push('No training dataset linked — lineage not traceable');
    }

    // Check quality thresholds
    if (metrics.accuracy !== undefined && metrics.accuracy < 0.5) {
      concerns.push(`Accuracy ${metrics.accuracy.toFixed(3)} below acceptable threshold (0.5)`);
    }
    if (metrics.f1 !== undefined && metrics.f1 < 0.3) {
      concerns.push(`F1 score ${metrics.f1.toFixed(3)} below acceptable threshold (0.3)`);
    }

    return {
      modelId: metadata.modelId,
      safe: concerns.length === 0,
      concerns,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle drift detection for a model.
   */
  handleDrift(modelId: string, driftStatus: DriftStatus): GovernanceAction {
    switch (driftStatus) {
      case 'stable':
        return 'allow';
      case 'drifting':
        logger.warn(`[MLGovernance] Model ${modelId} is drifting — monitoring`);
        return 'warn';
      case 'critical':
        logger.warn(`[MLGovernance] Model ${modelId} has critical drift — suppressing`);
        this.blockedModels.add(modelId);
        return 'fallback_deterministic';
      default:
        return 'allow';
    }
  }

  /**
   * Unblock a model (after fixes).
   */
  unblockModel(modelId: string): void {
    this.blockedModels.delete(modelId);
    logger.info(`[MLGovernance] Model ${modelId} unblocked`);
  }

  /**
   * Get all violations.
   */
  getViolations(modelId?: string): GovernanceViolation[] {
    if (modelId) return this.violations.filter(v => v.modelId === modelId);
    return this.violations;
  }

  /**
   * Get governance status summary.
   */
  getStatus(): {
    totalPolicies: number;
    totalViolations: number;
    blockedModels: string[];
    recentViolations: GovernanceViolation[];
  } {
    return {
      totalPolicies: this.policies.size,
      totalViolations: this.violations.length,
      blockedModels: Array.from(this.blockedModels),
      recentViolations: this.violations.slice(-10),
    };
  }

  /**
   * Require explainability for a prediction.
   * Returns true if the prediction has sufficient explanation.
   */
  requireExplainability(prediction: MLPrediction): {
    explainable: boolean;
    missingElements: string[];
  } {
    const missing: string[] = [];

    if (prediction.featureImportance.length === 0) {
      missing.push('No feature importance available');
    }
    if (prediction.confidence === 0) {
      missing.push('Confidence is zero — prediction cannot be trusted');
    }
    if (prediction.evidenceCoverage < 0.1) {
      missing.push('Evidence coverage too low — prediction not well-grounded');
    }

    return { explainable: missing.length === 0, missingElements: missing };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private getConstraintValue(type: GovernanceConstraint['type'], prediction: MLPrediction): number | null {
    switch (type) {
      case 'confidence_minimum': return prediction.confidence;
      case 'latency_maximum': return prediction.latencyMs;
      default: return null;
    }
  }

  private checkConstraint(constraint: GovernanceConstraint, currentValue: number): boolean {
    switch (constraint.type) {
      case 'confidence_minimum': return currentValue >= constraint.threshold;
      case 'latency_maximum': return currentValue <= constraint.threshold;
      case 'error_rate_maximum': return currentValue <= constraint.threshold;
      case 'drift_threshold': return currentValue <= constraint.threshold;
      case 'staleness_maximum': return currentValue <= constraint.threshold;
      default: return true;
    }
  }

  private determineAction(violations: GovernanceViolation[]): GovernanceAction {
    if (violations.length === 0) return 'allow';

    // Highest severity wins
    const actionPriority: GovernanceAction[] = [
      'block', 'rollback', 'fallback_deterministic', 'suppress', 'warn', 'allow',
    ];
    let worstAction: GovernanceAction = 'allow';

    for (const violation of violations) {
      const currentPriority = actionPriority.indexOf(violation.action);
      const worstPriority = actionPriority.indexOf(worstAction);
      if (currentPriority < worstPriority) worstAction = violation.action;
    }

    return worstAction;
  }

  private checkAutoBlock(modelId: string): void {
    const recentViolations = this.violations
      .filter(v => v.modelId === modelId)
      .filter(v => Date.now() - new Date(v.timestamp).getTime() < 300_000); // last 5 min

    if (recentViolations.length >= this.maxViolationsBeforeBlock) {
      logger.warn(`[MLGovernance] Auto-blocking model ${modelId}: ${recentViolations.length} violations in 5 min`);
      this.blockedModels.add(modelId);
    }
  }
}
