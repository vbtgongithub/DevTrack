// src/modules/retention-v2/profile/retentionProfile.model.ts — Unified Retention Profile
// Phase-D: Central behavioral intelligence system

import mongoose, { Schema, type Document } from 'mongoose';

export type BehavioralState =
  | 'new_user'
  | 'onboarding'
  | 'engaged'
  | 'high_momentum'
  | 'streak_risk'
  | 'fatigued'
  | 'burnout_risk'
  | 'recovering'
  | 'comeback_candidate'
  | 'power_user';

export interface RetentionProfile extends Document {
  userId: Schema.Types.ObjectId;

  // Behavioral state
  state: BehavioralState;
  previousState: BehavioralState | null;
  stateChangedAt: Date | null;
  stateDuration: number; // hours in current state

  // Behavioral scores (-100 to +100)
  momentumScore: number;
  fatigueScore: number;
  burnoutProbability: number;
  comebackProbability: number;
  engagementQuality: number;

  // Progression health
  progressionHealth: number; // 0-100
  rewardResponsiveness: number;
  challengeCompletionConsistency: number;
  streakResilience: number;

  // Notification responsiveness
  notificationResponsiveness: number;
  notificationFatigue: number;

  // Time series for trend analysis (last 7 days)
  dailyMomentumHistory: Array<{ date: string; score: number }>;
  dailyFatigueHistory: Array<{ date: string; score: number }>;
  dailyEngagementHistory: Array<{ date: string; minutes: number; sessions: number }>;

  // Computed timestamps
  computedAt: Date;
  lastUpdated: Date;
}

const retentionProfileSchema = new Schema<RetentionProfile>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },

    // Behavioral state
    state: {
      type: String,
      enum: ['new_user', 'onboarding', 'engaged', 'high_momentum', 'streak_risk', 'fatigued', 'burnout_risk', 'recovering', 'comeback_candidate', 'power_user'],
      default: 'new_user',
    },
    previousState: { type: String, enum: ['new_user', 'onboarding', 'engaged', 'high_momentum', 'streak_risk', 'fatigued', 'burnout_risk', 'recovering', 'comeback_candidate', 'power_user', null] },
    stateChangedAt: { type: Date, default: null },
    stateDuration: { type: Number, default: 0 },

    // Behavioral scores
    momentumScore: { type: Number, default: 0, min: -100, max: 100 },
    fatigueScore: { type: Number, default: 0, min: 0, max: 100 },
    burnoutProbability: { type: Number, default: 0, min: 0, max: 100 },
    comebackProbability: { type: Number, default: 0, min: 0, max: 100 },
    engagementQuality: { type: Number, default: 50, min: 0, max: 100 },

    // Progression health
    progressionHealth: { type: Number, default: 70, min: 0, max: 100 },
    rewardResponsiveness: { type: Number, default: 50, min: 0, max: 100 },
    challengeCompletionConsistency: { type: Number, default: 50, min: 0, max: 100 },
    streakResilience: { type: Number, default: 50, min: 0, max: 100 },

    // Notification responsiveness
    notificationResponsiveness: { type: Number, default: 50, min: 0, max: 100 },
    notificationFatigue: { type: Number, default: 0, min: 0, max: 100 },

    // Time series (last 7 days)
    dailyMomentumHistory: {
      type: [{
        date: { type: String },
        score: { type: Number },
      }],
      default: [],
    },
    dailyFatigueHistory: {
      type: [{
        date: { type: String },
        score: { type: Number },
      }],
      default: [],
    },
    dailyEngagementHistory: {
      type: [{
        date: { type: String },
        minutes: { type: Number },
        sessions: { type: Number },
      }],
      default: [],
    },

    // Computed timestamps
    computedAt: { type: Date, default: null },
    lastUpdated: { type: Date, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: false } }
);

// Indexes
retentionProfileSchema.index({ state: 1 });
retentionProfileSchema.index({ momentumScore: -1 });
retentionProfileSchema.index({ burnoutProbability: -1 });
retentionProfileSchema.index({ computedAt: -1 });

export const RetentionProfile = mongoose.model<RetentionProfile>('RetentionProfile', retentionProfileSchema);