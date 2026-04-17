// src/modules/dashboard/dashboard.service.ts
import { Types } from 'mongoose';
import {
  DsaProblem,
  Project,
  ActivityEvent,
  DailyActivity,
  Mission,
  ConnectedPlatform,
  PlatformStats,
} from '../../db/models/index.js';
import type {
  ApiDashboardResponse,
  ApiDashboardStats,
  ApiStreakData,
  ApiPlatformStats,
  ApiMission,
  ApiDashboardRecentActivity,
} from '../../types/api.types.js';
import { getStartOfDay, formatISODate, getLast365Days, isSameDay } from '../../shared/date.js';

const userId = new Types.ObjectId('000000000000000000000001'); // Demo user

export async function getDashboard(userId: string): Promise<ApiDashboardResponse> {
  const [stats, streak, platformStats, missions, recentActivity] = await Promise.all([
    getDashboardStats(userId),
    getStreakData(userId),
    getPlatformStats(userId),
    getMissions(userId),
    getRecentActivity(userId, 10),
  ]);

  return {
    stats,
    streak,
    platformStats,
    missions,
    recentActivity,
  };
}

export async function getDashboardStats(userId: string): Promise<ApiDashboardStats> {
  const [problemStats, projectStats, activityStats] = await Promise.all([
    DsaProblem.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          totalSubmissions: { $sum: '$submissionCount' },
          currentStreak: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
        },
      },
    ]),
    Project.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalCommits: { $sum: '$totalCommits' },
          totalPullRequests: { $sum: '$totalPullRequests' },
        },
      },
    ]),
    DailyActivity.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalActiveDays: { $sum: { $cond: [{ $gt: ['$count', 0] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const problems = problemStats[0] || { totalProblems: 0, totalSubmissions: 0, currentStreak: 0 };
  const projects = projectStats[0] || { totalProjects: 0, totalCommits: 0, totalPullRequests: 0 };
  const activity = activityStats[0] || { totalActiveDays: 0 };

  // Calculate streak
  const streakData = await calculateStreak(userId);

  return {
    totalProblems: problems.totalProblems,
    totalSubmissions: problems.totalSubmissions,
    totalActiveDays: activity.totalActiveDays,
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    totalProjects: projects.totalProjects,
    totalCommits: projects.totalCommits,
    totalPullRequests: projects.totalPullRequests,
    totalContributions: projects.totalCommits + projects.totalPullRequests,
  };
}

export async function getStreakData(userId: string): Promise<ApiStreakData> {
  const streak = await calculateStreak(userId);
  const history = await getStreakHistory(userId);

  return {
    ...streak,
    streakHistory: history,
  };
}

async function calculateStreak(userId: string): Promise<Omit<ApiStreakData, 'streakHistory'>> {
  const today = getStartOfDay();
  const activities = await DailyActivity.find({
    userId: new Types.ObjectId(userId),
    count: { $gt: 0 },
  }).sort({ date: -1 });

  let currentStreak = 0;
  let longestStreak = 0;
  let streakStartDate = '';
  let lastActiveDate = '';
  let isActiveToday = false;

  if (activities.length > 0) {
    lastActiveDate = formatISODate(activities[0].date);
    isActiveToday = isSameDay(activities[0].date, today);

    // Calculate current streak
    let checkDate = new Date(today);
    if (!isActiveToday) {
      checkDate = new Date(activities[0].date);
    }

    for (const activity of activities) {
      const activityDate = getStartOfDay(activity.date);
      const expectedDate = getStartOfDay(checkDate);

      if (formatISODate(activityDate) === formatISODate(expectedDate)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let tempStreak = 0;
    let prevDate: Date | null = null;
    for (let i = activities.length - 1; i >= 0; i--) {
      const activity = activities[i];
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const dayDiff = Math.abs(activity.date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      prevDate = activity.date;
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    // Find streak start
    if (activities.length > 0) {
      streakStartDate = formatISODate(activities[activities.length - 1].date);
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
    streakStartDate,
    isActiveToday,
  };
}

async function getStreakHistory(userId: string): Promise<ApiStreakData['streakHistory']> {
  const days = getLast365Days();
  const activities = await DailyActivity.find({
    userId: new Types.ObjectId(userId),
    date: { $gte: days[0] },
  });

  const activityMap = new Map(activities.map((a) => [formatISODate(a.date), a.count]));

  return days.map((day) => {
    const count = activityMap.get(formatISODate(day)) || 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 20) level = 4;
    else if (count > 10) level = 3;
    else if (count > 5) level = 2;
    else if (count > 0) level = 1;

    return {
      date: formatISODate(day),
      count,
      level,
    };
  });
}

export async function getPlatformStats(userId: string): Promise<ApiPlatformStats[]> {
  const platforms = await ConnectedPlatform.find({
    userId: new Types.ObjectId(userId),
    isConnected: true,
  });

  const statsPromises = platforms.map(async (platform) => {
    const stats = await PlatformStats.findOne({
      userId: new Types.ObjectId(userId),
      platformName: platform.platformName,
    });

    return {
      platformId: platform.platformName,
      platformName: platform.platformName,
      username: platform.username,
      totalSolved: stats?.totalSolved || 0,
      easySolved: stats?.easySolved || 0,
      mediumSolved: stats?.mediumSolved || 0,
      hardSolved: stats?.hardSolved || 0,
      rating: stats?.rating ?? null,
      rank: stats?.rank ?? null,
      totalContests: stats?.totalContests || 0,
      lastSyncedAt: platform.lastSyncedAt?.toISOString() || new Date().toISOString(),
      profileUrl: platform.profileUrl,
      isConnected: platform.isConnected,
    };
  });

  return Promise.all(statsPromises);
}

export async function getMissions(userId: string): Promise<ApiMission[]> {
  const missions = await Mission.find({
    userId: new Types.ObjectId(userId),
    status: { $in: ['pending', 'in_progress'] },
    expiresAt: { $gt: new Date() },
  }).limit(5);

  return missions.map((mission) => ({
    id: mission._id.toString(),
    title: mission.title,
    description: mission.description,
    type: mission.type,
    status: mission.status,
    targetCount: mission.targetCount,
    currentCount: mission.currentCount,
    xpReward: mission.xpReward,
    category: mission.category,
    createdAt: mission.createdAt.toISOString(),
    expiresAt: mission.expiresAt.toISOString(),
    completedAt: mission.completedAt?.toISOString() || null,
  }));
}

export async function getRecentActivity(userId: string, limit: number): Promise<ApiDashboardRecentActivity[]> {
  const activities = await ActivityEvent.find({
    userId: new Types.ObjectId(userId),
  })
    .sort({ occurredAt: -1 })
    .limit(limit);

  return activities.map((activity) => ({
    id: activity._id.toString(),
    type: activity.type as ApiDashboardRecentActivity['type'],
    title: activity.title,
    description: activity.description,
    platform: activity.platform,
    url: activity.url,
    metadata: activity.metadata || {},
    occurredAt: activity.occurredAt.toISOString(),
  }));
}