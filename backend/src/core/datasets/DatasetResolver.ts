// src/core/datasets/DatasetResolver.ts
// Cross-platform smart path resolver for centralized datasets with traversal protection.

import path from 'path';
import fs from 'fs';
import { logger } from '../../shared/logger.js';

export class DatasetResolver {
  private static workspaceRoot: string = '';

  /**
   * Find the monorepo workspace root dynamically by ascending from current working directory
   * until we find indicating files like package.json, backend, or .git.
   */
  public static getWorkspaceRoot(): string {
    if (this.workspaceRoot) {
      return this.workspaceRoot;
    }

    // Default starting point is process.cwd()
    let currentDir = process.cwd();
    
    // Safety counter to prevent infinite loop
    let depth = 0;
    const maxDepth = 6;

    while (depth < maxDepth) {
      // Root-level indicators
      const hasBackend = fs.existsSync(path.join(currentDir, 'backend'));
      const hasGit = fs.existsSync(path.join(currentDir, '.git'));
      const hasPackage = fs.existsSync(path.join(currentDir, 'package.json'));

      if (hasBackend || hasGit || (hasPackage && !fs.existsSync(path.join(currentDir, '..', 'package.json')))) {
        this.workspaceRoot = path.resolve(currentDir);
        logger.info(`[DatasetResolver] Resolved workspace root at: ${this.workspaceRoot}`);
        return this.workspaceRoot;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached file system root
        break;
      }
      currentDir = parentDir;
      depth++;
    }

    // Fallback: assume process.cwd() or one level up
    this.workspaceRoot = path.resolve(process.cwd());
    if (path.basename(this.workspaceRoot) === 'backend') {
      this.workspaceRoot = path.dirname(this.workspaceRoot);
    }
    
    logger.warn(`[DatasetResolver] Dynamic root discovery failed. Fallback workspace root: ${this.workspaceRoot}`);
    return this.workspaceRoot;
  }

  /**
   * Resolve an absolute path for a dataset ID or raw filename safely.
   * Ensures the resulting path stays within the workspace and handles path traversal attacks.
   */
  public static resolveDatasetPath(datasetPathOrId: string): string {
    const wsRoot = this.getWorkspaceRoot();
    
    // We expect datasets to live inside backend/src/datasets/
    const baseDatasetDir = path.join(wsRoot, 'backend', 'src', 'datasets');

    // Clean and normalize input to avoid directory traversal (e.g. resolve '../../something')
    const sanitizedInput = path.normalize(datasetPathOrId).replace(/^(\.\.(\/|\\))+/, '');
    
    let resolvedPath = '';

    if (path.isAbsolute(sanitizedInput)) {
      resolvedPath = sanitizedInput;
    } else if (sanitizedInput.startsWith('backend/src/datasets') || sanitizedInput.startsWith('backend\\src\\datasets')) {
      resolvedPath = path.join(wsRoot, sanitizedInput);
    } else if (sanitizedInput.startsWith('raw/') || sanitizedInput.startsWith('raw\\') ||
               sanitizedInput.startsWith('processed/') || sanitizedInput.startsWith('processed\\') ||
               sanitizedInput.startsWith('embeddings/') || sanitizedInput.startsWith('embeddings\\') ||
               sanitizedInput.startsWith('cache/') || sanitizedInput.startsWith('cache\\') ||
               sanitizedInput.startsWith('temp/') || sanitizedInput.startsWith('temp\\') ||
               sanitizedInput.startsWith('schemas/') || sanitizedInput.startsWith('schemas\\')) {
      resolvedPath = path.join(baseDatasetDir, sanitizedInput);
    } else if (sanitizedInput === 'dataset-manifest.json' || sanitizedInput === 'lineage.json') {
      resolvedPath = path.join(baseDatasetDir, sanitizedInput);
    } else {
      // Default to the 'raw' folder if no folder prefix is provided
      resolvedPath = path.join(baseDatasetDir, 'raw', sanitizedInput);
    }

    resolvedPath = path.resolve(resolvedPath);

    // Security boundary check: Ensure the path is inside either the workspace root or the datasets directory
    const relativeToWorkspace = path.relative(wsRoot, resolvedPath);
    if (relativeToWorkspace.startsWith('..') || path.isAbsolute(relativeToWorkspace)) {
      const errorMsg = `[DatasetResolver] Security Violation: Path traversal blocked for "${datasetPathOrId}". Resolved location "${resolvedPath}" falls outside workspace boundary.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    return resolvedPath;
  }
}
