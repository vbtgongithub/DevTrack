// src/modules/retention/challenges/index.ts — Challenge Engine barrel export
export { Challenge, type IChallenge, type ChallengeType, type ChallengeRarity, type ChallengeStatus } from './challenge.model.js';
export { challengeGenerator, type ChallengeAssignmentOptions } from './challenge.generator.js';
export { challengeService, type ChallengeProgressSummary, type ChallengeCompletionResult } from './challenge.service.js';