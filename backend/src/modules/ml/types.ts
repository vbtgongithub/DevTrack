// src/modules/ml/types.ts — Shared ML type definitions for Phase 10
// All ML subsystems reference these canonical types.

// ---------------------------------------------------------------------------
// Feature representation
// ---------------------------------------------------------------------------

export interface FeatureVector {
  values: number[];
  names: string[];
  metadata?: Record<string, unknown>;
}

export interface FeatureImportance {
  featureName: string;
  importance: number;         // 0–1 normalized
  direction: 'positive' | 'negative' | 'neutral';
}

// ---------------------------------------------------------------------------
// Model prediction envelope
// ---------------------------------------------------------------------------

export interface MLPrediction {
  score: number;
  confidence: number;         // 0–1 calibrated
  uncertainty: number;        // 0–1
  semanticCertainty: number;  // 0–1
  evidenceCoverage: number;   // 0–1
  retrievalStability: number; // 0–1
  featureImportance: FeatureImportance[];
  modelId: string;
  modelVersion: string;
  latencyMs: number;
  timestamp: string;
}

export interface ClassificationPrediction {
  label: string;
  probability: number;
  confidence: number;
  allLabels: { label: string; probability: number }[];
  modelId: string;
  modelVersion: string;
  latencyMs: number;
  timestamp: string;
}

export interface RankingPrediction {
  items: RankedItem[];
  modelId: string;
  modelVersion: string;
  latencyMs: number;
  timestamp: string;
}

export interface RankedItem {
  id: string;
  rank: number;
  score: number;
  confidence: number;
  featureImportance: FeatureImportance[];
  explanation: string[];
}

// ---------------------------------------------------------------------------
// Model metadata & configuration
// ---------------------------------------------------------------------------

export interface ModelMetadata {
  modelId: string;
  modelName: string;
  modelType: ModelType;
  version: string;
  createdAt: string;
  updatedAt: string;
  trainingDatasetId: string;
  evaluationMetrics: EvaluationMetrics;
  status: ModelStatus;
  driftStatus: DriftStatus;
  deploymentState: DeploymentState;
  checkpointPath: string | null;
  tags: string[];
}

export type ModelType =
  | 'xgboost'
  | 'lightgbm'
  | 'lambdamart'
  | 'distilbert'
  | 'classifier'
  | 'ranker'
  | 'recommender';

export type ModelStatus = 'training' | 'evaluating' | 'ready' | 'deployed' | 'deprecated' | 'failed';
export type DeploymentState = 'staged' | 'canary' | 'production' | 'rolled-back' | 'inactive';
export type DriftStatus = 'stable' | 'drifting' | 'critical' | 'unknown';

export interface MLModelConfig {
  modelId: string;
  modelType: ModelType;
  hyperparameters: Record<string, number | string | boolean>;
  featureNames: string[];
  numTrees?: number;
  maxDepth?: number;
  learningRate?: number;
  numHeads?: number;
  hiddenDim?: number;
  vocabSize?: number;
  maxSequenceLength?: number;
}

// ---------------------------------------------------------------------------
// Training & evaluation
// ---------------------------------------------------------------------------

export interface TrainingConfig {
  datasetId: string;
  modelType: ModelType;
  hyperparameters: Record<string, number | string | boolean>;
  validationSplit: number;
  maxEpochs: number;
  earlyStoppingPatience: number;
  checkpointInterval: number;
  seed: number;
}

export interface EvaluationMetrics {
  ndcg?: number;
  mrr?: number;
  precisionAtK?: Record<number, number>;
  recallAtK?: Record<number, number>;
  f1?: number;
  accuracy?: number;
  auc?: number;
  logloss?: number;
  mae?: number;
  rmse?: number;
  calibrationError?: number;
}

export interface TrainingRun {
  runId: string;
  experimentId: string;
  modelId: string;
  config: TrainingConfig;
  metrics: EvaluationMetrics;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  checkpoints: string[];
}

export interface ExperimentRecord {
  experimentId: string;
  name: string;
  description: string;
  runs: TrainingRun[];
  bestRunId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Dataset management
// ---------------------------------------------------------------------------

export interface TrainingDataset {
  datasetId: string;
  name: string;
  version: string;
  featureNames: string[];
  numSamples: number;
  numFeatures: number;
  createdAt: string;
  splits: {
    train: number;
    validation: number;
    test: number;
  };
  hash: string;
}

export interface TrainingSample {
  features: number[];
  label: number;
  weight?: number;
  queryId?: string;        // for LTR models
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Inference runtime
// ---------------------------------------------------------------------------

export interface InferenceRequest {
  requestId: string;
  modelId: string;
  input: FeatureVector | string | number[];
  priority: InferencePriority;
  timeout: number;
  options?: {
    useCache?: boolean;
    batchId?: string;
    returnExplanation?: boolean;
  };
}

export type InferencePriority = 'critical' | 'high' | 'normal' | 'low';

export interface InferenceResult {
  requestId: string;
  modelId: string;
  prediction: MLPrediction | ClassificationPrediction | RankingPrediction;
  cached: boolean;
  latencyMs: number;
  timestamp: string;
}

export interface InferenceMetrics {
  totalRequests: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  cacheHitRate: number;
  errorRate: number;
  queueDepth: number;
  activeModels: number;
}

// ---------------------------------------------------------------------------
// Governance & safety
// ---------------------------------------------------------------------------

export interface GovernancePolicy {
  policyId: string;
  policyName: string;
  modelId: string;
  constraints: GovernanceConstraint[];
  action: GovernanceAction;
  enabled: boolean;
}

export interface GovernanceConstraint {
  type: 'confidence_minimum' | 'drift_threshold' | 'latency_maximum' | 'error_rate_maximum' | 'staleness_maximum';
  threshold: number;
  currentValue?: number;
}

export type GovernanceAction = 'allow' | 'warn' | 'suppress' | 'fallback_deterministic' | 'block' | 'rollback';

export interface GovernanceViolation {
  policyId: string;
  modelId: string;
  constraintType: string;
  threshold: number;
  actualValue: number;
  action: GovernanceAction;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Gradient boosted tree structures (internal model representation)
// ---------------------------------------------------------------------------

export interface TreeNode {
  featureIndex: number;
  threshold: number;
  leftChild: TreeNode | TreeLeaf;
  rightChild: TreeNode | TreeLeaf;
}

export interface TreeLeaf {
  value: number;
}

export interface DecisionTree {
  root: TreeNode | TreeLeaf;
  numLeaves: number;
  maxDepth: number;
}

export interface GradientBoostedModel {
  trees: DecisionTree[];
  learningRate: number;
  baseScore: number;
  featureNames: string[];
  featureImportances: number[];
}

// ---------------------------------------------------------------------------
// Transformer structures (DistilBERT internals)
// ---------------------------------------------------------------------------

export interface TransformerConfig {
  vocabSize: number;
  hiddenDim: number;
  numHeads: number;
  numLayers: number;
  intermediateSize: number;
  maxPositionEmbeddings: number;
  dropoutRate: number;
  attentionDropoutRate: number;
}

export interface AttentionOutput {
  contextVector: number[];
  attentionWeights: number[][];
}

export interface TransformerLayerOutput {
  hiddenStates: number[][];
  attentionWeights: number[][];
}

// ---------------------------------------------------------------------------
// Calibration
// ---------------------------------------------------------------------------

export interface CalibrationResult {
  rawScore: number;
  calibratedConfidence: number;
  calibrationMethod: 'platt_scaling' | 'isotonic_regression' | 'temperature_scaling';
  calibrationError: number;
}

export interface CalibrationConfig {
  method: 'platt_scaling' | 'isotonic_regression' | 'temperature_scaling';
  binCount: number;
  minSamples: number;
}

// ---------------------------------------------------------------------------
// Online evaluation
// ---------------------------------------------------------------------------

export interface OnlineMetric {
  metricName: string;
  value: number;
  window: 'realtime' | '1h' | '24h' | '7d';
  sampleCount: number;
  timestamp: string;
}

export interface DriftReport {
  modelId: string;
  featureDrift: { featureName: string; psiScore: number; drifted: boolean }[];
  predictionDrift: { metricName: string; baseline: number; current: number; drifted: boolean }[];
  overallDriftStatus: DriftStatus;
  detectedAt: string;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export function isTreeLeaf(node: TreeNode | TreeLeaf): node is TreeLeaf {
  return 'value' in node && !('featureIndex' in node);
}

export function generateRequestId(): string {
  return `ml-req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function generateModelId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
