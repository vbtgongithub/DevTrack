// src/modules/retention/achievements/achievement.model.ts — Achievement/Badge schema
// Phase-C2: Production-grade achievement infrastructure with rarity and prerequisites

import mongoose, { Schema, type Document } from 'mongoose';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'streak' | 'problems' | 'xp' | 'level' | 'challenge' | 'goal' | 'special';

export interface IAchievement extends Document {
  userId: Schema.Types.ObjectId;

  // Badge definition
  achievementTemplateId: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;

  // Rarity
  rarity: AchievementRarity;
  isHidden: boolean;
  isPrestige: boolean;
  isSeasonal: boolean;
  seasonId?: string;

  // Unlock info
  unlockedAt: Date;
  xpReward: number;

  // Dependencies
  prerequisites: string[];

  createdAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },

    // Badge definition
    achievementTemplateId: { type: String, required: true },
    name: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    icon: { type: String, default: '🏅' },
    category: { type: String, enum: ['streak', 'problems', 'xp', 'level', 'challenge', 'goal', 'special'], required: true },

    // Rarity
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
    isHidden: { type: Boolean, default: false },
    isPrestige: { type: Boolean, default: false },
    isSeasonal: { type: Boolean, default: false },
    seasonId: { type: String },

    // Unlock info
    unlockedAt: { type: Date, default: null },
    xpReward: { type: Number, default: 0, min: 0 },

    // Dependencies
    prerequisites: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes
achievementSchema.index({ userId: 1, rarity: 1 });
achievementSchema.index({ userId: 1, category: 1 });
achievementSchema.index({ userId: 1, unlockedAt: -1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);