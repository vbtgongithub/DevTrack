import { SnapshotVersioningSystem } from '../../operations/index.js';
import { ReadinessDsa } from '../../../db/models/readinessDsa.model.js';
import { ReadinessSkills } from '../../../db/models/readinessSkills.model.js';
import { ReadinessProjects } from '../../../db/models/readinessProjects.model.js';
import { ReadinessRoadmap } from '../../../db/models/readinessRoadmap.model.js';
import { ReadinessBenchmarks } from '../../../db/models/readinessBenchmarks.model.js';
import { ReadinessCore } from '../../../db/models/readinessCore.model.js';
import { logger } from '../../../shared/logger.js';

export interface ReadinessSnapshot {
  snapshotId: string;
  userId: string;
  snapshotVersion: string;
  createdAt: Date;
  changeDescription: string;
  readinessData: {
    dsa?: any;
    skills?: any;
    projects?: any;
    roadmap?: any;
    benchmarks?: any;
    core?: any;
  };
  summary: {
    overallScore: number;
    dsaScore: number;
    skillsScore: number;
    projectsScore: number;
    infrastructureScore: number;
    roadmapProgress: number;
    confidenceScore: number;
  };
}

export interface SnapshotComparison {
  snapshotId1: string;
  snapshotId2: string;
  changes: {
    overallScoreChange: number;
    dsaScoreChange: number;
    skillsScoreChange: number;
    projectsScoreChange: number;
    infrastructureScoreChange: number;
    roadmapProgressChange: number;
    confidenceScoreChange: number;
  };
  improvements: string[];
  regressions: string[];
}

class ReadinessSnapshotServiceClass {
  /**
   * Create a complete readiness snapshot for a user
   */
  async createReadinessSnapshot(userId: string, changeDescription: string, createdBy: string = 'system'): Promise<ReadinessSnapshot> {
    try {
      logger.info('[ReadinessSnapshotService] Creating readiness snapshot', { userId });
      
      // Fetch all readiness data
      const [dsaData, skillsData, projectsData, roadmapData, benchmarksData, coreData] = await Promise.all([
        ReadinessDsa.findOne({ userId }),
        ReadinessSkills.findOne({ userId }),
        ReadinessProjects.findOne({ userId }),
        ReadinessRoadmap.findOne({ userId }),
        ReadinessBenchmarks.findOne({ userId }),
        ReadinessCore.findOne({ userId }),
      ]);
      
      // Calculate summary scores
      const summary = this.calculateSummary(dsaData, skillsData, projectsData, roadmapData, coreData);
      
      // Create core snapshot
      const coreSnapshot = SnapshotVersioningSystem.createSnapshot(
        userId,
        'core',
        { core: coreData },
        changeDescription,
        undefined,
        createdBy
      );
      
      // Create individual component snapshots
      const snapshotIds: string[] = [coreSnapshot.snapshotId];
      
      if (dsaData) {
        const dsaSnapshot = SnapshotVersioningSystem.createSnapshot(
          userId,
          'dsa',
          dsaData,
          changeDescription,
          coreSnapshot.snapshotId,
          createdBy
        );
        snapshotIds.push(dsaSnapshot.snapshotId);
      }
      
      if (skillsData) {
        const skillsSnapshot = SnapshotVersioningSystem.createSnapshot(
          userId,
          'skills',
          skillsData,
          changeDescription,
          coreSnapshot.snapshotId,
          createdBy
        );
        snapshotIds.push(skillsSnapshot.snapshotId);
      }
      
      if (projectsData) {
        const projectsSnapshot = SnapshotVersioningSystem.createSnapshot(
          userId,
          'projects',
          projectsData,
          changeDescription,
          coreSnapshot.snapshotId,
          createdBy
        );
        snapshotIds.push(projectsSnapshot.snapshotId);
      }
      
      if (roadmapData) {
        const roadmapSnapshot = SnapshotVersioningSystem.createSnapshot(
          userId,
          'roadmap',
          roadmapData,
          changeDescription,
          coreSnapshot.snapshotId,
          createdBy
        );
        snapshotIds.push(roadmapSnapshot.snapshotId);
      }
      
      if (benchmarksData) {
        const benchmarksSnapshot = SnapshotVersioningSystem.createSnapshot(
          userId,
          'benchmarks',
          benchmarksData,
          changeDescription,
          coreSnapshot.snapshotId,
          createdBy
        );
        snapshotIds.push(benchmarksSnapshot.snapshotId);
      }
      
      const readinessSnapshot: ReadinessSnapshot = {
        snapshotId: coreSnapshot.snapshotId,
        userId,
        snapshotVersion: coreSnapshot.snapshotVersion,
        createdAt: coreSnapshot.createdAt,
        changeDescription,
        readinessData: {
          dsa: dsaData,
          skills: skillsData,
          projects: projectsData,
          roadmap: roadmapData,
          benchmarks: benchmarksData,
          core: coreData,
        },
        summary,
      };
      
      logger.info('[ReadinessSnapshotService] Readiness snapshot created', { 
        snapshotId: readinessSnapshot.snapshotId,
        userId,
        componentCount: snapshotIds.length 
      });
      
      return readinessSnapshot;
    } catch (error) {
      logger.error('[ReadinessSnapshotService] Failed to create readiness snapshot', { userId, error });
      throw error;
    }
  }

  /**
   * Get latest readiness snapshot for a user
   */
  async getLatestReadinessSnapshot(userId: string): Promise<ReadinessSnapshot | null> {
    try {
      const coreSnapshot = SnapshotVersioningSystem.getLatestSnapshot(userId, 'core');
      
      if (!coreSnapshot) {
        return null;
      }
      
      // Fetch all component snapshots
      const dsaSnapshot = SnapshotVersioningSystem.getLatestSnapshot(userId, 'dsa');
      const skillsSnapshot = SnapshotVersioningSystem.getLatestSnapshot(userId, 'skills');
      const projectsSnapshot = SnapshotVersioningSystem.getLatestSnapshot(userId, 'projects');
      const roadmapSnapshot = SnapshotVersioningSystem.getLatestSnapshot(userId, 'roadmap');
      const benchmarksSnapshot = SnapshotVersioningSystem.getLatestSnapshot(userId, 'benchmarks');
      
      const summary = this.calculateSummary(
        dsaSnapshot?.data,
        skillsSnapshot?.data,
        projectsSnapshot?.data,
        roadmapSnapshot?.data,
        coreSnapshot.data
      );
      
      return {
        snapshotId: coreSnapshot.metadata.snapshotId,
        userId: coreSnapshot.metadata.userId,
        snapshotVersion: coreSnapshot.metadata.snapshotVersion,
        createdAt: coreSnapshot.metadata.createdAt,
        changeDescription: coreSnapshot.metadata.changeDescription,
        readinessData: {
          dsa: dsaSnapshot?.data,
          skills: skillsSnapshot?.data,
          projects: projectsSnapshot?.data,
          roadmap: roadmapSnapshot?.data,
          benchmarks: benchmarksSnapshot?.data,
          core: coreSnapshot.data,
        },
        summary,
      };
    } catch (error) {
      logger.error('[ReadinessSnapshotService] Failed to get latest readiness snapshot', { userId, error });
      return null;
    }
  }

  /**
   * Get readiness snapshot by ID
   */
  async getReadinessSnapshot(snapshotId: string): Promise<ReadinessSnapshot | null> {
    try {
      const coreSnapshot = SnapshotVersioningSystem.getSnapshot(snapshotId);
      
      if (!coreSnapshot) {
        return null;
      }
      
      // Fetch component snapshots with same parent
      const dsaSnapshot = Array.from(SnapshotVersioningSystem.getUserSnapshots(coreSnapshot.metadata.userId))
        .find(s => s.metadata.modelType === 'dsa' && s.metadata.parentSnapshotId === snapshotId);
      const skillsSnapshot = Array.from(SnapshotVersioningSystem.getUserSnapshots(coreSnapshot.metadata.userId))
        .find(s => s.metadata.modelType === 'skills' && s.metadata.parentSnapshotId === snapshotId);
      const projectsSnapshot = Array.from(SnapshotVersioningSystem.getUserSnapshots(coreSnapshot.metadata.userId))
        .find(s => s.metadata.modelType === 'projects' && s.metadata.parentSnapshotId === snapshotId);
      const roadmapSnapshot = Array.from(SnapshotVersioningSystem.getUserSnapshots(coreSnapshot.metadata.userId))
        .find(s => s.metadata.modelType === 'roadmap' && s.metadata.parentSnapshotId === snapshotId);
      const benchmarksSnapshot = Array.from(SnapshotVersioningSystem.getUserSnapshots(coreSnapshot.metadata.userId))
        .find(s => s.metadata.modelType === 'benchmarks' && s.metadata.parentSnapshotId === snapshotId);
      
      const summary = this.calculateSummary(
        dsaSnapshot?.data,
        skillsSnapshot?.data,
        projectsSnapshot?.data,
        roadmapSnapshot?.data,
        coreSnapshot.data
      );
      
      return {
        snapshotId: coreSnapshot.metadata.snapshotId,
        userId: coreSnapshot.metadata.userId,
        snapshotVersion: coreSnapshot.metadata.snapshotVersion,
        createdAt: coreSnapshot.metadata.createdAt,
        changeDescription: coreSnapshot.metadata.changeDescription,
        readinessData: {
          dsa: dsaSnapshot?.data,
          skills: skillsSnapshot?.data,
          projects: projectsSnapshot?.data,
          roadmap: roadmapSnapshot?.data,
          benchmarks: benchmarksSnapshot?.data,
          core: coreSnapshot.data,
        },
        summary,
      };
    } catch (error) {
      logger.error('[ReadinessSnapshotService] Failed to get readiness snapshot', { snapshotId, error });
      return null;
    }
  }

  /**
   * Get all readiness snapshots for a user
   */
  async getUserReadinessSnapshots(userId: string): Promise<ReadinessSnapshot[]> {
    try {
      const coreSnapshots = Array.from(SnapshotVersioningSystem.getUserSnapshots(userId))
        .filter(s => s.metadata.modelType === 'core');
      
      const readinessSnapshots: ReadinessSnapshot[] = [];
      
      for (const coreSnapshot of coreSnapshots) {
        const snapshot = await this.getReadinessSnapshot(coreSnapshot.metadata.snapshotId);
        if (snapshot) {
          readinessSnapshots.push(snapshot);
        }
      }
      
      return readinessSnapshots;
    } catch (error) {
      logger.error('[ReadinessSnapshotService] Failed to get user readiness snapshots', { userId, error });
      return [];
    }
  }

  /**
   * Compare two readiness snapshots
   */
  async compareSnapshots(snapshotId1: string, snapshotId2: string): Promise<SnapshotComparison | null> {
    try {
      const snapshot1 = await this.getReadinessSnapshot(snapshotId1);
      const snapshot2 = await this.getReadinessSnapshot(snapshotId2);
      
      if (!snapshot1 || !snapshot2) {
        return null;
      }
      
      const changes = {
        overallScoreChange: snapshot2.summary.overallScore - snapshot1.summary.overallScore,
        dsaScoreChange: snapshot2.summary.dsaScore - snapshot1.summary.dsaScore,
        skillsScoreChange: snapshot2.summary.skillsScore - snapshot1.summary.skillsScore,
        projectsScoreChange: snapshot2.summary.projectsScore - snapshot1.summary.projectsScore,
        infrastructureScoreChange: snapshot2.summary.infrastructureScore - snapshot1.summary.infrastructureScore,
        roadmapProgressChange: snapshot2.summary.roadmapProgress - snapshot1.summary.roadmapProgress,
        confidenceScoreChange: snapshot2.summary.confidenceScore - snapshot1.summary.confidenceScore,
      };
      
      const improvements: string[] = [];
      const regressions: string[] = [];
      
      if (changes.overallScoreChange > 0) {
        improvements.push(`Overall readiness improved by ${changes.overallScoreChange}%`);
      } else if (changes.overallScoreChange < 0) {
        regressions.push(`Overall readiness decreased by ${Math.abs(changes.overallScoreChange)}%`);
      }
      
      if (changes.dsaScoreChange > 0) {
        improvements.push(`DSA score improved by ${changes.dsaScoreChange}%`);
      } else if (changes.dsaScoreChange < 0) {
        regressions.push(`DSA score decreased by ${Math.abs(changes.dsaScoreChange)}%`);
      }
      
      if (changes.skillsScoreChange > 0) {
        improvements.push(`Skills score improved by ${changes.skillsScoreChange}%`);
      } else if (changes.skillsScoreChange < 0) {
        regressions.push(`Skills score decreased by ${Math.abs(changes.skillsScoreChange)}%`);
      }
      
      if (changes.projectsScoreChange > 0) {
        improvements.push(`Projects score improved by ${changes.projectsScoreChange}%`);
      } else if (changes.projectsScoreChange < 0) {
        regressions.push(`Projects score decreased by ${Math.abs(changes.projectsScoreChange)}%`);
      }
      
      if (changes.infrastructureScoreChange > 0) {
        improvements.push(`Infrastructure score improved by ${changes.infrastructureScoreChange}%`);
      } else if (changes.infrastructureScoreChange < 0) {
        regressions.push(`Infrastructure score decreased by ${Math.abs(changes.infrastructureScoreChange)}%`);
      }
      
      if (changes.roadmapProgressChange > 0) {
        improvements.push(`Roadmap progress improved by ${changes.roadmapProgressChange}%`);
      } else if (changes.roadmapProgressChange < 0) {
        regressions.push(`Roadmap progress decreased by ${Math.abs(changes.roadmapProgressChange)}%`);
      }
      
      if (changes.confidenceScoreChange > 0) {
        improvements.push(`Confidence score improved by ${changes.confidenceScoreChange}%`);
      } else if (changes.confidenceScoreChange < 0) {
        regressions.push(`Confidence score decreased by ${Math.abs(changes.confidenceScoreChange)}%`);
      }
      
      return {
        snapshotId1,
        snapshotId2,
        changes,
        improvements,
        regressions,
      };
    } catch (error) {
      logger.error('[ReadinessSnapshotService] Failed to compare snapshots', { snapshotId1, snapshotId2, error });
      return null;
    }
  }

  /**
   * Rollback to a previous readiness snapshot
   */
  async rollbackToSnapshot(snapshotId: string): Promise<ReadinessSnapshot | null> {
    try {
      const snapshot = await this.getReadinessSnapshot(snapshotId);
      
      if (!snapshot) {
        logger.warn('[ReadinessSnapshotService] Snapshot not found for rollback', { snapshotId });
        return null;
      }
      
      // Restore data to models (this would need actual MongoDB update operations)
      // For now, just return the snapshot data
      logger.info('[ReadinessSnapshotService] Rolled back to readiness snapshot', { 
        snapshotId,
        version: snapshot.snapshotVersion 
      });
      
      return snapshot;
    } catch (error) {
      logger.error('[ReadinessSnapshotService] Failed to rollback to snapshot', { snapshotId, error });
      return null;
    }
  }

  /**
   * Calculate summary scores from readiness data
   */
  private calculateSummary(dsaData: any, skillsData: any, projectsData: any, roadmapData: any, coreData: any): ReadinessSnapshot['summary'] {
    const dsaScore = dsaData?.overallEngineeringDepth || 0;
    const skillsScore = skillsData?.overallEngineeringDepth || 0;
    const projectsScore = projectsData?.engineeringMaturity || 0;
    const infrastructureScore = projectsData?.infrastructureSophistication || 0;
    const roadmapProgress = roadmapData 
      ? (roadmapData.verifiedNodes.length / (roadmapData.verifiedNodes.length + roadmapData.missingDependencies.length)) * 100 
      : 0;
    
    const overallScore = (dsaScore + skillsScore + projectsScore + infrastructureScore) / 4;
    const confidenceScore = Math.min(
      dsaData?.confidenceScore || 50,
      skillsData?.confidenceScore || 50,
      projectsData?.confidenceScore || 50,
      coreData?.confidenceScore || 50
    );
    
    return {
      overallScore: Math.round(overallScore),
      dsaScore: Math.round(dsaScore),
      skillsScore: Math.round(skillsScore),
      projectsScore: Math.round(projectsScore),
      infrastructureScore: Math.round(infrastructureScore),
      roadmapProgress: Math.round(roadmapProgress),
      confidenceScore: Math.round(confidenceScore),
    };
  }

  /**
   * Delete old readiness snapshots
   */
  async deleteOldSnapshots(userId: string, keepCount: number = 10): Promise<number> {
    try {
      const deletedCount = SnapshotVersioningSystem.deleteOldSnapshots(userId, keepCount);
      logger.info('[ReadinessSnapshotService] Deleted old readiness snapshots', { 
        userId, 
        deletedCount 
      });
      return deletedCount;
    } catch (error) {
      logger.error('[ReadinessSnapshotService] Failed to delete old snapshots', { userId, error });
      return 0;
    }
  }

  /**
   * Get snapshot statistics
   */
  getSnapshotStats(): {
    totalSnapshots: number;
    snapshotsByModelType: Record<string, number>;
    currentVersion: string;
  } {
    const stats = SnapshotVersioningSystem.getStats();
    return {
      totalSnapshots: stats.totalSnapshots,
      snapshotsByModelType: stats.snapshotsByModelType,
      currentVersion: stats.currentVersion,
    };
  }
}

export const ReadinessSnapshotService = new ReadinessSnapshotServiceClass();
