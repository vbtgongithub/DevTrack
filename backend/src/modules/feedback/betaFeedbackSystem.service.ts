// src/modules/feedback/betaFeedbackSystem.service.ts — Beta Feedback System Service
// Phase-K: Beta Feedback System - Lightweight feedback UX, contextual feedback prompts, qualitative + quantitative feedback, operator review workflows

import mongoose from 'mongoose';
import { logger } from '../../shared/logger.js';

export interface BetaFeedback {
  feedbackId: string;
  userId: mongoose.Types.ObjectId;
  feedbackType: 'onboarding' | 'workspace' | 'progression' | 'challenge' | 'notification' | 'emotional_trust' | 'focus_preservation' | 'overall';
  context: string;
  quantitativeRating: number; // 1-5
  qualitativeFeedback: string;
  timestamp: Date;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface FeedbackSummary {
  totalFeedback: number;
  averageRating: number;
  feedbackByType: Record<string, { count: number; averageRating: number }>;
  commonThemes: Array<{ theme: string; count: number }>;
  pendingReview: number;
  recommendations: string[];
}

export const betaFeedbackSystem = {
  // ─── Submit Feedback ───────────────────────────────────────────────────────
  async submitFeedback(
    userId: mongoose.Types.ObjectId,
    feedbackType: BetaFeedback['feedbackType'],
    context: string,
    quantitativeRating: number,
    qualitativeFeedback: string
  ): Promise<BetaFeedback> {
    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const feedback: BetaFeedback = {
      feedbackId,
      userId,
      feedbackType,
      context,
      quantitativeRating,
      qualitativeFeedback,
      timestamp: new Date(),
      reviewed: false,
    };

    // In a real implementation, this would be saved to a database
    logger.info('[beta-feedback] Feedback submitted', { feedbackId, userId, feedbackType, rating: quantitativeRating });

    return feedback;
  },

  // ─── Get Feedback Summary ───────────────────────────────────────────────────
  async getFeedbackSummary(dateRange: { start: Date; end: Date }): Promise<FeedbackSummary> {
    // In a real implementation, this would aggregate feedback from the database
    return {
      totalFeedback: 150,
      averageRating: 4.2,
      feedbackByType: {
        onboarding: { count: 30, averageRating: 3.8 },
        workspace: { count: 45, averageRating: 4.3 },
        progression: { count: 25, averageRating: 4.1 },
        challenge: { count: 20, averageRating: 4.5 },
        notification: { count: 15, averageRating: 3.5 },
        emotional_trust: { count: 10, averageRating: 4.4 },
        focus_preservation: { count: 5, averageRating: 4.6 },
      },
      commonThemes: [
        { theme: 'onboarding_confusion', count: 12 },
        { theme: 'notification_frequency', count: 10 },
        { theme: 'workspace_clarity', count: 8 },
        { theme: 'progression_pressure', count: 6 },
      ],
      pendingReview: 25,
      recommendations: [
        'Address onboarding confusion - simplify step 3',
        'Review notification frequency - reduce by 20%',
        'Improve workspace clarity - reduce UI density',
      ],
    };
  },

  // ─── Get Contextual Feedback Prompts ───────────────────────────────────────────
  async getContextualFeedbackPrompts(context: string): Promise<Array<{
    prompt: string;
    type: 'rating' | 'text' | 'both';
    priority: 'high' | 'medium' | 'low';
  }>> {
    const prompts: Array<{ prompt: string; type: 'rating' | 'text' | 'both'; priority: 'high' | 'medium' | 'low' }> = [];

    switch (context) {
      case 'onboarding_completion':
        prompts.push({
          prompt: 'How clear was the onboarding process?',
          type: 'rating',
          priority: 'high',
        });
        break;
      case 'first_problem_solved':
        prompts.push({
          prompt: 'How was your first problem experience?',
          type: 'both',
          priority: 'high',
        });
        break;
      case 'streak_activation':
        prompts.push({
          prompt: 'How do you feel about the streak system?',
          type: 'both',
          priority: 'medium',
        });
        break;
      case 'notification_received':
        prompts.push({
          prompt: 'Was this notification helpful?',
          type: 'rating',
          priority: 'low',
        });
        break;
      default:
        prompts.push({
          prompt: 'How is your experience so far?',
          type: 'both',
          priority: 'medium',
        });
    }

    return prompts;
  },

  // ─── Review Feedback ───────────────────────────────────────────────────────
  async reviewFeedback(feedbackId: string, reviewer: string): Promise<void> {
    // In a real implementation, this would update the feedback in the database
    logger.info('[beta-feedback] Feedback reviewed', { feedbackId, reviewer });
  },

  // ─── Get Pending Feedback for Review ───────────────────────────────────────────
  async getPendingFeedbackForReview(): Promise<BetaFeedback[]> {
    // In a real implementation, this would query the database for unreviewed feedback
    return [];
  },

  // ─── Analyze Feedback Themes ───────────────────────────────────────────────
  async analyzeFeedbackThemes(dateRange: { start: Date; end: Date }): Promise<{
    positiveThemes: Array<{ theme: string; count: number }>;
    negativeThemes: Array<{ theme: string; count: number }>;
    neutralThemes: Array<{ theme: string; count: number }>;
    recommendations: string[];
  }> {
    // In a real implementation, this would use NLP to analyze feedback
    return {
      positiveThemes: [
        { theme: 'clean_ui', count: 25 },
        { theme: 'helpful_progression', count: 20 },
        { theme: 'good_challenges', count: 18 },
      ],
      negativeThemes: [
        { theme: 'onboarding_confusion', count: 12 },
        { theme: 'too_many_notifications', count: 10 },
        { theme: 'streak_pressure', count: 8 },
      ],
      neutralThemes: [
        { theme: 'neutral_experience', count: 15 },
        { theme: 'no_opinion', count: 10 },
      ],
      recommendations: [
        'Simplify onboarding to reduce confusion',
        'Reduce notification frequency',
        'Soften streak pressure messaging',
      ],
    };
  },
};

export default betaFeedbackSystem;
