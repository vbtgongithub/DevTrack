// src/db/models/project.model.ts
import { Schema, model, type Document } from 'mongoose';

export interface IProjectContributor {
  id: string;
  username: string;
  avatarUrl: string;
  contributions: number;
}

export interface IProjectMilestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: Date | null;
  completedAt: Date | null;
  taskCount: number;
  completedTaskCount: number;
}

export interface IProject extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  description: string;
  repoUrl: string | null;
  liveUrl: string | null;
  techStack: string[];
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'archived';
  visibility: 'public' | 'private';
  thumbnailUrl: string | null;
  stars: number;
  forks: number;
  language: string;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  openIssues: number;
  lastCommitAt: Date | null;
  lastCommitMessage: string | null;
  contributors: IProjectContributor[];
  milestones: IProjectMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

const projectContributorSchema = new Schema<IProjectContributor>(
  {
    id: { type: String, required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, required: true },
    contributions: { type: Number, default: 0 },
  },
  { _id: false }
);

const projectMilestoneSchema = new Schema<IProjectMilestone>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    taskCount: { type: Number, default: 0 },
    completedTaskCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    repoUrl: {
      type: String,
      default: null,
    },
    liveUrl: {
      type: String,
      default: null,
    },
    techStack: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['planning', 'in_progress', 'completed', 'on_hold', 'archived'],
      default: 'planning',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
      index: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    stars: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: '',
      index: true,
    },
    totalCommits: {
      type: Number,
      default: 0,
    },
    totalPullRequests: {
      type: Number,
      default: 0,
    },
    totalIssues: {
      type: Number,
      default: 0,
    },
    openIssues: {
      type: Number,
      default: 0,
    },
    lastCommitAt: {
      type: Date,
      default: null,
    },
    lastCommitMessage: {
      type: String,
      default: null,
    },
    contributors: {
      type: [projectContributorSchema],
      default: [],
    },
    milestones: {
      type: [projectMilestoneSchema],
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
projectSchema.index({ userId: 1, updatedAt: -1 });
projectSchema.index({ userId: 1, status: 1, visibility: 1, language: 1 });

export const Project = model<IProject>('Project', projectSchema);