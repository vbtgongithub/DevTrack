import mongoose, { Schema, Document } from 'mongoose';

export interface IUserFeedback extends Document {
  userId?: string;
  rating: string; // '👍' | '🙂' | '👎'
  feedback: string;
  page: string;
  createdAt: Date;
}

const userFeedbackSchema = new Schema<IUserFeedback>({
  userId: { type: String, index: true },
  rating: { type: String, required: true },
  feedback: { type: String },
  page: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const UserFeedback = mongoose.model<IUserFeedback>('UserFeedback', userFeedbackSchema);
