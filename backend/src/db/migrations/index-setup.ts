import mongoose from 'mongoose';
import { logger } from '../../shared/logger.js';

/**
 * Setup production optimized database indexes.
 * Enforces compound indexes for rapid query processing.
 */
export async function setupProductionIndexes(): Promise<void> {
  logger.info('[DatabaseMigration] Setting up optimized production indexes...');
  
  try {
    const db = mongoose.connection;
    
    // 1. Optimized queries for resume session retrievals (userId + sessionId)
    logger.info('[DatabaseMigration] Registering compound index on resume_sessions (userId, sessionId)');
    await db.collection('resume_sessions').createIndex(
      { userId: 1, sessionId: 1 },
      { name: 'idx_userId_sessionId', background: true }
    );
    
    // 2. High-speed lookup for ingestion monitoring
    logger.info('[DatabaseMigration] Registering index on dataset_ingestion_states (status)');
    await db.collection('dataset_ingestion_states').createIndex(
      { status: 1 },
      { name: 'idx_ingestion_status', background: true }
    );
    
    // 3. Fast indexing of activity telemetry
    logger.info('[DatabaseMigration] Registering compound index on activity_logs (userId, createdAt)');
    await db.collection('activity_logs').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'idx_userId_createdAt', background: true }
    );
    
    logger.info('[DatabaseMigration] Production optimized indexes successfully registered.');
  } catch (error) {
    logger.error('[DatabaseMigration] Failed to setup production indexes', error);
    // Do not crash the gateway if indexing encountered a network timeout
  }
}
