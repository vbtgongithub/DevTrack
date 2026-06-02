import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendationMemory extends Document {
  userId: string;
  recommendationId: string; // Unique identifier for the recommendation type
  status: 'active' | 'ignored' | 'completed';
  context: Record<string, any>; // Store any context like "Redis" or "Graph"
  shownCount: number;
  lastShownAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationMemorySchema = new Schema<IRecommendationMemory>(
  {
    userId: { type: String, required: true, index: true },
    recommendationId: { type: String, required: true },
    status: { type: String, enum: ['active', 'ignored', 'completed'], default: 'active' },
    context: { type: Schema.Types.Mixed, default: {} },
    shownCount: { type: Number, default: 1 },
    lastShownAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

// Compound index for fast queries
RecommendationMemorySchema.index({ userId: 1, recommendationId: 1 }, { unique: true });

export const RecommendationMemory = mongoose.model<IRecommendationMemory>('RecommendationMemory', RecommendationMemorySchema);
