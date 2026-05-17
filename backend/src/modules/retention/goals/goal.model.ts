// src/modules/retention/goals/goal.model.ts — Goal schema for daily/weekly retention loops
// Phase-C1: Core progression loop - Goal Engine

import mongoose, { Schema, type Document } from 'mongoose';

export type GoalType = 'daily' | 'weekly';
export type GoalCategory = 'dsa' | 'github' | 'xp' | 'streak' | 'mixed';
export type GoalDifficulty = 'easy' | 'medium' | 'hard';
export type GoalStatus = 'active' | 'completed' | 'expired';

export interface IGoal extends Document {
  userId: Schema.Types.ObjectId;

  // Goal definition
  type: GoalType;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  title: string;
  description: string;

  // Difficulty & rewards
  difficulty: GoalDifficulty;
  xpReward: number;
  streakBonus: boolean;

  // Lifecycle
  status: GoalStatus;
  startedAt: Date;
  expiresAt: Date;
  completedAt: Date | null;

  // Psychology flags
  isStreakLinked: boolean;
  isMomentumSensitive: boolean;

  // Trust-aware scaling
  trustScoreAtCreation: number;

  // Anti-farming
  completionCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },

    // Goal definition
    type: { type: String, enum: ['daily', 'weekly'], required: true },
    category: { type: String, enum: ['dsa', 'github', 'xp', 'streak', 'mixed'], required: true },
    targetValue: { type: Number, required: true, min: 1 },
    currentValue: { type: Number, default: 0, min: 0 },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },

    // Difficulty & rewards
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    xpReward: { type: Number, default: 0, min: 0 },
    streakBonus: { type: Boolean, default: false },

    // Lifecycle
    status: { type: String, enum: ['active', 'completed', 'expired'], default: 'active' },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },

    // Psychology flags
    isStreakLinked: { type: Boolean, default: false },
    isMomentumSensitive: { type: Boolean, default: false },

    // Trust-aware scaling
    trustScoreAtCreation: { type: Number, default: 100, min: 0, max: 100 },

    // Anti-farming
    completionCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Indexes for efficient querying
goalSchema.index({ userId: 1, type: 1, status: 1 });
goalSchema.index({ userId: 1, expiresAt: 1 });
goalSchema.index({ status: 1, expiresAt: 1 });

export const Goal = mongoose.model<IGoal>('Goal', goalSchema);