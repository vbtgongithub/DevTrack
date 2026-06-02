// src/core/datasets/DatasetRegistry.ts
// The central source of truth for DevTrack datasets, featuring auto-discovery and manifest generation.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../../shared/logger.js';
import { DatasetResolver } from './DatasetResolver.js';
import { DatasetLoader } from './DatasetLoader.js';
import { DatasetCache } from './DatasetCache.js';
import { DatasetMetadata, DatasetManifest, LoaderOptions, ValidationResult, DatasetType } from './types.js';

export class DatasetRegistry {
  private static instance: DatasetRegistry | null = null;
  private manifest: DatasetManifest = {
    registryVersion: '1.0',
    lastUpdated: new Date().toISOString(),
    datasets: {},
  };
  private cache = new DatasetCache<any>({ maxSize: 100, ttl: 1000 * 60 * 30 }); // 30 min LRU cache
  private manifestPath: string;

  private constructor() {
    const wsRoot = DatasetResolver.getWorkspaceRoot();
    this.manifestPath = path.join(wsRoot, 'backend', 'src', 'datasets', 'dataset-manifest.json');
    this.loadManifest();
  }

  /**
   * Singleton accessor.
   */
  public static getInstance(): DatasetRegistry {
    if (!this.instance) {
      this.instance = new DatasetRegistry();
    }
    return this.instance;
  }

  /**
   * Load the dataset-manifest.json if it exists; otherwise initialize standard default registrations.
   */
  private loadManifest(): void {
    try {
      if (fs.existsSync(this.manifestPath)) {
        logger.info(`[DatasetRegistry] Loading manifest from: ${this.manifestPath}`);
        const raw = fs.readFileSync(this.manifestPath, 'utf8');
        this.manifest = JSON.parse(raw) as DatasetManifest;
        return;
      }

      // Check if original registry.json exists in placement-intelligence-data
      const wsRoot = DatasetResolver.getWorkspaceRoot();
      const oldRegistryPath = path.join(wsRoot, 'placement-intelligence-data', 'metadata', 'dataset-registry.json');
      if (fs.existsSync(oldRegistryPath)) {
        logger.info(`[DatasetRegistry] Migrating old dataset registry from: ${oldRegistryPath}`);
        const raw = fs.readFileSync(oldRegistryPath, 'utf8');
        const oldData = JSON.parse(raw);
        
        this.manifest.registryVersion = oldData.registry_version || '1.0';
        
        // Map old data format to new strict types
        for (const [filename, value] of Object.entries(oldData.datasets || {})) {
          const oldVal = value as any;
          const id = filename.replace(/\.[^/.]+$/, ''); // clean filename to id (e.g. resume_dataset_1200)
          
          this.manifest.datasets[id] = {
            id,
            name: filename,
            path: oldVal.source ? `backend/src/datasets/${oldVal.source}` : `backend/src/datasets/raw/${filename}`,
            type: this.determineType(filename),
            size: 0,
            version: oldVal.schema_version || '1.0.0',
            checksum: 'UNRESOLVED',
            lastModified: new Date().toISOString(),
            status: 'unresolved',
            domain: oldVal.domain,
            task: oldVal.task,
            mlReady: oldVal.ml_ready || false,
            validationMetrics: oldVal.validation_metrics ? {
              rowCount: oldVal.validation_metrics.rowCount || 0,
              duplicateCount: oldVal.validation_metrics.duplicateCount || 0,
              nullCount: oldVal.validation_metrics.nullCount || 0,
              validationPassed: oldVal.validation_metrics.validationPassed || false
            } : undefined
          };
        }
        
        this.saveManifest();
        return;
      }

      // Fallback default structure
      logger.info('[DatasetRegistry] No manifest or old registry found. Initializing default manifest structure with missing registered datasets.');
      this.manifest.datasets = {
        'train-00000-of-00001': {
          id: 'train-00000-of-00001',
          name: 'train-00000-of-00001.parquet',
          path: 'backend/src/datasets/raw/train-00000-of-00001.parquet',
          type: 'parquet',
          size: 0,
          version: 'v1',
          checksum: 'UNKNOWN',
          lastModified: new Date().toISOString(),
          status: 'missing',
          domain: 'resume_ner',
          task: 'entity extraction',
          mlReady: true
        }
      };
      this.saveManifest();
    } catch (error: any) {
      logger.error('[DatasetRegistry] Failed to initialize manifest', error);
    }
  }

  /**
   * Save current manifest back to dataset-manifest.json
   */
  private saveManifest(): void {
    try {
      this.manifest.lastUpdated = new Date().toISOString();
      const dir = path.dirname(this.manifestPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
      logger.info(`[DatasetRegistry] Saved manifest to: ${this.manifestPath}`);
    } catch (error: any) {
      logger.error(`[DatasetRegistry] Failed to save manifest to ${this.manifestPath}`, error);
    }
  }

  /**
   * Helper to determine dataset format/type.
   */
  private determineType(filename: string): DatasetType {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.json') return 'json';
    if (ext === '.parquet') return 'parquet';
    if (filename.includes('embedding') || filename.includes('vector')) return 'embeddings';
    return 'unknown';
  }

  /**
   * Manually register a dataset.
   */
  public registerDataset(metadata: DatasetMetadata): void {
    logger.info(`[DatasetRegistry] Registering dataset manually: ${metadata.id}`);
    this.manifest.datasets[metadata.id] = metadata;
    this.saveManifest();
  }

  /**
   * Get metadata for a dataset by ID.
   */
  public getDataset(id: string): DatasetMetadata {
    const metadata = this.manifest.datasets[id];
    if (!metadata) {
      const errorMsg = `[DatasetRegistry] Dataset not registered in manifest: "${id}"`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    return metadata;
  }

  /**
   * Lazy load dataset rows. Caches outputs for standard read actions.
   */
  public async lazyLoadDataset<T = any>(id: string, options: LoaderOptions = {}): Promise<T[]> {
    const metadata = this.getDataset(id);
    const cacheKey = `${id}:${options.skip || 0}:${options.limit || 'all'}`;

    // If cached and cache is allowed
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      logger.debug(`[DatasetRegistry] Returning cached results for dataset: ${id}`);
      return cachedData;
    }

    const absolutePath = DatasetResolver.resolveDatasetPath(metadata.path);
    if (!fs.existsSync(absolutePath)) {
      metadata.status = 'missing';
      this.saveManifest();
      throw new Error(`[DatasetRegistry] File for dataset "${id}" does not exist at "${absolutePath}"`);
    }

    let loadedData: T[] = [];
    if (metadata.type === 'csv') {
      loadedData = await DatasetLoader.loadCSV<T>(absolutePath, options);
    } else if (metadata.type === 'json') {
      loadedData = DatasetLoader.loadJSON<T[]>(absolutePath);
    } else {
      throw new Error(`[DatasetRegistry] Direct load unsupported for type "${metadata.type}" on dataset "${id}"`);
    }

    // Store in LRU cache
    this.cache.set(cacheKey, loadedData);
    return loadedData;
  }

  /**
   * Validate a registered dataset's checksum, existence, and column format.
   */
  public async validateDataset(id: string): Promise<ValidationResult> {
    logger.info(`[DatasetRegistry] Validating dataset integrity: ${id}`);
    const metadata = this.getDataset(id);
    const absolutePath = DatasetResolver.resolveDatasetPath(metadata.path);

    if (!fs.existsSync(absolutePath)) {
      metadata.status = 'missing';
      this.saveManifest();
      return {
        isValid: false,
        errors: [`File does not exist: ${absolutePath}`],
        metrics: { rowCount: 0, duplicateCount: 0, nullCount: 0 },
        checksumMatch: false,
      };
    }

    // 1. Checksum matching
    const currentChecksum = await this.calculateFileChecksum(absolutePath);
    const checksumMatch = currentChecksum === metadata.checksum;

    const errors: string[] = [];
    let rowCount = 0;
    let duplicateCount = 0;
    let nullCount = 0;

    // 2. Perform deep format checks (only if CSV/JSON and small enough to scan quickly)
    if (metadata.type === 'csv' && metadata.size < 20 * 1024 * 1024) { // limit deep scans to < 20MB for fast validation
      const seenRows = new Set<string>();
      
      await DatasetLoader.streamCSV(absolutePath, (row) => {
        rowCount++;
        
        // Null integrity
        Object.values(row).forEach((val) => {
          if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
            nullCount++;
          }
        });

        // Duplicate check
        const serialized = JSON.stringify(row);
        if (seenRows.has(serialized)) {
          duplicateCount++;
        } else {
          seenRows.add(serialized);
        }
      });
    }

    const isValid = errors.length === 0 && checksumMatch;

    // Update metadata validation records
    metadata.status = isValid ? 'validated' : (checksumMatch ? 'warning' : 'corrupted');
    metadata.validationMetrics = {
      rowCount: rowCount || metadata.validationMetrics?.rowCount || 0,
      duplicateCount: duplicateCount || metadata.validationMetrics?.duplicateCount || 0,
      nullCount: nullCount || metadata.validationMetrics?.nullCount || 0,
      validationPassed: isValid,
    };
    
    this.saveManifest();

    return {
      isValid,
      errors,
      metrics: { rowCount, duplicateCount, nullCount },
      checksumMatch,
    };
  }

  /**
   * Preload a dataset in background to prime the LRU cache
   */
  public async preloadDataset(id: string): Promise<void> {
    logger.info(`[DatasetRegistry] Preloading dataset in cache background warmup: ${id}`);
    try {
      await this.lazyLoadDataset(id, { limit: 500 });
      logger.info(`[DatasetRegistry] Warmup complete for dataset: ${id}`);
    } catch (err: any) {
      logger.error(`[DatasetRegistry] Warmup failed for dataset ${id}`, err);
    }
  }

  /**
   * Auto-Discovery Scan.
   * Scans /backend/src/datasets/ subfolders, discovers dataset files,
   * calculates checksums/sizes, keeps track of missing files, and writes updated manifest.
   */
  public async scanDatasets(): Promise<void> {
    logger.info('[DatasetRegistry] Commencing Dataset Auto-Discovery Scan...');
    const wsRoot = DatasetResolver.getWorkspaceRoot();
    const baseDatasetDir = path.join(wsRoot, 'backend', 'src', 'datasets');

    if (!fs.existsSync(baseDatasetDir)) {
      logger.warn('[DatasetRegistry] Central datasets directory missing. Creating it now...');
      fs.mkdirSync(baseDatasetDir, { recursive: true });
      return;
    }

    const folders = ['raw', 'processed', 'embeddings', 'cache', 'temp', 'schemas'];
    const discoveredFiles: Record<string, string> = {}; // filename -> path relative to workspace root

    // Scan each subfolder on disk
    for (const folder of folders) {
      const folderPath = path.join(baseDatasetDir, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        continue;
      }

      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        // Skip hidden files, system files, or the manifest itself
        if (file.startsWith('.') || file === 'dataset-manifest.json' || file === 'lineage.json') {
          continue;
        }

        const fullPath = path.join(folderPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          const id = file.replace(/\.[^/.]+$/, ''); // file name without extension
          discoveredFiles[id] = path.relative(wsRoot, fullPath);
        }
      }
    }

    logger.info(`[DatasetRegistry] Discovered ${Object.keys(discoveredFiles).length} active dataset files on disk.`);

    // Match files against manifest and update metadata
    const updatedDatasets: Record<string, DatasetMetadata> = {};

    // 1. Process files discovered on disk
    for (const [id, relPath] of Object.entries(discoveredFiles)) {
      const absPath = path.join(wsRoot, relPath);
      const stat = fs.statSync(absPath);
      const existingMeta = this.manifest.datasets[id];

      logger.info(`[DatasetRegistry] Processing file: ${relPath}`);
      const checksum = await this.calculateFileChecksum(absPath);

      updatedDatasets[id] = {
        id,
        name: path.basename(relPath),
        path: relPath.replace(/\\/g, '/'), // use forward slashes for universal compatibility
        type: this.determineType(path.basename(relPath)),
        size: stat.size,
        version: existingMeta?.version || '1.0.0',
        checksum,
        lastModified: stat.mtime.toISOString(),
        status: existingMeta?.status && existingMeta.status !== 'missing' && existingMeta.status !== 'unresolved'
          ? existingMeta.status
          : 'validated',
        domain: existingMeta?.domain || 'general',
        task: existingMeta?.task || 'unassigned',
        mlReady: existingMeta?.mlReady || false,
        validationMetrics: existingMeta?.validationMetrics,
        lastScanned: new Date().toISOString(),
      };
    }

    // 2. Retain missing files (like train-00000-of-00001.parquet) instead of deleting them, but mark status as 'missing'
    for (const [id, meta] of Object.entries(this.manifest.datasets)) {
      if (!updatedDatasets[id]) {
        logger.warn(`[DatasetRegistry] Registered dataset "${id}" was not found on disk at "${meta.path}". Flagging as missing.`);
        updatedDatasets[id] = {
          ...meta,
          status: 'missing',
          lastScanned: new Date().toISOString(),
        };
      }
    }

    this.manifest.datasets = updatedDatasets;
    this.saveManifest();
    logger.info('[DatasetRegistry] Dataset Auto-Discovery Scan completed successfully.');
  }

  /**
   * Helper to calculate a file's SHA-256 checksum safely using streams.
   */
  private calculateFileChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }
}
export const datasetRegistry = DatasetRegistry.getInstance();
