// Set environment variables BEFORE importing any application module
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devtrack_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
process.env.PORT = '0';
process.env.ENABLE_WORKERS = 'false';

import mongoose from 'mongoose';
import { getRedisClient } from '../../shared/redis/index.js';
import { logger } from '../../shared/logger.js';
import { User, UserXp } from '../../db/models/index.js';
import { beforeAll, afterAll, beforeEach } from 'vitest';

const MONGODB_URI = process.env.MONGODB_URI;
const REDIS_URL = process.env.REDIS_URL;

beforeAll(async () => {
  // Silence logger during tests unless debugging
  if (process.env.DEBUG !== 'true') {
    process.env.SILENT_LOGGING = 'true';
  }

  // Connect to DB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
  
  // Test Redis connection with a timeout to avoid hangs if Redis is offline
  const redis = getRedisClient();
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
    ]);
  } catch (err) {
    logger.warn('[test-setup] Redis is offline. Running integration tests in degraded mode.', { error: String(err) });
  }
});

afterAll(async () => {
  // Drop database to ensure clean slate for next test suite
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  }

  // Disconnect Redis
  const redis = getRedisClient();
  await redis.quit();
});

beforeEach(async () => {
  // Clean all collections before each test
  if (mongoose.connection.readyState === 1) {
    const collections = await mongoose.connection.db?.collections();
    if (collections) {
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  }

  // Seed baseline data
  const testUser = await User.create({
    email: 'test_integration@devtrack.app',
    username: 'test_integration',
    passwordHash: 'hashed_password_mock',
    githubId: 'mock_github_123',
    displayName: 'Test Integration User',
  });

  await UserXp.create({
    userId: testUser._id,
    totalXp: 500,
    currentLevel: 2,
    xpToNextLevel: 500,
    history: [],
  });
});
