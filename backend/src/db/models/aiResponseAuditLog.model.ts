import mongoose, { Schema, Document } from 'mongoose';

export interface IAIResponseAuditLog extends Document {
  userId: string;
  prompt: string;
  response: string;
  provider: 'openai' | 'gemini' | 'fallback';
  latencyMs: number;
  tokensUsed: number;
  moderationFlags: string[];
  hallucinationFlags: string[];
  createdAt: Date;
}

const AIResponseAuditLogSchema = new Schema<IAIResponseAuditLog>(
  {
    userId: { type: String, required: true, index: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    provider: { type: String, enum: ['openai', 'gemini', 'fallback'], required: true },
    latencyMs: { type: Number, required: true },
    tokensUsed: { type: Number, default: 0 },
    moderationFlags: [{ type: String }],
    hallucinationFlags: [{ type: String }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AIResponseAuditLog = mongoose.model<IAIResponseAuditLog>('AIResponseAuditLog', AIResponseAuditLogSchema);
