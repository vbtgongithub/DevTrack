// src/db/models/deadLetterJob.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IDeadLetterJob extends Document {
  queueName: string;
  jobId: string;
  workerName: string;
  payload: any;
  failureReason: string;
  stackTrace?: string;
  retryHistory: any[];
  failedAt: Date;
  recovered: boolean;
}

const deadLetterJobSchema = new Schema<IDeadLetterJob>(
  {
    queueName: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    workerName: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    failureReason: { type: String, required: true },
    stackTrace: { type: String },
    retryHistory: { type: Schema.Types.Mixed, default: [] },
    failedAt: { type: Date, default: Date.now, index: true },
    recovered: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const DeadLetterJob = model<IDeadLetterJob>('DeadLetterJob', deadLetterJobSchema);
