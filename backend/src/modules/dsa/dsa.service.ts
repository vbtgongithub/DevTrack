// src/modules/dsa/dsa.service.ts
import { Types } from 'mongoose';
import { DsaProblem, DsaTopicProgress, DsaSubmission, DailyActivity } from '../../db/models/index.js';
import type {
  ApiDsaListResponse,
  ApiDsaProblem,
  ApiDsaStats,
  ApiDsaFilters,
  ApiDsaProblemCreatePayload,
  ApiDsaProblemUpdatePayload,
  ApiPagination,
  ApiDsaWeeklyProgress,
} from '../../types/api.types.js';
import { parsePaginationParams, createPagination, getSkipCount, buildSortOptions } from '../../shared/pagination.js';

const ALLOWED_SORT_FIELDS = ['title', 'difficulty', 'lastSubmittedAt', 'solvedAt', 'timeTaken'];

export async function getProblems(userId: string, filters: ApiDsaFilters): Promise<ApiDsaListResponse> {
  const { page, pageSize } = parsePaginationParams({
    page: filters.page?.toString(),
    pageSize: filters.pageSize?.toString(),
  });

  // Build query
  const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.platform) query.platform = filters.platform;
  if (filters.isFavorite !== undefined) query.isFavorite = filters.isFavorite;
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { tags: { $in: [new RegExp(filters.search, 'i')] } },
    ];
  }

  // Execute query
  const skip = getSkipCount({ page, pageSize });
  const sort = buildSortOptions(filters.sortBy, filters.sortOrder, ALLOWED_SORT_FIELDS);

  const [problems, totalCount] = await Promise.all([
    DsaProblem.find(query).sort(sort).skip(skip).limit(pageSize).lean(),
    DsaProblem.countDocuments(query),
  ]);

  // Get stats
  const stats = await getStats(userId);

  const pagination: ApiPagination = createPagination(totalCount, { page, pageSize });

  return {
    problems: problems.map(mapProblemToApi),
    pagination,
    stats,
  };
}

export async function getProblemById(userId: string, problemId: string): Promise<ApiDsaProblem | null> {
  const problem = await DsaProblem.findOne({
    _id: new Types.ObjectId(problemId),
    userId: new Types.ObjectId(userId),
  }).lean();

  return problem ? mapProblemToApi(problem) : null;
}

export async function createProblem(userId: string, payload: ApiDsaProblemCreatePayload): Promise<ApiDsaProblem> {
  const problem = await DsaProblem.create({
    userId: new Types.ObjectId(userId),
    ...payload,
    status: 'unsolved',
    submissionCount: 0,
    isFavorite: false,
  });

  // Update topic progress
  await updateTopicProgress(userId, payload.category, payload.difficulty);

  return mapProblemToApi(problem.toObject() as unknown as Record<string, unknown> & { _id: { toString(): string } });
}

export async function updateProblem(
  userId: string,
  problemId: string,
  payload: ApiDsaProblemUpdatePayload
): Promise<ApiDsaProblem | null> {
  const update: Record<string, unknown> = { ...payload };

  // If status changed to solved, set solvedAt
  if (payload.status === 'solved') {
    update.solvedAt = new Date();
    update.lastSubmittedAt = new Date();
    update.submissionCount = { $inc: 1 };
  } else if (payload.status) {
    update.lastSubmittedAt = new Date();
    update.submissionCount = { $inc: 1 };
  }

  const problem = await DsaProblem.findOneAndUpdate(
    { _id: new Types.ObjectId(problemId), userId: new Types.ObjectId(userId) },
    update,
    { new: true }
  ).lean();

  return problem ? mapProblemToApi(problem) : null;
}

export async function deleteProblem(userId: string, problemId: string): Promise<boolean> {
  const result = await DsaProblem.deleteOne({
    _id: new Types.ObjectId(problemId),
    userId: new Types.ObjectId(userId),
  });
  return result.deletedCount > 0;
}

export async function toggleFavorite(userId: string, problemId: string): Promise<ApiDsaProblem | null> {
  const problem = await DsaProblem.findOne({
    _id: new Types.ObjectId(problemId),
    userId: new Types.ObjectId(userId),
  });

  if (!problem) return null;

  problem.isFavorite = !problem.isFavorite;
  await problem.save();

  return mapProblemToApi(problem.toObject() as unknown as Record<string, unknown> & { _id: { toString(): string } });
}

export async function bulkUpdateStatus(
  userId: string,
  problemIds: string[],
  status: ApiDsaProblem['status']
): Promise<number> {
  const update: Record<string, unknown> = { status };

  if (status === 'solved') {
    update.solvedAt = new Date();
  }

  const result = await DsaProblem.updateMany(
    {
      _id: { $in: problemIds.map((id) => new Types.ObjectId(id)) },
      userId: new Types.ObjectId(userId),
    },
    update
  );

  return result.modifiedCount;
}

export async function getStats(userId: string): Promise<ApiDsaStats> {
  const [problemStats, topics] = await Promise.all([
    DsaProblem.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          totalSolved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
          totalAttempted: { $sum: { $cond: [{ $eq: ['$status', 'attempted'] }, 1, 0] } },
          totalUnsolved: { $sum: { $cond: [{ $eq: ['$status', 'unsolved'] }, 1, 0] } },
          totalRevisit: { $sum: { $cond: [{ $eq: ['$status', 'revisit'] }, 1, 0] } },
          easySolved: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'solved'] }, { $eq: ['$difficulty', 'easy'] }] }, 1, 0] } },
          easyTotal: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
          mediumSolved: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'solved'] }, { $eq: ['$difficulty', 'medium'] }] }, 1, 0] } },
          mediumTotal: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
          hardSolved: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'solved'] }, { $eq: ['$difficulty', 'hard'] }] }, 1, 0] } },
          hardTotal: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
          avgTime: { $avg: '$timeTaken' },
          fastestSolve: { $min: '$timeTaken' },
        },
      },
    ]),
    DsaTopicProgress.find({ userId: new Types.ObjectId(userId) }).lean(),
  ]);

  const stats = problemStats[0] || {
    totalProblems: 0, totalSolved: 0, totalAttempted: 0, totalUnsolved: 0, totalRevisit: 0,
    easySolved: 0, easyTotal: 0, mediumSolved: 0, mediumTotal: 0, hardSolved: 0, hardTotal: 0,
    avgTime: 0, fastestSolve: 0,
  };

  return {
    totalProblems: stats.totalProblems,
    totalSolved: stats.totalSolved,
    totalAttempted: stats.totalAttempted,
    totalUnsolved: stats.totalUnsolved,
    totalRevisit: stats.totalRevisit,
    easySolved: stats.easySolved,
    easyTotal: stats.easyTotal,
    mediumSolved: stats.mediumSolved,
    mediumTotal: stats.mediumTotal,
    hardSolved: stats.hardSolved,
    hardTotal: stats.hardTotal,
    averageTime: Math.round(stats.avgTime) || 0,
    fastestSolve: stats.fastestSolve || 0,
    categories: topics.map((t) => ({
      name: t.topicName,
      slug: t.topicName.toLowerCase().replace(/\s+/g, '-'),
      totalProblems: t.totalProblems,
      solvedCount: t.solvedCount,
      easyCount: t.easyCount,
      easySolved: t.easySolved,
      mediumCount: t.mediumCount,
      mediumSolved: t.mediumSolved,
      hardCount: t.hardCount,
      hardSolved: t.hardSolved,
    })),
    weeklyProgress: await getWeeklyProgress(userId),
  };
}

async function getWeeklyProgress(userId: string): Promise<ApiDsaWeeklyProgress[]> {
  const now = new Date();
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks = 84 days

  // Get daily activities for the last 12 weeks
  const activities = await DailyActivity.find({
    userId: new Types.ObjectId(userId),
    date: { $gte: twelveWeeksAgo, $lte: now },
    count: { $gt: 0 },
  }).sort({ date: 1 });

  // Group activities by week
  const weeklyMap = new Map<string, { easy: number; medium: number; hard: number; total: number }>();

  for (const activity of activities) {
    const date = new Date(activity.date);
    const weekStart = getStartOfWeek(date);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, { easy: 0, medium: 0, hard: 0, total: 0 });
    }

    const week = weeklyMap.get(weekKey)!;

    // Count by problem difficulty from activity types
    for (const act of activity.activities) {
      if (act.type.startsWith('dsa_solved_')) {
        const difficulty = act.type.replace('dsa_solved_', '') as 'easy' | 'medium' | 'hard';
        if (difficulty === 'easy') week.easy += act.count;
        else if (difficulty === 'medium') week.medium += act.count;
        else if (difficulty === 'hard') week.hard += act.count;
        week.total += act.count;
      } else if (act.type === 'dsa_solved') {
        week.total += act.count;
      }
    }
  }

  // Convert to array and sort by week
  const weeks: ApiDsaWeeklyProgress[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    const weekKey = weekStart.toISOString().split('T')[0];
    const weekData = weeklyMap.get(weekKey) || { easy: 0, medium: 0, hard: 0, total: 0 };

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    weeks.push({
      weekStart: weekKey,
      weekEnd: weekEnd.toISOString().split('T')[0],
      easySolved: weekData.easy,
      mediumSolved: weekData.medium,
      hardSolved: weekData.hard,
      totalSolved: weekData.total,
    });
  }

  return weeks;
}

function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay()); // Sunday as week start
  return result;
}

async function updateTopicProgress(userId: string, topicName: string, difficulty: string): Promise<void> {
  const incrementField = `${difficulty}Count` as const;

  await DsaTopicProgress.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), topicName },
    {
      $inc: { totalProblems: 1, [incrementField]: 1 },
      $setOnInsert: { topicName },
    },
    { upsert: true, new: true }
  );
}

function mapProblemToApi(problem: Record<string, unknown> & { _id: { toString(): string } }): ApiDsaProblem {
  return {
    id: (problem._id as Types.ObjectId).toString(),
    externalId: (problem.externalId as string) || '',
    title: problem.title as string,
    platform: problem.platform as ApiDsaProblem['platform'],
    difficulty: problem.difficulty as ApiDsaProblem['difficulty'],
    url: problem.url as string,
    tags: (problem.tags as string[]) || [],
    category: problem.category as string,
    status: problem.status as ApiDsaProblem['status'],
    notes: (problem.notes as string) || null,
    timeTaken: (problem.timeTaken as number) || null,
    submissionCount: (problem.submissionCount as number) || 0,
    lastSubmittedAt: problem.lastSubmittedAt ? (problem.lastSubmittedAt as Date).toISOString() : null,
    solvedAt: problem.solvedAt ? (problem.solvedAt as Date).toISOString() : null,
    isFavorite: (problem.isFavorite as boolean) || false,
    createdAt: (problem.createdAt as Date).toISOString(),
    updatedAt: (problem.updatedAt as Date).toISOString(),
  };
}