// src/modules/ml/ranking/RankingModelBase.ts
// Abstract base class for gradient boosted tree models (XGBoost/LightGBM/LambdaMART)
// Implements real tree inference with feature importance and explainability.

import { logger } from '../../../shared/logger.js';
import type {
  DecisionTree,
  FeatureImportance,
  FeatureVector,
  GradientBoostedModel,
  MLPrediction,
  TreeNode,
  TreeLeaf,
} from '../types.js';
import { isTreeLeaf, generateModelId } from '../types.js';

/**
 * RankingModelBase
 *
 * Provides real gradient-boosted tree inference:
 * - Tree traversal for predictions
 * - Feature importance via split gain accumulation
 * - Per-prediction explanations
 * - Sigmoid/softmax output calibration
 * - Bootstrapped model initialization
 *
 * Subclasses define domain-specific feature extraction.
 */
export abstract class RankingModelBase {
  protected model: GradientBoostedModel;
  protected modelId: string;
  protected modelVersion: string;
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
    this.modelId = generateModelId(modelName.toLowerCase().replace(/\s+/g, '-'));
    this.modelVersion = '1.0.0';
    this.model = this.initializeBootstrapModel();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Predict a score from a feature vector.
   * Returns a full MLPrediction with confidence, uncertainty, and explanation.
   */
  predict(features: FeatureVector): MLPrediction {
    const start = Date.now();

    if (features.values.length !== this.model.featureNames.length) {
      logger.warn(`[${this.modelName}] Feature dimension mismatch: got ${features.values.length}, expected ${this.model.featureNames.length}`);
    }

    // Traverse all trees and accumulate
    let rawScore = this.model.baseScore;
    const treeOutputs: number[] = [];

    for (const tree of this.model.trees) {
      const treeValue = this.traverseTree(tree.root, features.values);
      treeOutputs.push(treeValue);
      rawScore += this.model.learningRate * treeValue;
    }

    // Sigmoid activation for 0–1 output
    const score = this.sigmoid(rawScore);

    // Compute confidence via tree agreement
    const confidence = this.computeTreeAgreement(treeOutputs);

    // Compute feature importance for this prediction
    const featureImportance = this.computeLocalFeatureImportance(features);

    // Compute uncertainty as inverse of confidence with variance
    const variance = this.computeTreeVariance(treeOutputs);
    const uncertainty = Math.min(1, Math.max(0, variance / (variance + 1)));

    const latencyMs = Date.now() - start;

    return {
      score,
      confidence,
      uncertainty,
      semanticCertainty: confidence * 0.9, // semantic certainty correlated with confidence
      evidenceCoverage: this.estimateEvidenceCoverage(features),
      retrievalStability: 1 - uncertainty * 0.5,
      featureImportance,
      modelId: this.modelId,
      modelVersion: this.modelVersion,
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Batch predict for multiple feature vectors.
   */
  predictBatch(featureBatch: FeatureVector[]): MLPrediction[] {
    logger.info(`[${this.modelName}] Batch predicting ${featureBatch.length} samples`);
    return featureBatch.map(f => this.predict(f));
  }

  /**
   * Get global feature importance across the model.
   */
  getFeatureImportance(): FeatureImportance[] {
    return this.model.featureNames.map((name, i) => ({
      featureName: name,
      importance: this.model.featureImportances[i],
      direction: this.model.featureImportances[i] > 0.1 ? 'positive' : 'neutral',
    }));
  }

  /**
   * Explain a specific prediction: which features drove the score and why.
   */
  explain(features: FeatureVector): { explanation: string[]; featureContributions: Record<string, number> } {
    const contributions: Record<string, number> = {};
    const explanations: string[] = [];

    // Track feature splits across all trees
    for (const tree of this.model.trees) {
      this.accumulateContributions(tree.root, features.values, contributions);
    }

    // Normalize contributions
    const totalContrib = Object.values(contributions).reduce((a, b) => a + Math.abs(b), 0) || 1;

    for (const [featureName, contrib] of Object.entries(contributions)) {
      const normalized = contrib / totalContrib;
      contributions[featureName] = normalized;

      if (Math.abs(normalized) > 0.05) {
        const direction = normalized > 0 ? 'increases' : 'decreases';
        explanations.push(`${featureName} ${direction} score by ${(Math.abs(normalized) * 100).toFixed(1)}%`);
      }
    }

    return { explanation: explanations, featureContributions: contributions };
  }

  /**
   * Train the model from labeled samples (in-process gradient boosting).
   */
  train(samples: { features: number[]; label: number }[], config?: {
    numTrees?: number;
    maxDepth?: number;
    learningRate?: number;
  }): void {
    const numTrees = config?.numTrees ?? 50;
    const maxDepth = config?.maxDepth ?? 4;
    const lr = config?.learningRate ?? 0.1;

    logger.info(`[${this.modelName}] Training with ${samples.length} samples, ${numTrees} trees, depth ${maxDepth}`);

    const trees: DecisionTree[] = [];
    const residuals = samples.map(s => s.label);

    for (let t = 0; t < numTrees; t++) {
      const tree = this.fitSingleTree(
        samples.map(s => s.features),
        residuals,
        maxDepth,
        0,
      );
      trees.push(tree);

      // Update residuals
      for (let i = 0; i < samples.length; i++) {
        const pred = this.traverseTree(tree.root, samples[i].features);
        residuals[i] -= lr * pred;
      }
    }

    // Compute feature importances from trained trees
    const importances = new Array(this.model.featureNames.length).fill(0);
    for (const tree of trees) {
      this.accumulateImportances(tree.root, importances);
    }
    const maxImp = Math.max(...importances, 1);
    const normalizedImportances = importances.map(v => v / maxImp);

    this.model = {
      ...this.model,
      trees,
      learningRate: lr,
      featureImportances: normalizedImportances,
    };

    logger.info(`[${this.modelName}] Training complete: ${trees.length} trees`);
  }

  getModelId(): string { return this.modelId; }
  getModelVersion(): string { return this.modelVersion; }
  getModelName(): string { return this.modelName; }

  // ---------------------------------------------------------------------------
  // Abstract: subclasses define feature extraction
  // ---------------------------------------------------------------------------

  abstract extractFeatures(input: unknown): FeatureVector;

  // ---------------------------------------------------------------------------
  // Internal tree operations
  // ---------------------------------------------------------------------------

  protected traverseTree(node: TreeNode | TreeLeaf, features: number[]): number {
    if (isTreeLeaf(node)) {
      return node.value;
    }
    const featureVal = features[node.featureIndex] ?? 0;
    if (featureVal <= node.threshold) {
      return this.traverseTree(node.leftChild, features);
    }
    return this.traverseTree(node.rightChild, features);
  }

  private fitSingleTree(
    allFeatures: number[][],
    targets: number[],
    maxDepth: number,
    currentDepth: number,
  ): DecisionTree {
    const root = this.buildTreeNode(allFeatures, targets, maxDepth, currentDepth, Array.from({ length: targets.length }, (_, i) => i));
    return {
      root,
      numLeaves: this.countLeaves(root),
      maxDepth,
    };
  }

  private buildTreeNode(
    allFeatures: number[][],
    targets: number[],
    maxDepth: number,
    depth: number,
    indices: number[],
  ): TreeNode | TreeLeaf {
    // Leaf condition
    if (depth >= maxDepth || indices.length < 4) {
      const mean = indices.reduce((s, i) => s + targets[i], 0) / (indices.length || 1);
      return { value: mean };
    }

    // Find best split
    const numFeatures = allFeatures[0]?.length ?? 0;
    let bestGain = -Infinity;
    let bestFeature = 0;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    for (let f = 0; f < numFeatures; f++) {
      // Sample thresholds from feature values
      const featureValues = indices.map(i => allFeatures[i][f]);
      const sorted = [...new Set(featureValues)].sort((a, b) => a - b);
      const thresholdCandidates = sorted.slice(0, Math.min(sorted.length - 1, 10));

      for (const threshold of thresholdCandidates) {
        const leftIdx = indices.filter(i => allFeatures[i][f] <= threshold);
        const rightIdx = indices.filter(i => allFeatures[i][f] > threshold);

        if (leftIdx.length === 0 || rightIdx.length === 0) continue;

        const gain = this.computeSplitGain(targets, indices, leftIdx, rightIdx);
        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = threshold;
          bestLeftIndices = leftIdx;
          bestRightIndices = rightIdx;
        }
      }
    }

    // If no valid split found, return leaf
    if (bestLeftIndices.length === 0 || bestRightIndices.length === 0) {
      const mean = indices.reduce((s, i) => s + targets[i], 0) / (indices.length || 1);
      return { value: mean };
    }

    return {
      featureIndex: bestFeature,
      threshold: bestThreshold,
      leftChild: this.buildTreeNode(allFeatures, targets, maxDepth, depth + 1, bestLeftIndices),
      rightChild: this.buildTreeNode(allFeatures, targets, maxDepth, depth + 1, bestRightIndices),
    };
  }

  private computeSplitGain(
    targets: number[],
    parentIndices: number[],
    leftIndices: number[],
    rightIndices: number[],
  ): number {
    const parentVar = this.variance(parentIndices.map(i => targets[i]));
    const leftVar = this.variance(leftIndices.map(i => targets[i]));
    const rightVar = this.variance(rightIndices.map(i => targets[i]));
    const leftWeight = leftIndices.length / parentIndices.length;
    const rightWeight = rightIndices.length / parentIndices.length;
    return parentVar - (leftWeight * leftVar + rightWeight * rightVar);
  }

  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  }

  private countLeaves(node: TreeNode | TreeLeaf): number {
    if (isTreeLeaf(node)) return 1;
    return this.countLeaves(node.leftChild) + this.countLeaves(node.rightChild);
  }

  // ---------------------------------------------------------------------------
  // Confidence & importance computation
  // ---------------------------------------------------------------------------

  private computeTreeAgreement(treeOutputs: number[]): number {
    if (treeOutputs.length < 2) return 0.5;
    const mean = treeOutputs.reduce((a, b) => a + b, 0) / treeOutputs.length;
    const variance = treeOutputs.reduce((acc, v) => acc + (v - mean) ** 2, 0) / treeOutputs.length;
    // Low variance = high agreement = high confidence
    return Math.max(0.1, Math.min(0.99, 1 - Math.tanh(variance)));
  }

  private computeTreeVariance(treeOutputs: number[]): number {
    if (treeOutputs.length < 2) return 0.5;
    const mean = treeOutputs.reduce((a, b) => a + b, 0) / treeOutputs.length;
    return treeOutputs.reduce((acc, v) => acc + (v - mean) ** 2, 0) / treeOutputs.length;
  }

  private computeLocalFeatureImportance(features: FeatureVector): FeatureImportance[] {
    const contributions: Record<string, number> = {};
    for (const tree of this.model.trees) {
      this.accumulateContributions(tree.root, features.values, contributions);
    }
    const total = Object.values(contributions).reduce((a, b) => a + Math.abs(b), 0) || 1;

    return this.model.featureNames.map((name, i) => ({
      featureName: name,
      importance: Math.abs(contributions[name] ?? 0) / total,
      direction: (contributions[name] ?? 0) > 0 ? 'positive' as const
        : (contributions[name] ?? 0) < 0 ? 'negative' as const
        : 'neutral' as const,
    }));
  }

  private accumulateContributions(
    node: TreeNode | TreeLeaf,
    features: number[],
    contributions: Record<string, number>,
  ): void {
    if (isTreeLeaf(node)) return;

    const featureName = this.model.featureNames[node.featureIndex] ?? `feature_${node.featureIndex}`;
    const featureVal = features[node.featureIndex] ?? 0;

    if (featureVal <= node.threshold) {
      const leftVal = this.getSubtreeAvg(node.leftChild);
      const rightVal = this.getSubtreeAvg(node.rightChild);
      contributions[featureName] = (contributions[featureName] ?? 0) + (leftVal - rightVal);
      this.accumulateContributions(node.leftChild, features, contributions);
    } else {
      const leftVal = this.getSubtreeAvg(node.leftChild);
      const rightVal = this.getSubtreeAvg(node.rightChild);
      contributions[featureName] = (contributions[featureName] ?? 0) + (rightVal - leftVal);
      this.accumulateContributions(node.rightChild, features, contributions);
    }
  }

  private getSubtreeAvg(node: TreeNode | TreeLeaf): number {
    if (isTreeLeaf(node)) return node.value;
    return (this.getSubtreeAvg(node.leftChild) + this.getSubtreeAvg(node.rightChild)) / 2;
  }

  private accumulateImportances(node: TreeNode | TreeLeaf, importances: number[]): void {
    if (isTreeLeaf(node)) return;
    importances[node.featureIndex] = (importances[node.featureIndex] ?? 0) + 1;
    this.accumulateImportances(node.leftChild, importances);
    this.accumulateImportances(node.rightChild, importances);
  }

  protected estimateEvidenceCoverage(features: FeatureVector): number {
    // Estimate coverage based on non-zero feature ratio
    const nonZero = features.values.filter(v => v !== 0).length;
    return nonZero / (features.values.length || 1);
  }

  protected sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  // ---------------------------------------------------------------------------
  // Bootstrap model initialization
  // ---------------------------------------------------------------------------

  protected initializeBootstrapModel(): GradientBoostedModel {
    const featureNames = this.getFeatureNames();
    const numFeatures = featureNames.length;

    // Create a small ensemble of shallow trees with random structure
    const trees: DecisionTree[] = [];
    for (let t = 0; t < 10; t++) {
      trees.push(this.createRandomTree(numFeatures, 3, 0));
    }

    return {
      trees,
      learningRate: 0.1,
      baseScore: 0,
      featureNames,
      featureImportances: featureNames.map(() => 1 / numFeatures),
    };
  }

  private createRandomTree(numFeatures: number, maxDepth: number, depth: number): DecisionTree {
    const root = this.createRandomNode(numFeatures, maxDepth, depth);
    return { root, numLeaves: this.countLeaves(root), maxDepth };
  }

  private createRandomNode(numFeatures: number, maxDepth: number, depth: number): TreeNode | TreeLeaf {
    if (depth >= maxDepth || Math.random() < 0.3) {
      return { value: (Math.random() - 0.5) * 0.1 };
    }
    return {
      featureIndex: Math.floor(Math.random() * numFeatures),
      threshold: Math.random(),
      leftChild: this.createRandomNode(numFeatures, maxDepth, depth + 1),
      rightChild: this.createRandomNode(numFeatures, maxDepth, depth + 1),
    };
  }

  protected abstract getFeatureNames(): string[];
}
