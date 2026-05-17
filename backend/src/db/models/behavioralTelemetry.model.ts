// src/db/models/behavioralTelemetry.model.ts — Behavioral Telemetry for Phase-I Validation
// Tracks user behavior patterns, hesitation points, abandonment, and friction

import mongoose, { Schema, type Document } from 'mongoose';

export interface IBehavioralTelemetry extends Document {
  userId: Schema.Types.ObjectId;
  sessionId: string;

  // Session tracking
  sessionStart: Date;
  sessionEnd?: Date;
  sessionDuration?: number;
  pageViews: number;
  activeTime: number;

  // Hesitation detection
  hesitationPoints: Array<{
    element: string;
    timestamp: Date;
    hesitationDuration: number;
    context: string;
  }>;

  // Abandonment tracking
  abandonmentEvents: Array<{
    action: string;
    step: string;
    timestamp: Date;
    reason?: string;
    context: Record<string, unknown>;
  }>;

  // Interaction friction
  frictionEvents: Array<{
    element: string;
    type: 'confusion' | 'error' | 'slow_response' | 'repeated_action';
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
    context: Record<string, unknown>;
  }>;

  // Feature interactions
  featureInteractions: Array<{
    featureName: string;
    firstSeen: Date;
    lastUsed: Date;
    usageCount: number;
    timeSpent: number;
    completionRate: number;
  }>;

  // Onboarding tracking
  onboardingProgress: {
    currentStep: string;
    completedSteps: string[];
    startTime: Date;
    completedAt?: Date;
    dropOffStep?: string;
  };

  // Workspace engagement
  workspaceEngagement: {
    problemsAttempted: number;
    problemsSolved: number;
    averageTimePerProblem: number;
    focusInterruptions: number;
    keyboardWorkflowUsage: number;
  };

  // Notification interactions
  notificationInteractions: Array<{
    notificationType: string;
    timestamp: Date;
    action: 'clicked' | 'dismissed' | 'ignored';
    timeToAction?: number;
  }>;

  // Emotional signals
  emotionalSignals: Array<{
    timestamp: Date;
    signal: 'frustration' | 'satisfaction' | 'confusion' | 'engagement' | 'fatigue';
    intensity: number;
    context: string;
  }>;

  // Metadata
  deviceInfo?: {
    userAgent: string;
    screenResolution?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
  };
  networkInfo?: {
    connectionType?: string;
    effectiveType?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const behavioralTelemetrySchema = new Schema<IBehavioralTelemetry>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    sessionId: { type: String, required: true, index: true },

    // Session tracking
    sessionStart: { type: Date, required: true },
    sessionEnd: { type: Date },
    sessionDuration: { type: Number },
    pageViews: { type: Number, default: 0 },
    activeTime: { type: Number, default: 0 },

    // Hesitation detection
    hesitationPoints: {
      type: [
        {
          element: { type: String, required: true },
          timestamp: { type: Date, required: true },
          hesitationDuration: { type: Number, required: true },
          context: { type: String, required: true },
        },
      ],
      default: [],
    },

    // Abandonment tracking
    abandonmentEvents: {
      type: [
        {
          action: { type: String, required: true },
          step: { type: String, required: true },
          timestamp: { type: Date, required: true },
          reason: { type: String },
          context: { type: Object, default: {} },
        },
      ],
      default: [],
    },

    // Interaction friction
    frictionEvents: {
      type: [
        {
          element: { type: String, required: true },
          type: { type: String, enum: ['confusion', 'error', 'slow_response', 'repeated_action'], required: true },
          timestamp: { type: Date, required: true },
          severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
          context: { type: Object, default: {} },
        },
      ],
      default: [],
    },

    // Feature interactions
    featureInteractions: {
      type: [
        {
          featureName: { type: String, required: true },
          firstSeen: { type: Date, required: true },
          lastUsed: { type: Date, required: true },
          usageCount: { type: Number, default: 0 },
          timeSpent: { type: Number, default: 0 },
          completionRate: { type: Number, default: 0 },
        },
      ],
      default: [],
    },

    // Onboarding tracking
    onboardingProgress: {
      currentStep: { type: String, default: '' },
      completedSteps: { type: [String], default: [] },
      startTime: { type: Date },
      completedAt: { type: Date },
      dropOffStep: { type: String },
    },

    // Workspace engagement
    workspaceEngagement: {
      problemsAttempted: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      averageTimePerProblem: { type: Number, default: 0 },
      focusInterruptions: { type: Number, default: 0 },
      keyboardWorkflowUsage: { type: Number, default: 0 },
    },

    // Notification interactions
    notificationInteractions: {
      type: [
        {
          notificationType: { type: String, required: true },
          timestamp: { type: Date, required: true },
          action: { type: String, enum: ['clicked', 'dismissed', 'ignored'], required: true },
          timeToAction: { type: Number },
        },
      ],
      default: [],
    },

    // Emotional signals
    emotionalSignals: {
      type: [
        {
          timestamp: { type: Date, required: true },
          signal: { type: String, enum: ['frustration', 'satisfaction', 'confusion', 'engagement', 'fatigue'], required: true },
          intensity: { type: Number, required: true, min: 0, max: 1 },
          context: { type: String, required: true },
        },
      ],
      default: [],
    },

    // Metadata
    deviceInfo: {
      userAgent: { type: String },
      screenResolution: { type: String },
      deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'] },
    },
    networkInfo: {
      connectionType: { type: String },
      effectiveType: { type: String },
    },
  },
  { timestamps: true }
);

// Query indexes for efficient analytics
behavioralTelemetrySchema.index({ userId: 1, sessionStart: -1 });
behavioralTelemetrySchema.index({ sessionStart: -1 });
behavioralTelemetrySchema.index({ 'onboardingProgress.dropOffStep': 1 });
behavioralTelemetrySchema.index({ 'frictionEvents.severity': 1 });
behavioralTelemetrySchema.index({ 'featureInteractions.featureName': 1 });
behavioralTelemetrySchema.index({ 'emotionalSignals.signal': 1 });

// TTL index for old telemetry data (90 days)
behavioralTelemetrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const BehavioralTelemetry = mongoose.model<IBehavioralTelemetry>('BehavioralTelemetry', behavioralTelemetrySchema);
