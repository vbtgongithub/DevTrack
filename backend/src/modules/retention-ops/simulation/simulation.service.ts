// src/modules/retention-ops/simulation/simulation.service.ts — Retention Simulation Engine
// Phase-E: Simulate retention changes before rollout

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export type SimulationParameter = 'xp_pacing' | 'challenge_difficulty' | 'onboarding_pacing' | 'reward_timing' | 'notification_timing' | 'streak_pressure';

export interface SimulationScenario {
  id: string;
  name: string;
  parameter: SimulationParameter;
  change: number;
  description: string;
  createdAt: Date;
  createdBy: string;
}

export interface SimulationResult {
  scenarioId: string;
  predictedImpact: {
    fatigue: number;
    progressionSpeed: number;
    burnout: number;
    leaderboardInflation: number;
    challengeCompletion: number;
    comebackSuccess: number;
    momentumQuality: number;
  };
  confidence: number;
  risks: string[];
  recommendations: string[];
  simulatedAt: Date;
  validUntil: Date;
}

export interface CohortSimulation {
  cohortSize: number;
  retentionChange: number;
  engagementChange: number;
  xpVelocityChange: number;
}

const SIMULATION_KEY_PREFIX = 'simulation:';
const SCENARIO_KEY = 'simulation:scenarios';
const RESULT_KEY = 'simulation:results';

export const simulationService = {
  // ─── Create simulation scenario ─────────────────────────────────────────
  async createScenario(
    name: string,
    parameter: SimulationParameter,
    change: number,
    description: string,
    createdBy: string
  ): Promise<SimulationScenario> {
    const scenario: SimulationScenario = {
      id: `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      parameter,
      change,
      description,
      createdAt: new Date(),
      createdBy,
    };

    const redis = getRedisClient();
    await redis.rpush(SCENARIO_KEY, JSON.stringify(scenario));

    logger.info('[simulation] Scenario created', { id: scenario.id, parameter, change });

    return scenario;
  },

  // ─── Run simulation for scenario ───────────────────────────────────────
  async runSimulation(scenario: SimulationScenario): Promise<SimulationResult> {
    const impact = this.predictImpact(scenario.parameter, scenario.change);

    const result: SimulationResult = {
      scenarioId: scenario.id,
      predictedImpact: impact,
      confidence: this.calculateConfidence(scenario),
      risks: this.identifyRisks(scenario, impact),
      recommendations: this.generateRecommendations(scenario, impact),
      simulatedAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const redis = getRedisClient();
    await redis.hset(RESULT_KEY, scenario.id, JSON.stringify(result));

    return result;
  },

  // ─── Predict impact based on parameter change ─────────────────────────
  predictImpact(parameter: SimulationParameter, change: number): SimulationResult['predictedImpact'] {
    const normalizedChange = change / 100;

    switch (parameter) {
      case 'xp_pacing':
        return {
          fatigue: Math.max(0, Math.min(100, 10 + normalizedChange * 30)),
          progressionSpeed: Math.max(0, Math.min(100, 50 + normalizedChange * 40)),
          burnout: Math.max(0, Math.min(100, 15 + normalizedChange * 25)),
          leaderboardInflation: Math.max(0, Math.min(100, 20 + normalizedChange * 50)),
          challengeCompletion: Math.max(0, Math.min(100, 60 + normalizedChange * 20)),
          comebackSuccess: Math.max(0, Math.min(100, 55 + normalizedChange * 15)),
          momentumQuality: Math.max(0, Math.min(100, 50 + normalizedChange * 30)),
        };

      case 'challenge_difficulty':
        return {
          fatigue: Math.max(0, Math.min(100, 15 + normalizedChange * 40)),
          progressionSpeed: Math.max(0, Math.min(100, 45 + normalizedChange * 15)),
          burnout: Math.max(0, Math.min(100, 20 + normalizedChange * 35)),
          leaderboardInflation: Math.max(0, Math.min(100, 10 + normalizedChange * 20)),
          challengeCompletion: Math.max(0, Math.min(100, 70 - normalizedChange * 30)),
          comebackSuccess: Math.max(0, Math.min(100, 50 - normalizedChange * 20)),
          momentumQuality: Math.max(0, Math.min(100, 55 - normalizedChange * 25)),
        };

      case 'onboarding_pacing':
        return {
          fatigue: Math.max(0, Math.min(100, 5 - normalizedChange * 10)),
          progressionSpeed: Math.max(0, Math.min(100, 60 + normalizedChange * 20)),
          burnout: Math.max(0, Math.min(100, 10 - normalizedChange * 15)),
          leaderboardInflation: Math.max(0, Math.min(100, 15 + normalizedChange * 10)),
          challengeCompletion: Math.max(0, Math.min(100, 50 + normalizedChange * 25)),
          comebackSuccess: Math.max(0, Math.min(100, 45 + normalizedChange * 20)),
          momentumQuality: Math.max(0, Math.min(100, 40 + normalizedChange * 30)),
        };

      case 'reward_timing':
        return {
          fatigue: Math.max(0, Math.min(100, 12 + normalizedChange * 15)),
          progressionSpeed: Math.max(0, Math.min(100, 55 + normalizedChange * 25)),
          burnout: Math.max(0, Math.min(100, 18 + normalizedChange * 20)),
          leaderboardInflation: Math.max(0, Math.min(100, 25 + normalizedChange * 30)),
          challengeCompletion: Math.max(0, Math.min(100, 55 + normalizedChange * 15)),
          comebackSuccess: Math.max(0, Math.min(100, 50 + normalizedChange * 20)),
          momentumQuality: Math.max(0, Math.min(100, 45 + normalizedChange * 25)),
        };

      case 'notification_timing':
        return {
          fatigue: Math.max(0, Math.min(100, 25 + normalizedChange * 40)),
          progressionSpeed: Math.max(0, Math.min(100, 48 + normalizedChange * 5)),
          burnout: Math.max(0, Math.min(100, 20 + normalizedChange * 30)),
          leaderboardInflation: Math.max(0, Math.min(100, 15 + normalizedChange * 10)),
          challengeCompletion: Math.max(0, Math.min(100, 45 - normalizedChange * 15)),
          comebackSuccess: Math.max(0, Math.min(100, 40 - normalizedChange * 20)),
          momentumQuality: Math.max(0, Math.min(100, 35 - normalizedChange * 25)),
        };

      case 'streak_pressure':
        return {
          fatigue: Math.max(0, Math.min(100, 20 + normalizedChange * 35)),
          progressionSpeed: Math.max(0, Math.min(100, 42 + normalizedChange * 10)),
          burnout: Math.max(0, Math.min(100, 25 + normalizedChange * 40)),
          leaderboardInflation: Math.max(0, Math.min(100, 30 + normalizedChange * 25)),
          challengeCompletion: Math.max(0, Math.min(100, 40 - normalizedChange * 20)),
          comebackSuccess: Math.max(0, Math.min(100, 35 - normalizedChange * 25)),
          momentumQuality: Math.max(0, Math.min(100, 30 - normalizedChange * 30)),
        };

      default:
        return {
          fatigue: 15,
          progressionSpeed: 50,
          burnout: 15,
          leaderboardInflation: 20,
          challengeCompletion: 55,
          comebackSuccess: 50,
          momentumQuality: 50,
        };
    }
  },

  // ─── Calculate confidence based on scenario ───────────────────────────
  calculateConfidence(scenario: SimulationScenario): number {
    let confidence = 80;

    if (Math.abs(scenario.change) > 50) {
      confidence -= 20;
    }

    if (Math.abs(scenario.change) > 30) {
      confidence -= 10;
    }

    if (scenario.parameter === 'notification_timing' || scenario.parameter === 'streak_pressure') {
      confidence -= 10;
    }

    return Math.max(50, confidence);
  },

  // ─── Identify risks based on predicted impact ─────────────────────────
  identifyRisks(scenario: SimulationScenario, impact: SimulationResult['predictedImpact']): string[] {
    const risks: string[] = [];

    if (impact.fatigue > 60) {
      risks.push('High fatigue risk for users');
    }

    if (impact.burnout > 50) {
      risks.push('Significant burnout potential');
    }

    if (impact.leaderboardInflation > 70) {
      risks.push('Leaderboard inflation likely');
    }

    if (impact.comebackSuccess < 40) {
      risks.push('Comeback success will decrease');
    }

    if (impact.momentumQuality < 40) {
      risks.push('Momentum quality degradation expected');
    }

    return risks;
  },

  // ─── Generate recommendations based on impact ─────────────────────────
  generateRecommendations(scenario: SimulationScenario, impact: SimulationResult['predictedImpact']): string[] {
    const recommendations: string[] = [];

    if (impact.fatigue > 50) {
      recommendations.push('Implement fatigue suppression');
    }

    if (impact.burnout > 40) {
      recommendations.push('Reduce challenge intensity or add rest periods');
    }

    if (impact.progressionSpeed > 70) {
      recommendations.push('Consider adding progression caps');
    }

    if (impact.leaderboardInflation > 60) {
      recommendations.push('Implement trust-weighted leaderboard adjustments');
    }

    if (impact.comebackSuccess < 50) {
      recommendations.push('Increase comeback generosity');
    }

    if (recommendations.length === 0) {
      recommendations.push('Scenario appears safe for rollout');
    }

    return recommendations;
  },

  // ─── Run cohort simulation ────────────────────────────────────────────
  async runCohortSimulation(scenario: SimulationScenario, cohortSize: number): Promise<CohortSimulation> {
    const impact = this.predictImpact(scenario.parameter, scenario.change);

    return {
      cohortSize,
      retentionChange: Math.round((impact.momentumQuality - 50) * 0.5),
      engagementChange: Math.round((impact.progressionSpeed - 50) * 0.4),
      xpVelocityChange: Math.round((impact.progressionSpeed - 50) * 0.6),
    };
  },

  // ─── Get simulation results ───────────────────────────────────────────
  async getSimulationResult(scenarioId: string): Promise<SimulationResult | null> {
    const redis = getRedisClient();
    const result = await redis.hget(RESULT_KEY, scenarioId);

    return result ? JSON.parse(result) : null;
  },

  // ─── Get all scenarios ───────────────────────────────────────────────
  async getAllScenarios(): Promise<SimulationScenario[]> {
    const redis = getRedisClient();
    const scenarios = await redis.lrange(SCENARIO_KEY, 0, -1);

    return scenarios.map((s: string) => JSON.parse(s));
  },

  // ─── Validate safety of scenario ─────────────────────────────────────
  async validateScenarioSafety(scenario: SimulationScenario): Promise<{
    safe: boolean;
    violations: string[];
  }> {
    const result = await this.runSimulation(scenario);
    const violations: string[] = [];

    if (result.predictedImpact.fatigue > 75) {
      violations.push('Excessive fatigue increase');
    }

    if (result.predictedImpact.burnout > 60) {
      violations.push('Burnout risk too high');
    }

    if (result.predictedImpact.momentumQuality < 30) {
      violations.push('Momentum quality would degrade significantly');
    }

    return {
      safe: violations.length === 0,
      violations,
    };
  },
};

export default simulationService;