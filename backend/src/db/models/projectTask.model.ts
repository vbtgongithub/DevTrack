// src/db/models/projectTask.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IProjectTask extends Document {
  projectId: Schema.Types.ObjectId;
  milestoneId: string | null;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId: string | null;
  labels: string[];
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectTaskSchema = new Schema<IProjectTask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    milestoneId: {
      type: String,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    assigneeId: {
      type: String,
      default: null,
    },
    labels: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
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
projectTaskSchema.index({ projectId: 1, status: 1, priority: 1, dueDate: 1 });
projectTaskSchema.index({ projectId: 1, milestoneId: 1 });

export const ProjectTask = model<IProjectTask>('ProjectTask', projectTaskSchema);