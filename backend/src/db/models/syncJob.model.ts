// src/db/models/syncJob.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface ISyncJob extends Document {
  userId: Schema.Types.ObjectId;
  platformName: 'leetcode' | 'codeforces' | 'github' | 'codechef';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  itemsProcessed: number;
  itemsUpdated: number;
  createdAt: Date;
}

const syncJobSchema = new Schema<ISyncJob>(
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
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    itemsProcessed: {
      type: Number,
      default: 0,
    },
    itemsUpdated: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// Indexes
syncJobSchema.index({ userId: 1, platformName: 1, createdAt: -1 });
syncJobSchema.index({ status: 1, startedAt: -1 });

export const SyncJob = model<ISyncJob>('SyncJob', syncJobSchema);