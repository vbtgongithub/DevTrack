// src/modules/resume-intelligence/workers/evidence-graph.worker.ts
import { Worker, type Job } from 'bullmq';
import { getRedisConnection } from '../../../shared/redis/index.js';
import { EvidenceGraphEngine } from '../evidence/EvidenceGraphEngine.js';
import { logger } from '../../../shared/logger.js';
import type { Types } from 'mongoose';

export const EVIDENCE_GRAPH_QUEUE = 'evidence-graph';

export function startEvidenceGraphWorker(): void {
  const engine = new EvidenceGraphEngine();

  new Worker(
    EVIDENCE_GRAPH_QUEUE,
    async (job: Job) => {
      logger.info(`[EvidenceGraphWorker] Processing job ${job.id}`);
      await engine.buildGraphForUser(job.data.userId as unknown as Types.ObjectId);
    },
    { connection: getRedisConnection() }
  );
}

// src/modules/resume-intelligence/workers/embedding-generation.worker.ts
export const EMBEDDING_GENERATION_QUEUE = 'embedding-generation';
export function startEmbeddingWorker(): void {
  new Worker(
    EMBEDDING_GENERATION_QUEUE,
    async (job: Job) => {
      logger.info(`[EmbeddingWorker] Generating embeddings for ${job.id}`);
    },
    { connection: getRedisConnection() }
  );
}

// src/modules/resume-intelligence/workers/github-analysis.worker.ts
import { RepositoryIntelligenceEngine } from '../github/RepositoryIntelligenceEngine.js';
export const GITHUB_ANALYSIS_QUEUE = 'github-analysis';
export function startGithubAnalysisWorker(): void {
  const engine = new RepositoryIntelligenceEngine();
  new Worker(
    GITHUB_ANALYSIS_QUEUE,
    async (job: Job) => {
      logger.info(`[GithubAnalysisWorker] Analyzing repo ${job.data.repoUrl}`);
      await engine.analyzeRepository(job.data.repoUrl);
    },
    { connection: getRedisConnection() }
  );
}
