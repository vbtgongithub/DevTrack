import { DSAProfile, IDSAProfile } from '../../../../db/models/dsaProfile.model.js';
import { Platform, TopicBreakdown } from '../types/dsa.types';

export interface IDSARepository {
  findByUserId(userId: string, platform?: Platform): Promise<any[]>;
  findByUserIdAndPlatform(userId: string, platform: Platform): Promise<any | null>;
  create(data: Partial<IDSAProfile>): Promise<IDSAProfile>;
  update(userId: string, platform: Platform, data: Partial<IDSAProfile>): Promise<any | null>;
  delete(userId: string, platform: Platform): Promise<boolean>;
  aggregateByUserId(userId: string): Promise<AggregatedDSAData>;
}

export interface AggregatedDSAData {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  currentStreak: number;
  longestStreak: number;
  lastSolvedDate: Date | null;
  topicBreakdown: TopicBreakdown;
  isVerified: boolean;
  lastSyncedAt: Date | null;
  platforms: Platform[];
}

export class DSARepository implements IDSARepository {
  async findByUserId(userId: string, platform?: Platform): Promise<any[]> {
    const query: any = { userId };
    if (platform) {
      query.platform = platform;
    }
    return await DSAProfile.find(query).lean() as any[];
  }

  async findByUserIdAndPlatform(userId: string, platform: Platform): Promise<any | null> {
    return await DSAProfile.findOne({ userId, platform }).lean() as any;
  }

  async create(data: Partial<IDSAProfile>): Promise<IDSAProfile> {
    const profile = new DSAProfile(data);
    return await profile.save();
  }

  async update(userId: string, platform: Platform, data: Partial<IDSAProfile>): Promise<any | null> {
    return await DSAProfile.findOneAndUpdate(
      { userId, platform },
      { $set: data },
      { new: true, upsert: false }
    ).lean() as any;
  }

  async delete(userId: string, platform: Platform): Promise<boolean> {
    const result = await DSAProfile.deleteOne({ userId, platform });
    return result.deletedCount > 0;
  }

  async aggregateByUserId(userId: string): Promise<AggregatedDSAData> {
    const profiles = await DSAProfile.find({ userId }).lean() as any[];

    if (profiles.length === 0) {
      return {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastSolvedDate: null,
        topicBreakdown: {
          arrays: 0,
          hashing: 0,
          strings: 0,
          linkedList: 0,
          stack: 0,
          queue: 0,
          trees: 0,
          graphs: 0,
          heaps: 0,
          recursion: 0,
          backtracking: 0,
          dp: 0,
          greedy: 0,
          binarySearch: 0,
        },
        isVerified: false,
        lastSyncedAt: null,
        platforms: [],
      };
    }

    // Aggregate across all platforms
    const aggregated: AggregatedDSAData = {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastSolvedDate: null,
      topicBreakdown: {
        arrays: 0,
        hashing: 0,
        strings: 0,
        linkedList: 0,
        stack: 0,
        queue: 0,
        trees: 0,
        graphs: 0,
        heaps: 0,
        recursion: 0,
        backtracking: 0,
        dp: 0,
        greedy: 0,
        binarySearch: 0,
      },
      isVerified: false,
      lastSyncedAt: null,
      platforms: [],
    };

    profiles.forEach((profile) => {
      aggregated.totalSolved += profile.totalSolved;
      aggregated.easySolved += profile.easySolved;
      aggregated.mediumSolved += profile.mediumSolved;
      aggregated.hardSolved += profile.hardSolved;
      aggregated.currentStreak = Math.max(aggregated.currentStreak, profile.currentStreak);
      aggregated.longestStreak = Math.max(aggregated.longestStreak, profile.longestStreak);
      
      if (profile.lastSolvedDate) {
        if (!aggregated.lastSolvedDate || profile.lastSolvedDate > aggregated.lastSolvedDate) {
          aggregated.lastSolvedDate = profile.lastSolvedDate;
        }
      }

      if (profile.lastSyncedAt) {
        if (!aggregated.lastSyncedAt || profile.lastSyncedAt > aggregated.lastSyncedAt) {
          aggregated.lastSyncedAt = profile.lastSyncedAt;
        }
      }

      aggregated.isVerified = aggregated.isVerified || profile.isVerified;
      aggregated.platforms.push(profile.platform);

      // Aggregate topic breakdown
      Object.entries(profile.topicBreakdown).forEach(([topic, count]) => {
        const topicKey = topic as keyof TopicBreakdown;
        if (topicKey in aggregated.topicBreakdown) {
          aggregated.topicBreakdown[topicKey] += (count as number);
        }
      });
    });

    return aggregated;
  }
}

export const dsaRepository = new DSARepository();
