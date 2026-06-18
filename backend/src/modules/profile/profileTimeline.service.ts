import mongoose from 'mongoose';
import { ProfileTimelineEvent, IProfileTimelineEvent } from '../../db/models/profileTimelineEvent.model.js';
import { enqueueProfileRebuild } from '../../shared/jobs/profileRebuildWorker.js';

export class ProfileTimelineService {
  /**
   * Securely emit a new verified timeline event.
   */
  static async emitEvent(
    userId: string | mongoose.Types.ObjectId,
    eventType: IProfileTimelineEvent['eventType'],
    title: string,
    description: string,
    metadata: Record<string, any> = {},
    visibility: IProfileTimelineEvent['visibility'] = 'public'
  ): Promise<void> {
    
    // Check for duplicates for unique milestone events (idempotency)
    const uniqueEvents = ['first_hard_solve', 'github_verified', 'streak_30'];
    if (uniqueEvents.includes(eventType)) {
      const existing = await ProfileTimelineEvent.findOne({ userId, eventType });
      if (existing) return; // Ignore duplicate
    }

    await ProfileTimelineEvent.create({
      userId,
      eventType,
      title,
      description,
      metadata,
      eventDate: new Date(),
      isVerified: true,
      visibility
    });

    // Enqueue a snapshot rebuild so the timeline is reflected in the DTO payload
    await enqueueProfileRebuild(userId.toString(), `timeline_event_${eventType}`);
  }

  /**
   * Fetch paginated public timeline events for a user
   */
  static async getPublicTimeline(
    userId: string | mongoose.Types.ObjectId,
    viewerType: 'public' | 'recruiter' | 'authenticated',
    limit: number = 20,
    skip: number = 0
  ) {
    const visibilityQuery = viewerType === 'public' 
      ? { visibility: 'public' } 
      : { visibility: { $in: ['public', 'recruiter_only'] } };

    return ProfileTimelineEvent.find({
      userId,
      isVerified: true,
      ...visibilityQuery
    })
    .sort({ eventDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  }
}
