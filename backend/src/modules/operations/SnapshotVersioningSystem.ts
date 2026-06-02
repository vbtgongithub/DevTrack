import { logger } from '../../shared/logger.js';

export interface SnapshotMetadata {
  snapshotId: string;
  userId: string;
  snapshotVersion: string;
  analyticsVersion: string;
  graphVersion: string;
  scoringVersion: string;
  createdAt: Date;
  createdBy: string; // 'system' or user ID
  parentSnapshotId?: string;
  changeDescription: string;
  modelType: 'dsa' | 'skills' | 'projects' | 'roadmap' | 'benchmarks' | 'core';
}

export interface SnapshotData {
  metadata: SnapshotMetadata;
  data: any; // The actual readiness model data
}

export interface VersionLineage {
  snapshotId: string;
  version: string;
  parentSnapshotId?: string;
  childSnapshotIds: string[];
  createdAt: Date;
  changeDescription: string;
}

class SnapshotVersioningSystemClass {
  private snapshots: Map<string, SnapshotData> = new Map();
  private lineage: Map<string, VersionLineage> = new Map();
  private currentVersion: string = '1.0.0';

  /**
   * Create a new snapshot of readiness data
   */
  createSnapshot(
    userId: string,
    modelType: SnapshotMetadata['modelType'],
    data: any,
    changeDescription: string,
    parentSnapshotId?: string,
    createdBy: string = 'system'
  ): SnapshotMetadata {
    const snapshotId = this.generateSnapshotId(userId, modelType);
    const snapshotVersion = this.incrementVersion();
    
    const metadata: SnapshotMetadata = {
      snapshotId,
      userId,
      snapshotVersion,
      analyticsVersion: '1.0.0',
      graphVersion: '1.0.0',
      scoringVersion: '1.0.0',
      createdAt: new Date(),
      createdBy,
      parentSnapshotId,
      changeDescription,
      modelType,
    };

    const snapshotData: SnapshotData = {
      metadata,
      data,
    };

    this.snapshots.set(snapshotId, snapshotData);
    
    // Update lineage
    this.updateLineage(snapshotId, parentSnapshotId, snapshotVersion, changeDescription);
    
    logger.info('[SnapshotVersioningSystem] Created snapshot', { 
      snapshotId, 
      userId, 
      modelType,
      version: snapshotVersion 
    });

    return metadata;
  }

  /**
   * Get a snapshot by ID
   */
  getSnapshot(snapshotId: string): SnapshotData | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * Get latest snapshot for a user and model type
   */
  getLatestSnapshot(userId: string, modelType: SnapshotMetadata['modelType']): SnapshotData | undefined {
    const userSnapshots = Array.from(this.snapshots.values())
      .filter(s => s.metadata.userId === userId && s.metadata.modelType === modelType)
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
    
    return userSnapshots[0];
  }

  /**
   * Get all snapshots for a user
   */
  getUserSnapshots(userId: string): SnapshotData[] {
    return Array.from(this.snapshots.values())
      .filter(s => s.metadata.userId === userId)
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
  }

  /**
   * Get version lineage for a snapshot
   */
  getLineage(snapshotId: string): VersionLineage | undefined {
    return this.lineage.get(snapshotId);
  }

  /**
   * Get full version history for a snapshot
   */
  getVersionHistory(snapshotId: string): VersionLineage[] {
    const history: VersionLineage[] = [];
    const visited = new Set<string>();
    
    this.traverseLineage(snapshotId, history, visited);
    
    return history;
  }

  /**
   * Rollback to a previous snapshot
   */
  rollbackToSnapshot(snapshotId: string): SnapshotData | undefined {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      logger.warn('[SnapshotVersioningSystem] Snapshot not found for rollback', { snapshotId });
      return undefined;
    }

    logger.info('[SnapshotVersioningSystem] Rolled back to snapshot', { 
      snapshotId, 
      version: snapshot.metadata.snapshotVersion 
    });

    return snapshot;
  }

  /**
   * Delete old snapshots (cleanup)
   */
  deleteOldSnapshots(userId: string, keepCount: number = 10): number {
    const userSnapshots = this.getUserSnapshots(userId);
    const toDelete = userSnapshots.slice(keepCount);
    
    let deletedCount = 0;
    toDelete.forEach(snapshot => {
      this.snapshots.delete(snapshot.metadata.snapshotId);
      this.lineage.delete(snapshot.metadata.snapshotId);
      deletedCount++;
    });

    logger.info('[SnapshotVersioningSystem] Deleted old snapshots', { 
      userId, 
      deletedCount 
    });

    return deletedCount;
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(userId: string, modelType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}-${modelType}-${timestamp}-${random}`;
  }

  /**
   * Increment version number
   */
  private incrementVersion(): string {
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    
    // Simple increment logic - increment patch
    const newPatch = patch + 1;
    this.currentVersion = `${major}.${minor}.${newPatch}`;
    
    return this.currentVersion;
  }

  /**
   * Update lineage information
   */
  private updateLineage(
    snapshotId: string,
    parentSnapshotId: string | undefined,
    version: string,
    changeDescription: string
  ): void {
    const lineage: VersionLineage = {
      snapshotId,
      version,
      parentSnapshotId,
      childSnapshotIds: [],
      createdAt: new Date(),
      changeDescription,
    };

    this.lineage.set(snapshotId, lineage);

    // Update parent's child references
    if (parentSnapshotId) {
      const parentLineage = this.lineage.get(parentSnapshotId);
      if (parentLineage) {
        parentLineage.childSnapshotIds.push(snapshotId);
        this.lineage.set(parentSnapshotId, parentLineage);
      }
    }
  }

  /**
   * Traverse lineage recursively
   */
  private traverseLineage(
    snapshotId: string,
    history: VersionLineage[],
    visited: Set<string>
  ): void {
    if (visited.has(snapshotId)) return;
    visited.add(snapshotId);

    const lineage = this.lineage.get(snapshotId);
    if (!lineage) return;

    history.push(lineage);

    if (lineage.parentSnapshotId) {
      this.traverseLineage(lineage.parentSnapshotId, history, visited);
    }
  }

  /**
   * Get snapshot statistics
   */
  getStats(): {
    totalSnapshots: number;
    totalLineageEntries: number;
    currentVersion: string;
    snapshotsByModelType: Record<string, number>;
  } {
    const snapshotsByModelType: Record<string, number> = {};
    
    this.snapshots.forEach((snapshot) => {
      const modelType = snapshot.metadata.modelType;
      snapshotsByModelType[modelType] = (snapshotsByModelType[modelType] || 0) + 1;
    });

    return {
      totalSnapshots: this.snapshots.size,
      totalLineageEntries: this.lineage.size,
      currentVersion: this.currentVersion,
      snapshotsByModelType,
    };
  }

  /**
   * Clear all snapshots (for testing)
   */
  clear(): void {
    this.snapshots.clear();
    this.lineage.clear();
    this.currentVersion = '1.0.0';
    logger.info('[SnapshotVersioningSystem] Cleared all snapshots');
  }
}

export const SnapshotVersioningSystem = new SnapshotVersioningSystemClass();
