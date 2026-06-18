import { IPublicProfile } from '../../db/models/publicProfile.model.js';
import { IProfileTimelineEvent } from '../../db/models/profileTimelineEvent.model.js';

export interface PublicProfileDTO {
  username: string;
  visibility: string;
  isIndexable: boolean;
  
  identity: {
    displayName: string;
    avatarUrl: string | null;
    joinedAt: Date;
    timezone: string;
    levelName: string;
  };

  consistency?: {
    currentStreak: number;
    longestStreak: number;
    activeDaysLast90: number;
    recruiterSignal?: string | null;
  };

  dsa: {
    totalSolved: number;
    difficultyRatio: number;
    platformBreakdown: {
      platform: string;
      solved: number;
    }[];
    recruiterSignal?: string | null;
  };

  github?: {
    isVerified: boolean;
    verifiedProjectCount: number;
    totalContributions: number;
    recruiterSignal?: string | null;
  };

  projects: any[];
  achievements: any[];
  
  seo: {
    ogTitle: string;
    ogDescription: string;
    canonicalUrl: string;
  };
}

export function mapToPublicProfileDTO(profile: IPublicProfile, hideStreaks: boolean, hideGithub: boolean): PublicProfileDTO {
  const snapshot = profile.snapshot;
  
  return {
    username: profile.username,
    visibility: profile.visibility,
    isIndexable: profile.isIndexable,

    identity: {
      displayName: snapshot.identity.displayName,
      avatarUrl: snapshot.identity.avatarUrl,
      joinedAt: snapshot.identity.joinedAt,
      timezone: snapshot.identity.timezone,
      levelName: snapshot.identity.levelName,
    },

    consistency: hideStreaks ? undefined : {
      currentStreak: snapshot.consistency.currentStreak,
      longestStreak: snapshot.consistency.longestStreak,
      activeDaysLast90: snapshot.consistency.activeDaysLast90,
      recruiterSignal: (snapshot.consistency as any).recruiterSignal,
    },

    dsa: {
      totalSolved: snapshot.dsa.totalSolved,
      difficultyRatio: snapshot.dsa.difficultyRatio,
      platformBreakdown: snapshot.dsa.platformBreakdown.map(p => ({
        platform: p.platform,
        solved: p.solved,
      })),
      recruiterSignal: (snapshot.dsa as any).recruiterSignal,
    },

    github: hideGithub ? undefined : {
      isVerified: snapshot.github.isVerified,
      verifiedProjectCount: snapshot.github.verifiedProjectCount,
      totalContributions: snapshot.github.totalContributions,
      recruiterSignal: (snapshot.github as any).recruiterSignal,
    },

    projects: snapshot.projects,
    achievements: snapshot.achievements,

    seo: profile.seo,
  };
}

export interface PublicTimelineDTO {
  id: string;
  eventType: string;
  title: string;
  description: string;
  eventDate: Date;
}

export function mapToPublicTimelineDTO(events: IProfileTimelineEvent[]): PublicTimelineDTO[] {
  return events.map(e => ({
    id: e._id.toString(),
    eventType: e.eventType,
    title: e.title,
    description: e.description,
    eventDate: e.eventDate,
  }));
}
