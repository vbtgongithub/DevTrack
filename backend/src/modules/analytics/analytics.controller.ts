import { Request, Response } from 'express';
import { AnalyticsEvent } from '../../db/models/analyticsEvent.model';
import { UserFeedback } from '../../db/models/userFeedback.model';

export const trackEvent = async (req: Request, res: Response) => {
  try {
    const { eventName, properties } = req.body;
    // req.user might be undefined if not strictly authenticated, so we allow optional userId
    const userId = (req as any).user?.id || properties?.userId;
    
    await AnalyticsEvent.create({
      userId,
      eventName,
      properties
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to track event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { rating, feedback, page } = req.body;
    const userId = (req as any).user?.id;

    await UserFeedback.create({
      userId,
      rating,
      feedback,
      page
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    // Basic aggregation for Beta Dashboard
    const [
      resumesUploaded,
      discoveryCompleted,
      roadmapsGenerated,
      resourceClicks,
      skillsCompleted,
      feedbackList
    ] = await Promise.all([
      AnalyticsEvent.countDocuments({ eventName: 'resume_upload_completed' }),
      AnalyticsEvent.countDocuments({ eventName: 'career_discovery_completed' }),
      AnalyticsEvent.countDocuments({ eventName: 'roadmap_generated' }),
      AnalyticsEvent.countDocuments({ eventName: 'resource_clicked' }),
      AnalyticsEvent.countDocuments({ eventName: 'skill_marked_complete' }),
      UserFeedback.find().sort({ createdAt: -1 }).limit(50).lean()
    ]);

    // Unique users completing at least one skill
    const uniqueCompleters = await AnalyticsEvent.distinct('userId', { eventName: 'skill_marked_complete' });

    res.json({
      success: true,
      data: {
        funnel: {
          resumesUploaded,
          discoveryCompleted,
          roadmapsGenerated,
          resourceClicks,
          skillsCompleted
        },
        metrics: {
          activationRate: resumesUploaded > 0 ? (roadmapsGenerated / resumesUploaded) * 100 : 0,
          learningEngagement: roadmapsGenerated > 0 ? (resourceClicks / roadmapsGenerated) * 100 : 0,
          completionRate: roadmapsGenerated > 0 ? (uniqueCompleters.length / roadmapsGenerated) * 100 : 0
        },
        feedback: feedbackList
      }
    });
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};
