// src/modules/ml/index.ts
// ML Module Entry Point - Consolidated Exports
// Organized by operational priority: Core systems first, then infrastructure

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------
export * from './types.js';

// ---------------------------------------------------------------------------
// CORE OPERATIONAL SYSTEMS (Active in production)
// ---------------------------------------------------------------------------

// 1. Real DistilBERT Transformer Execution (Deprecated & simplified to SemanticClassificationEngine)

// 2. Ranking Model Infrastructure
export { RankingModelBase } from './ranking/RankingModelBase.js';
export { ResumeRankingModel } from './ranking/ResumeRankingModel.js';
export { RecruiterAlignmentModel } from './ranking/RecruiterAlignmentModel.js';
export { RecommendationRankingModel } from './ranking/RecommendationRankingModel.js';
export { ATSOptimizationRanker } from './ranking/ATSOptimizationRanker.js';
export { ProjectCredibilityRanker } from './ranking/ProjectCredibilityRanker.js';

// 3. Model Serving Layer
export { MLServingInfrastructure } from './serving/MLServingInfrastructure.js';
export { ModelInferenceGateway } from './serving/ModelInferenceGateway.js';
export { InferenceQueueManager } from './serving/InferenceQueueManager.js';
export { ModelExecutionRouter } from './serving/ModelExecutionRouter.js';

// 4. Training Pipeline Infrastructure
export { MLTrainingPipeline } from './training/MLTrainingPipeline.js';
export { TrainingDatasetCompiler } from './training/TrainingDatasetCompiler.js';
export { ExperimentTracker } from './training/ExperimentTracker.js';

// ---------------------------------------------------------------------------
// SECONDARY SYSTEMS (Used but less frequently)
// ---------------------------------------------------------------------------

// 5. Hybrid Ranking
export { HybridRankingEngine } from './hybrid/HybridRankingEngine.js';

// 6. Retrieval Systems
export { SemanticRetrievalRanker } from './retrieval/SemanticRetrievalRanker.js';
export { SemanticClassificationEngine } from './classification/SemanticClassificationEngine.js';

// 7. Recommendation Systems
export { RecommendationLearningEngine } from './recommendation/RecommendationLearningEngine.js';

// ---------------------------------------------------------------------------
// INFRASTRUCTURE & SUPPORT (Architectural components)
// ---------------------------------------------------------------------------

// 8. Evaluation & Calibration
export { MLEvaluationRuntime } from './evaluation/MLEvaluationRuntime.js';
export { OnlineMLEvaluationEngine } from './online-eval/OnlineMLEvaluationEngine.js';
export { MLConfidenceCalibrationEngine } from './calibration/MLConfidenceCalibrationEngine.js';

// 9. Model Registry & Governance
export { ModelRegistryEngine } from './registry/ModelRegistryEngine.js';
export { MLGovernanceLayer } from './governance/MLGovernanceLayer.js';

// 10. Advanced Infrastructure (Future/Experimental)
export { MLInferenceRuntime } from './inference/MLInferenceRuntime.js';
export { FineTuningInfrastructure } from './fine-tuning/FineTuningInfrastructure.js';
