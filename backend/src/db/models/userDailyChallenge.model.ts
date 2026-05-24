// src/db/models/userDailyChallenge.model.ts — User daily challenge completion tracking
import mongoose, { Schema, type Document } from 'mongoose';

export interface IUserDailyChallenge extends Document {
  userId: Schema.Types.ObjectId;
  challengeDate: string; // YYYY-MM-DD format
  completedAt: Date;
  xpAwarded: number;
  createdAt: Date;
}

const userDailyChallengeSchema = new Schema<IUserDailyChallenge>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    challengeDate: { type: String, required: true, index: true },
    completedAt: { type: Date, required: true },
    xpAwarded: { type: Number, required: true },
  },
  { timestamps: true }
);

// Compound unique index to ensure one completion per user per challenge date
userDailyChallengeSchema.index({ userId: 1, challengeDate: 1 }, { unique: true });

export const UserDailyChallenge = mongoose.model<IUserDailyChallenge>('UserDailyChallenge', userDailyChallengeSchema);
export default UserDailyChallenge;
