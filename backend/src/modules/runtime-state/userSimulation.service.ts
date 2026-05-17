// src/modules/runtime-state/userSimulation.service.ts — User Simulation for Testing
// Phase 7: Simulates user progression for testing runtime state consistency

import mongoose from 'mongoose';
import { logger } from '../../shared/logger.js';
import { eventBus } from '../../shared/sse/eventBus.js';
import { unifiedRuntimeStateService } from './unifiedRuntimeState.service.js';

export interface SimulationScenario {
  name: string;
  description: string;
  steps: SimulationStep[];
}

export interface SimulationStep {
  action: 'solve_problem' | 'log_streak' | 'complete_goal' | 'earn_achievement' | 'trigger_fatigue' | 'trigger_recovery' | 'idle';
  delay?: number; // ms between steps
  params?: Record<string, unknown>;
}

export interface SimulationResult {
  scenario: string;
  userId: string;
  steps: Array<{
    action: string;
    success: boolean;
    latencyMs: number;
    error?: string;
  }>;
  totalLatencyMs: number;
  success: boolean;
}

// Predefined scenarios
export const SIMULATION_SCENARIOS: Record<string, SimulationScenario> = {
  new_user_onboarding: {
    name: 'New User Onboarding',
    description: 'Simulates a new user solving their first problem and starting a streak',
    steps: [
      { action: 'solve_problem', params: { difficulty: 'easy', platform: 'leetcode', xp: 25 } },
      { action: 'log_streak', delay: 100 },
      { action: 'solve_problem', params: { difficulty: 'easy', platform: 'leetcode', xp: 25 }, delay: 200 },
      { action: 'complete_goal', params: { goalId: 'first_problem' }, delay: 100 },
    ],
  },
  streak_at_risk: {
    name: 'Streak At Risk',
    description: 'Simulates a user approaching streak loss',
    steps: [
      { action: 'idle', params: { hours: 20 } },
    ],
  },
  burnout_recovery: {
    name: 'Burnout Recovery',
    description: 'Simulates a user experiencing fatigue and then recovering',
    steps: [
      { action: 'trigger_fatigue', params: { level: 'high' } },
      { action: 'idle', params: { hours: 24 }, delay: 200 },
      { action: 'trigger_recovery', delay: 200 },
      { action: 'solve_problem', params: { difficulty: 'easy', platform: 'leetcode', xp: 25 }, delay: 200 },
    ],
  },
  milestone_chain: {
    name: 'Milestone Chain',
    description: 'Simulates a user hitting multiple milestones in sequence',
    steps: [
      { action: 'solve_problem', params: { difficulty: 'medium', platform: 'leetcode', xp: 50 } },
      { action: 'solve_problem', params: { difficulty: 'hard', platform: 'leetcode', xp: 100 }, delay: 100 },
      { action: 'earn_achievement', params: { achievementId: 'hard_solver', name: 'Hard Problem Solver' }, delay: 100 },
      { action: 'complete_goal', params: { goalId: 'weekly_target' }, delay: 100 },
    ],
  },
};

export const userSimulation = {
  /**
   * Run a simulation scenario for a user
   */
  async runScenario(userId: string, scenarioName: string): Promise<SimulationResult> {
    const scenario = SIMULATION_SCENARIOS[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    logger.info('[simulation] Starting scenario', { userId, scenario: scenarioName });

    const steps: SimulationResult['steps'] = [];
    const startTime = Date.now();

    for (const step of scenario.steps) {
      if (step.delay) {
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }

      const stepStart = Date.now();
      try {
        await this.executeStep(userId, step);
        steps.push({
          action: step.action,
          success: true,
          latencyMs: Date.now() - stepStart,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        steps.push({
          action: step.action,
          success: false,
          latencyMs: Date.now() - stepStart,
          error: errorMessage,
        });
        logger.error('[simulation] Step failed', {
          userId,
          action: step.action,
          error: errorMessage,
        });
      }
    }

    const result: SimulationResult = {
      scenario: scenarioName,
      userId,
      steps,
      totalLatencyMs: Date.now() - startTime,
      success: steps.every((s) => s.success),
    };

    logger.info('[simulation] Scenario complete', {
      userId,
      scenario: scenarioName,
      success: result.success,
      totalLatencyMs: result.totalLatencyMs,
    });

    return result;
  },

  /**
   * Execute a single simulation step
   */
  async executeStep(userId: string, step: SimulationStep): Promise<void> {
    switch (step.action) {
      case 'solve_problem': {
        const xp = (step.params?.xp as number) ?? 25;
        await eventBus.publishEnvelope(userId, 'xp_updated', {
          delta: xp,
          source: 'simulation',
          difficulty: step.params?.difficulty ?? 'easy',
          platform: step.params?.platform ?? 'leetcode',
        });
        break;
      }
      case 'log_streak': {
        await eventBus.publishEnvelope(userId, 'streak_milestone', {
          source: 'simulation',
        });
        break;
      }
      case 'complete_goal': {
        await eventBus.publishEnvelope(userId, 'goal_completed', {
          goalId: step.params?.goalId ?? 'test_goal',
          source: 'simulation',
        });
        break;
      }
      case 'earn_achievement': {
        await eventBus.publishEnvelope(userId, 'achievement_unlocked', {
          achievementId: step.params?.achievementId ?? 'test_achievement',
          name: step.params?.name ?? 'Test Achievement',
          source: 'simulation',
        });
        break;
      }
      case 'trigger_fatigue': {
        const { UnifiedRuntimeState } = await import('../../db/models/unifiedRuntimeState.model.js');
        await UnifiedRuntimeState.updateOne(
          { userId: new mongoose.Types.ObjectId(userId) },
          { $set: { fatigueState: step.params?.level ?? 'high' } }
        );
        break;
      }
      case 'trigger_recovery': {
        const { UnifiedRuntimeState } = await import('../../db/models/unifiedRuntimeState.model.js');
        await UnifiedRuntimeState.updateOne(
          { userId: new mongoose.Types.ObjectId(userId) },
          { $set: { recoveryState: 'active', fatigueState: 'low' } }
        );
        break;
      }
      case 'idle': {
        // No-op — idle is just about the delay
        break;
      }
      default:
        logger.warn('[simulation] Unknown step action', { action: step.action });
    }
  },

  /**
   * List available scenarios
   */
  listScenarios(): Array<{ name: string; description: string; stepCount: number }> {
    return Object.entries(SIMULATION_SCENARIOS).map(([key, scenario]) => ({
      name: key,
      description: scenario.description,
      stepCount: scenario.steps.length,
    }));
  },
};

export default userSimulation;
