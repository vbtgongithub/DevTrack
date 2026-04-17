// src/db/models/userSettings.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: Schema.Types.ObjectId;
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
    streakReminder: boolean;
    missionAlerts: boolean;
    projectUpdates: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    compactMode: boolean;
    showHeatmap: boolean;
    heatmapColor: string;
    language: string;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends_only';
    showActivity: boolean;
    showStreak: boolean;
    showProjects: boolean;
    showDsaProgress: boolean;
  };
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      streakReminder: { type: Boolean, default: true },
      missionAlerts: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true },
    },
    appearance: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      accentColor: { type: String, default: '#3b82f6' },
      compactMode: { type: Boolean, default: false },
      showHeatmap: { type: Boolean, default: true },
      heatmapColor: { type: String, default: 'green' },
      language: { type: String, default: 'en' },
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'private', 'friends_only'], default: 'public' },
      showActivity: { type: Boolean, default: true },
      showStreak: { type: Boolean, default: true },
      showProjects: { type: Boolean, default: true },
      showDsaProgress: { type: Boolean, default: true },
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
userSettingsSchema.index({ userId: 1 }, { unique: true });

export const UserSettings = model<IUserSettings>('UserSettings', userSettingsSchema);