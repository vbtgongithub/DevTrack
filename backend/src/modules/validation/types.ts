// src/modules/validation/types.ts
// Shared types for the validation and simulation infrastructure.

export interface SimulationConfig {
  numUsers: number;
  durationDays: number;
  concurrencyLimit: number;
  seed: number;
}

export interface StressTestConfig {
  targetRps: number;
  durationSeconds: number;
  rampUpSeconds: number;
  errorThreshold: number;
  p99LatencyThresholdMs: number;
}

export interface MetricSnapshot {
  timestamp: string;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  throughputRps: number;
  queueDepth: number;
}

export interface SemanticBenchmarkResult {
  suiteName: string;
  precision: number;
  recall: number;
  f1: number;
  coverage: number;
  latencyMs: number;
  passed: boolean;
}

export interface ReplayScenario {
  scenarioId: string;
  type: 'engineering_evolution' | 'recruiter_search' | 'ats_ingestion' | 'recommendation_chain';
  events: ScenarioEvent[];
}

export interface ScenarioEvent {
  timestampOffsetMs: number;
  action: string;
  payload: Record<string, unknown>;
}
