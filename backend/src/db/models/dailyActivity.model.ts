// src/db/models/dailyActivity.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IDailyActivity extends Document {
  userId: Schema.Types.ObjectId;
  date: Date;
  count: number;
  activities: {
    type: string;
    count: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const dailyActivitySchema = new Schema<IDailyActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    activities: {
      type: [
        {
          type: { type: String, required: true },
          count: { type: Number, default: 0 },
        },
      ],
      default: [],
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
dailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });
dailyActivitySchema.index({ userId: 1, date: -1 });

export const DailyActivity = model<IDailyActivity>('DailyActivity', dailyActivitySchema);