// src/db/models/intelligenceRecommendation.model.ts
import { Schema, model, type Document } from 'mongoose';

export type RecommendationCategory = 'ats' | 'semantic' | 'credibility' | 'infrastructure' | 'role_alignment';
export type RecommendationState = 'active' | 'ignored' | 'completed';

export interface IIntelligenceRecommendation extends Document {
  userId: Schema.Types.ObjectId;
  resumeProfileId: Schema.Types.ObjectId;
  
  category: RecommendationCategory;
  title: string;
  content: string; // The specific, engineering-focused recommendation text
  
  confidence: number; // 0-100
  impact: {
    scoreImprovement: number;
    type: 'ats' | 'semantic' | 'credibility';
  };
  
  // Array of string references to issues in ATSAnalysis or IDs of ResumeEvidenceClaim
  evidenceReferences: string[];
  
  // IDs of other recommendations that must be completed first
  dependencies: Schema.Types.ObjectId[];
  
  state: RecommendationState;
  
  metadata: Record<string, unknown>; // E.g., for semantic concepts missed

  createdAt: Date;
  updatedAt: Date;
}

const intelligenceRecommendationSchema = new Schema<IIntelligenceRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ResumeProfile',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['ats', 'semantic', 'credibility', 'infrastructure', 'role_alignment'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    impact: {
      scoreImprovement: { type: Number, default: 0 },
      type: { type: String, enum: ['ats', 'semantic', 'credibility'], default: 'ats' },
    },
    evidenceReferences: {
      type: [String],
      default: [],
    },
    dependencies: {
      type: [Schema.Types.ObjectId],
      ref: 'IntelligenceRecommendation',
      default: [],
    },
    state: {
      type: String,
      enum: ['active', 'ignored', 'completed'],
      default: 'active',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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

// Indexes for fast lookup by resume
intelligenceRecommendationSchema.index({ resumeProfileId: 1, state: 1 });
intelligenceRecommendationSchema.index({ userId: 1, category: 1 });

export const IntelligenceRecommendation = model<IIntelligenceRecommendation>('IntelligenceRecommendation', intelligenceRecommendationSchema);
