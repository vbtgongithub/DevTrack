// src/db/models/dsaContest.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IDsaContest extends Document {
  userId: Schema.Types.ObjectId;
  platform: 'leetcode' | 'codeforces' | 'hackerrank' | 'codechef' | 'other';
  contestName: string;
  rank: number | null;
  totalParticipants: number | null;
  problemsSolved: number;
  ratingBefore: number | null;
  ratingAfter: number | null;
  ratingChange: number | null;
  participatedAt: Date;
  createdAt: Date;
}

const dsaContestSchema = new Schema<IDsaContest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'codechef', 'other'],
      required: true,
    },
    contestName: {
      type: String,
      required: true,
    },
    rank: {
      type: Number,
      default: null,
    },
    totalParticipants: {
      type: Number,
      default: null,
    },
    problemsSolved: {
      type: Number,
      default: 0,
    },
    ratingBefore: {
      type: Number,
      default: null,
    },
    ratingAfter: {
      type: Number,
      default: null,
    },
    ratingChange: {
      type: Number,
      default: null,
    },
    participatedAt: {
      type: Date,
      required: true,
      index: true,
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
dsaContestSchema.index({ userId: 1, participatedAt: -1 });
dsaContestSchema.index({ userId: 1, platform: 1 });

export const DsaContest = model<IDsaContest>('DsaContest', dsaContestSchema);
