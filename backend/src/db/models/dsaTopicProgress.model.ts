// src/db/models/dsaTopicProgress.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IDsaTopicProgress extends Document {
  userId: Schema.Types.ObjectId;
  topicName: string;
  totalProblems: number;
  solvedCount: number;
  easyCount: number;
  easySolved: number;
  mediumCount: number;
  mediumSolved: number;
  hardCount: number;
  hardSolved: number;
  updatedAt: Date;
}

const dsaTopicProgressSchema = new Schema<IDsaTopicProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicName: {
      type: String,
      required: true,
    },
    totalProblems: {
      type: Number,
      default: 0,
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
    easyCount: {
      type: Number,
      default: 0,
    },
    easySolved: {
      type: Number,
      default: 0,
    },
    mediumCount: {
      type: Number,
      default: 0,
    },
    mediumSolved: {
      type: Number,
      default: 0,
    },
    hardCount: {
      type: Number,
      default: 0,
    },
    hardSolved: {
      type: Number,
      default: 0,
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

// Indexes
dsaTopicProgressSchema.index({ userId: 1, topicName: 1 }, { unique: true });

export const DsaTopicProgress = model<IDsaTopicProgress>('DsaTopicProgress', dsaTopicProgressSchema);