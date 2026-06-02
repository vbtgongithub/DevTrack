import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProfileTimelineEvent extends Document {
  userId: Types.ObjectId;
  eventType: 'first_hard_solve' | 'milestone_solves' | 'streak_30' | 'badge_earned' | 'verified_project' | 'level_up' | 'github_verified';
  title: string;
  description: string;
  metadata: Record<string, any>;
  eventDate: Date;
  isVerified: boolean;
  visibility: 'public' | 'private' | 'recruiter_only';
  createdAt: Date;
}

const ProfileTimelineEventSchema = new Schema<IProfileTimelineEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventType: {
      type: String,
      enum: ['first_hard_solve', 'milestone_solves', 'streak_30', 'badge_earned', 'verified_project', 'level_up', 'github_verified'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    eventDate: { type: Date, required: true, index: true },
    isVerified: { type: Boolean, default: true },
    visibility: { type: String, enum: ['public', 'private', 'recruiter_only'], default: 'public' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ProfileTimelineEventSchema.index({ userId: 1, eventDate: -1 });
ProfileTimelineEventSchema.index({ userId: 1, eventType: 1 }, { unique: false });

export const ProfileTimelineEvent = mongoose.model<IProfileTimelineEvent>('ProfileTimelineEvent', ProfileTimelineEventSchema);
