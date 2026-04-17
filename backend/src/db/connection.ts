// src/db/connection.ts - MongoDB connection
import mongoose from 'mongoose';
import { env } from '../config/index.js';
import { logger } from '../shared/index.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', error);
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', error);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});