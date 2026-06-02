import mongoose, { Schema, Document } from 'mongoose';

export interface IDSAProfile extends Document {
  userId: string;
  platform: 'leetcode' | 'codeforces' | 'manual';
  
  // Problem Counts
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  
  // Streak Metrics
  currentStreak: number;
  longestStreak: number;
  lastSolvedDate: Date | null;
  
  // Topic Breakdown
  topicBreakdown: {
    arrays: number;
    hashing: number;
    strings: number;
    linkedList: number;
    stack: number;
    queue: number;
    trees: number;
    graphs: number;
    heaps: number;
    recursion: number;
    backtracking: number;
    dp: number;
    greedy: number;
    binarySearch: number;
  };
  
  // Metadata
  isVerified: boolean;
  lastSyncedAt: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

const topicBreakdownSchema = new Schema({
  arrays: { type: Number, default: 0 },
  hashing: { type: Number, default: 0 },
  strings: { type: Number, default: 0 },
  linkedList: { type: Number, default: 0 },
  stack: { type: Number, default: 0 },
  queue: { type: Number, default: 0 },
  trees: { type: Number, default: 0 },
  graphs: { type: Number, default: 0 },
  heaps: { type: Number, default: 0 },
  recursion: { type: Number, default: 0 },
  backtracking: { type: Number, default: 0 },
  dp: { type: Number, default: 0 },
  greedy: { type: Number, default: 0 },
  binarySearch: { type: Number, default: 0 },
}, { _id: false });

const dsaProfileSchema = new Schema<IDSAProfile>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['leetcode', 'codeforces', 'manual'],
      index: true,
    },
    
    // Problem Counts
    totalSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    easySolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    mediumSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    hardSolved: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Streak Metrics
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSolvedDate: {
      type: Date,
      default: null,
    },
    
    // Topic Breakdown
    topicBreakdown: {
      type: topicBreakdownSchema,
      default: {},
    },
    
    // Metadata
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete (ret as { _id?: unknown })._id;
        delete (ret as { __v?: unknown }).__v;
        return ret;
      },
    },
  }
);

// Compound index for userId + platform (unique combination)
dsaProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });
dsaProfileSchema.index({ userId: 1, platform: 1, updatedAt: -1 });
dsaProfileSchema.index({ platform: 1, totalSolved: -1 });

export const DSAProfile = mongoose.model<IDSAProfile>('DSAProfile', dsaProfileSchema);
