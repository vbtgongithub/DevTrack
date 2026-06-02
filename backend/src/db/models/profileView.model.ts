import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProfileView extends Document {
  profileUserId: Types.ObjectId;
  viewerType: 'public' | 'recruiter' | 'authenticated';
  viewerUserId: Types.ObjectId | null;
  viewerIp: string;
  referrer: string | null;
  userAgent: string | null;
  createdAt: Date;
}

const ProfileViewSchema = new Schema<IProfileView>(
  {
    profileUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewerType: { type: String, enum: ['public', 'recruiter', 'authenticated'], required: true },
    viewerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    viewerIp: { type: String, required: true },
    referrer: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ProfileViewSchema.index({ profileUserId: 1, createdAt: -1 });
ProfileViewSchema.index({ profileUserId: 1, viewerType: 1 });
// TTL index on createdAt (365 days)
ProfileViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const ProfileView = mongoose.model<IProfileView>('ProfileView', ProfileViewSchema);
