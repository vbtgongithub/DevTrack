// src/modules/retention-ops/index.ts — Retention Operations barrel export
// Phase-E: Live Behavioral Intelligence + Retention Operations

// Command Center
export { retentionCommandCenter, type RetentionMetrics, type CohortHealth, type AdaptiveSystemStatus } from './commandCenter/index.js';

// Drift Detection
export { driftDetectionService, type DriftType, type DriftSeverity, type DriftMetric, type DriftAlert } from './driftDetection/index.js';

// Pressure Engine
export { pressureEngine, type PressureScore, type PressureConfig, type UserPressureState } from './pressure/index.js';

// Arbitration
export { arbitrationService, type AdaptiveSystem, type AdaptationAction, type SystemState, type ConflictResolution, type ArbitrationDecision } from './arbitration/index.js';

// Simulation
export { simulationService, type SimulationParameter, type SimulationScenario, type SimulationResult, type CohortSimulation } from './simulation/index.js';

// Quality Engine
export { qualityEngine, type QualityMetrics, type QualityThresholds } from './quality/index.js';

// Longitudinal Intelligence
export { longitudinalIntelligence, type LongitudinalMetrics, type BehavioralTrajectory, type AdaptationMemory } from './longitudinal/index.js';

// Incident Response
export { incidentResponseService, type IncidentType, type IncidentSeverity, type Incident, type MitigationAction } from './incidents/index.js';

// Cohort Intelligence
export { cohortIntelligence, type CohortDimension, type CohortSegment, type CohortTrend, type CohortEvolution } from './cohort/index.js';

// Emotional Coherence
export { emotionalCoherenceService, type CoherenceScore, type EmotionalState, type CoherenceViolation } from './emotional/index.js';