// src/modules/retention/challenges/challenge.model.ts — Challenge schema for medium-term engagement
// Phase-C2: Challenge Engine - daily/weekly/milestone/comeback challenges

import mongoose, { Schema, type Document } from 'mongoose';

export type ChallengeType = 'daily' | 'weekly' | 'milestone' | 'seasonal' | 'hidden' | 'comeback';
export type ChallengeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'abandoned';

export interface IChallenge extends Document {
  userId: Schema.Types.ObjectId;

  // Challenge definition
  challengeTemplateId: string;
  type: ChallengeType;
  title: string;
  description: string;
  category: string;

  // Progress tracking
  targetValue: number;
  currentValue: number;

  // Rarity & rewards
  rarity: ChallengeRarity;
  xpReward: number;
  badgeReward?: string;

  // Lifecycle
  status: ChallengeStatus;
  startedAt: Date;
  expiresAt: Date;
  completedAt: Date | null;

  // Anti-farming
  completionCount: number;

  // Metadata
  sourceTrigger?: string;
  trustScoreAtCreation: number;

  createdAt: Date;
  updatedAt: Date;
}

const challengeSchema = new Schema<IChallenge>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },

    // Challenge definition
    challengeTemplateId: { type: String, required: true },
    type: { type: String, enum: ['daily', 'weekly', 'milestone', 'seasonal', 'hidden', 'comeback'], required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    category: { type: String, required: true },

    // Progress tracking
    targetValue: { type: Number, required: true, min: 1 },
    currentValue: { type: Number, default: 0, min: 0 },

    // Rarity & rewards
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
    xpReward: { type: Number, default: 0, min: 0 },
    badgeReward: { type: String },

    // Lifecycle
    status: { type: String, enum: ['active', 'completed', 'expired', 'abandoned'], default: 'active' },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },

    // Anti-farming
    completionCount: { type: Number, default: 0, min: 0 },

    // Metadata
    sourceTrigger: { type: String },
    trustScoreAtCreation: { type: Number, default: 100, min: 0, max: 100 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Indexes
challengeSchema.index({ userId: 1, type: 1, status: 1 });
challengeSchema.index({ userId: 1, expiresAt: 1 });
challengeSchema.index({ status: 1, expiresAt: 1 });

export const Challenge = mongoose.model<IChallenge>('Challenge', challengeSchema);