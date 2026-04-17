// src/db/models/dsaSubmission.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IDsaSubmission extends Document {
  userId: Schema.Types.ObjectId;
  problemId: Schema.Types.ObjectId;
  platform: 'leetcode' | 'codeforces' | 'hackerrank' | 'codechef' | 'other';
  status: 'accepted' | 'wrong' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error';
  language: string;
  codeSnippet: string | null;
  submittedAt: Date;
  executionTime: number | null;
  memoryUsed: number | null;
  createdAt: Date;
}

const dsaSubmissionSchema = new Schema<IDsaSubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'DsaProblem',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['leetcode', 'codeforces', 'hackerrank', 'codechef', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['accepted', 'wrong', 'time_limit_exceeded', 'runtime_error', 'compilation_error'],
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    codeSnippet: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      required: true,
      index: true,
    },
    executionTime: {
      type: Number,
      default: null,
    },
    memoryUsed: {
      type: Number,
      default: null,
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
dsaSubmissionSchema.index({ userId: 1, submittedAt: -1 });
dsaSubmissionSchema.index({ userId: 1, problemId: 1, submittedAt: -1 });
dsaSubmissionSchema.index({ userId: 1, status: 1 });

export const DsaSubmission = model<IDsaSubmission>('DsaSubmission', dsaSubmissionSchema);