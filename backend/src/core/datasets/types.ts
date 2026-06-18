// src/core/datasets/types.ts
// Strict TypeScript types for DevTrack's centralized dataset registry.

export type DatasetType = 'csv' | 'json' | 'parquet' | 'embeddings' | 'unknown';

export interface DatasetMetrics {
  rowCount: number;
  duplicateCount: number;
  nullCount: number;
  validationPassed: boolean;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  path: string; // Absolute or workspace-relative path resolved via resolver
  type: DatasetType;
  size: number; // in bytes
  version: string;
  checksum: string; // SHA-256 hash of the dataset content
  lastModified: string; // ISO 8601 string
  status: 'validated' | 'warning' | 'corrupted' | 'missing' | 'unresolved';
  domain?: string;
  task?: string;
  mlReady: boolean;
  validationMetrics?: DatasetMetrics;
  lastScanned?: string;
}

export interface DatasetManifest {
  registryVersion: string;
  lastUpdated: string;
  datasets: Record<string, DatasetMetadata>;
}

export interface LoaderOptions {
  stream?: boolean;
  chunkSize?: number; // for streaming large files
  limit?: number; // for paginating large files
  skip?: number;
  validationSchema?: string; // name of validation schema under datasets/schemas/
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  metrics: {
    rowCount: number;
    duplicateCount: number;
    nullCount: number;
  };
  checksumMatch?: boolean;
}

export interface LRUCacheConfig {
  maxSize?: number; // Maximum number of items in cache
  ttl?: number; // Time-To-Live in milliseconds
}
