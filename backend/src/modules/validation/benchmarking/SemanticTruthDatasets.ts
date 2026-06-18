// src/modules/validation/benchmarking/SemanticTruthDatasets.ts
// Ground truth datasets for evaluating semantic algorithms.

import { logger } from '../../../shared/logger.js';

export interface SemanticTruthPair {
  id: string;
  sourceText: string;
  targetText: string;
  truthSimilarity: number; // 0-1
  category: 'role' | 'skill' | 'project' | 'roadmap';
}

export class SemanticTruthDatasets {
  private datasets: Map<string, SemanticTruthPair[]> = new Map();

  constructor() {
    this.seedInitialTruths();
    logger.info('[SemanticTruthDatasets] Initialized');
  }

  getDataset(category: string): SemanticTruthPair[] {
    return this.datasets.get(category) || [];
  }

  private seedInitialTruths(): void {
    const roleTruths: SemanticTruthPair[] = [
      { id: 't1', sourceText: 'backend engineer', targetText: 'server side developer', truthSimilarity: 0.9, category: 'role' },
      { id: 't2', sourceText: 'frontend engineer', targetText: 'database administrator', truthSimilarity: 0.1, category: 'role' }
    ];
    this.datasets.set('role', roleTruths);

    const skillTruths: SemanticTruthPair[] = [
      { id: 't3', sourceText: 'React', targetText: 'Vue', truthSimilarity: 0.7, category: 'skill' },
      { id: 't4', sourceText: 'Kubernetes', targetText: 'CSS', truthSimilarity: 0.05, category: 'skill' }
    ];
    this.datasets.set('skill', skillTruths);
  }
}
