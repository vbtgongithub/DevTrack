import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import { orchestrator } from '../../shared/runtime/orchestrator.js';
import { User } from '../../db/models/index.js';

describe('Backend Boot Orchestration', () => {
  it('should boot all systems and return healthy status', async () => {
    const app = express();
    
    // Simulate startup
    const result = await orchestrator.startup(app);
    
    expect(result.success).toBe(true);
    // In CI test environments, we expect MONGODB and REDIS to be available
    expect(result.phases.mongodb).toBe(true);
    if (process.env.CI === 'true') {
      expect(result.phases.redis).toBe(true);
    }
    
    // Test seeded data access
    const users = await User.find({ email: 'test_integration@devtrack.app' });
    expect(users.length).toBe(1);
    expect(users[0].username).toBe('test_integration');

    // Simulate graceful shutdown
    await orchestrator.shutdown();
  });
});
