// src/modules/runtime-orchestration/index.ts — Runtime Orchestration barrel export
// Phase-F: Integration + Activation Runtime

// Orchestrator
export { retentionRuntimeOrchestrator, type OrchestrationStage, type OrchestrationContext, type OrchestrationCheckpoint } from './orchestrator/index.js';

// Priority Hierarchy
export { priorityHierarchy, type SystemPriority, type BehavioralSystem, type PriorityRule, type PriorityViolation } from './priority/index.js';

// Activation Framework
export { activationFramework, type ActivationLevel, type ActivationStatus, type FeatureActivation, type ActivationTransition, type CohortAllocation } from './activation/index.js';

// Kill Switch
export { killSwitchService, type SwitchTarget, type SwitchState, type KillSwitch, type KillSwitchAudit } from './killSwitch/index.js';

// Execution Pipeline
export { executionPipeline, type EventCategory, type MiddlewareType, type PipelineEvent, type PipelineMiddleware, type PipelineMetrics } from './pipeline/index.js';

// Safety Enforcement
export { safetyEnforcement, type SafetyPolicy, type SafetyViolation, type SafetyState } from './safety/index.js';

// Operator Control Panel
export { operatorControlPanel, type OperationalControl, type OperatorAction } from './controlPanel/index.js';

// Runtime Observability
export { runtimeObservability, type OrchestrationMetric, type SystemHealth, type BehavioralFlow } from './observability/index.js';