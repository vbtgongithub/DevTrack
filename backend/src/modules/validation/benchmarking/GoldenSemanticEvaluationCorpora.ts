// src/modules/validation/benchmarking/GoldenSemanticEvaluationCorpora.ts
// Golden corpora containing fully validated edge cases for benchmarking.

import { logger } from '../../../shared/logger.js';

export interface GoldenCorpus {
  corpusId: string;
  description: string;
  items: string[];
}

export class GoldenSemanticEvaluationCorpora {
  private corpora: Map<string, GoldenCorpus> = new Map();

  constructor() {
    this.seedCorpora();
    logger.info('[GoldenCorpora] Initialized');
  }

  getCorpus(id: string): GoldenCorpus | undefined {
    return this.corpora.get(id);
  }

  private seedCorpora(): void {
    this.corpora.set('edge_case_skills', {
      corpusId: 'edge_case_skills',
      description: 'Highly ambiguous skill names requiring contextual understanding.',
      items: [
        'go (the language, not the verb)',
        'c (language, not letter)',
        'express (framework, not speed)',
        'react (framework, not emotion)'
      ]
    });

    this.corpora.set('resume_ambiguities', {
      corpusId: 'resume_ambiguities',
      description: 'Resume statements that confuse standard ATS parsers.',
      items: [
        'managed 5 engineers while coding in python',
        'architected java microservices before switching to node',
        'frontend exposure but primarily backend focus'
      ]
    });
  }
}
