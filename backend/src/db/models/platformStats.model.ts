// src/db/models/platformStats.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IPlatformStats extends Document {
  userId: Schema.Types.ObjectId;
  platformName: 'leetcode' | 'codeforces' | 'github' | 'codechef';
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  rating: number | null;
  rank: string | null;
  totalContests: number;
  rawData: Record<string, unknown>;
  fetchedAt: Date;
  createdAt: Date;
}

const platformStatsSchema = new Schema<IPlatformStats>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platformName: {
      type: String,
      enum: ['leetcode', 'codeforces', 'github', 'codechef'],
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    totalSolved: {
      type: Number,
      default: 0,
    },
    easySolved: {
      type: Number,
      default: 0,
    },
    mediumSolved: {
      type: Number,
      default: 0,
    },
    hardSolved: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: null,
    },
    rank: {
      type: String,
      default: null,
    },
    totalContests: {
      type: Number,
      default: 0,
    },
    rawData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete (ret as { _id?: unknown })._id;
        delete (ret as { __v?: unknown }).__v;
        // Only remove rawData for non-GitHub platforms to preserve GitHub stats
        if (ret.platformName !== 'github') {
          delete (ret as { rawData?: unknown }).rawData;
        }
        return ret;
      },
    },
  }
);

// Indexes
platformStatsSchema.index({ userId: 1, platformName: 1 }, { unique: true });
platformStatsSchema.index({ fetchedAt: -1 });

export const PlatformStats = model<IPlatformStats>('PlatformStats', platformStatsSchema);