// src/db/models/connectedPlatform.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IConnectedPlatform extends Document {
  userId: Schema.Types.ObjectId;
  platformName: 'leetcode' | 'codeforces' | 'github' | 'hackerrank' | 'codechef';
  username: string;
  profileUrl: string;
  accessToken: string | null;
  isConnected: boolean;
  lastSyncedAt: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  syncError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const connectedPlatformSchema = new Schema<IConnectedPlatform>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platformName: {
      type: String,
      enum: ['leetcode', 'codeforces', 'github', 'hackerrank', 'codechef'],
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    profileUrl: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      default: null,
      select: false,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'error', 'success'],
      default: 'idle',
    },
    syncError: {
      type: String,
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
        delete (ret as { accessToken?: unknown }).accessToken;
        return ret;
      },
    },
  }
);

// Indexes
connectedPlatformSchema.index({ userId: 1, platformName: 1 }, { unique: true });
connectedPlatformSchema.index({ userId: 1, isConnected: 1 });
connectedPlatformSchema.index({ lastSyncedAt: 1 });

export const ConnectedPlatform = model<IConnectedPlatform>('ConnectedPlatform', connectedPlatformSchema);