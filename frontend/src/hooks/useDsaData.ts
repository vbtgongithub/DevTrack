import { useEffect, useMemo } from 'react';
import type { DsaData, DsaStat, PlatformOverviewItem, Topic, Submission } from '../types/dsa';
import { useProfileStore } from '../store/profileStore';
import { isCacheValid } from '../services/platformApiService';
import type {
  LeetCodeStats,
  CodeforcesStats,
  CodeChefStats,
  ProfileData,
} from '../types/profile.types';
import type {
  LeetCodeCalendar,
  LeetCodeSubmission,
  CodeforcesSubmission,
} from '../services/platformApiService';

// ---------------------------------------------------------------------------
// Builders — map platform stats → DsaData fields
// ---------------------------------------------------------------------------

function buildStats(
  lc: LeetCodeStats | null,
  cf: CodeforcesStats | null,
  cc: CodeChefStats | null,
  cfSubmissions: CodeforcesSubmission[] | null,
): DsaStat[] {
  const lcSolved = lc?.solvedProblem ?? 0;
  const ccSolved = cc?.totalProblemsSolved ?? 0;

  // Count distinct accepted problems from Codeforces submissions
  let cfSolved = 0;
  if (cfSubmissions && cfSubmissions.length > 0) {
    const acceptedProblems = new Set<string>();
    for (const sub of cfSubmissions) {
      if (sub.verdict === 'OK') {
        acceptedProblems.add(`${sub.contestId}-${sub.problem.index}`);
      }
    }
    cfSolved = acceptedProblems.size;
  }

  const totalSolved = lcSolved + ccSolved + cfSolved;

  return [
    { label: 'Problems Solved', value: String(totalSolved || '—'), icon: 'check-circle' },
    {
      label: 'LeetCode Rating',
      value: lc?.contestRating ? String(lc.contestRating) : '—',
      icon: 'chart-bar',
    },
    {
      label: 'CF Rating',
      value: cf?.rating ? String(cf.rating) : '—',
      icon: 'fire',
    },
    {
      label: 'CodeChef Rating',
      value: cc?.currentRating ? String(cc.currentRating) : '—',
      icon: 'trophy',
    },
  ];
}

function buildPlatformOverview(
  profile: ProfileData,
  lc: LeetCodeStats | null,
  cf: CodeforcesStats | null,
  cc: CodeChefStats | null,
): PlatformOverviewItem[] {
  const items: PlatformOverviewItem[] = [];
  if (profile.leetcodeUsername && lc) {
    items.push({ platform: 'leetcode', stat: `Solved ${lc.solvedProblem}` });
  }
  if (profile.codeforcesUsername && cf) {
    items.push({ platform: 'codeforces', stat: `Rating ${cf.rating}` });
  }
  if (profile.codechefUsername && cc) {
    items.push({ platform: 'codechef', stat: `Rating ${cc.currentRating}` });
  }
  return items;
}

function buildTopics(lc: LeetCodeStats | null): Topic[] {
  if (!lc) return [];
  return [
    {
      name: 'Easy',
      progress: lc.totalEasy > 0 ? Math.round((lc.easySolved / lc.totalEasy) * 100) : 0,
    },
    {
      name: 'Medium',
      progress: lc.totalMedium > 0 ? Math.round((lc.mediumSolved / lc.totalMedium) * 100) : 0,
    },
    {
      name: 'Hard',
      progress: lc.totalHard > 0 ? Math.round((lc.hardSolved / lc.totalHard) * 100) : 0,
    },
  ];
}

// ---------------------------------------------------------------------------
// Heatmap builder — merge LeetCode calendar + Codeforces submission timestamps
// ---------------------------------------------------------------------------

function buildHeatmap(
  lcCalendar: LeetCodeCalendar | null,
  cfSubmissions: CodeforcesSubmission[] | null,
): number[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;

  // Build a map of YYYY-MM-DD → count
  const dayCounts = new Map<string, number>();

  // Helper to get YYYY-MM-DD from a Date
  const toDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Merge LeetCode calendar (unix timestamps in seconds → count)
  if (lcCalendar?.submissionCalendar) {
    for (const [tsStr, count] of Object.entries(lcCalendar.submissionCalendar)) {
      const ts = Number(tsStr);
      if (!Number.isFinite(ts) || ts <= 0) continue;
      const date = new Date(ts * 1000);
      const key = toDateKey(date);
      dayCounts.set(key, (dayCounts.get(key) ?? 0) + count);
    }
  }

  // Merge Codeforces submissions (creationTimeSeconds)
  if (cfSubmissions) {
    for (const sub of cfSubmissions) {
      if (sub.creationTimeSeconds <= 0) continue;
      const date = new Date(sub.creationTimeSeconds * 1000);
      const key = toDateKey(date);
      dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    }
  }

  // Build 365-day array ending at today
  const result: number[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today.getTime() - i * dayMs);
    const key = toDateKey(d);
    result.push(dayCounts.get(key) ?? 0);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Submissions builder — merge LeetCode + Codeforces recent submissions
// ---------------------------------------------------------------------------

const LC_LANG_MAP: Record<string, string> = {
  cpp: 'C++', c: 'C', java: 'Java', python: 'Python', python3: 'Python',
  javascript: 'JavaScript', typescript: 'TypeScript', golang: 'Go',
  rust: 'Rust', kotlin: 'Kotlin', swift: 'Swift', csharp: 'C#',
  ruby: 'Ruby', scala: 'Scala', php: 'PHP', dart: 'Dart',
};

function normalizeLcLang(lang: string): string {
  return LC_LANG_MAP[lang.toLowerCase()] ?? lang;
}

function cfDifficulty(rating?: number): 'easy' | 'medium' | 'hard' {
  if (!rating) return 'medium';
  if (rating <= 1200) return 'easy';
  if (rating <= 1800) return 'medium';
  return 'hard';
}

function buildSubmissions(
  lcSubs: LeetCodeSubmission[] | null,
  cfSubs: CodeforcesSubmission[] | null,
): Submission[] {
  const merged: Submission[] = [];

  // LeetCode accepted submissions
  if (lcSubs) {
    for (const s of lcSubs) {
      const ts = Number(s.timestamp) * 1000;
      const d = new Date(ts);
      merged.push({
        id: `lc-${s.id}`,
        status: 'accepted',
        problem: s.title,
        topic: 'LeetCode',
        platform: 'leetcode',
        language: normalizeLcLang(s.lang),
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        difficulty: undefined, // LC submission API doesn't include difficulty
      });
    }
  }

  // Codeforces submissions
  if (cfSubs) {
    for (const s of cfSubs) {
      const d = new Date(s.creationTimeSeconds * 1000);
      merged.push({
        id: `cf-${s.id}`,
        status: s.verdict === 'OK' ? 'accepted' : 'wrong',
        problem: `${s.problem.name}`,
        topic: s.problem.tags[0] ?? 'Codeforces',
        platform: 'codeforces',
        language: s.programmingLanguage,
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        difficulty: cfDifficulty(s.problem.rating),
      });
    }
  }

  // Sort by date descending (newest first)
  merged.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
  });

  // Return top 20
  return merged.slice(0, 20);
}

// ---------------------------------------------------------------------------
// Combined builder
// ---------------------------------------------------------------------------

function buildDsaData(
  profile: ProfileData,
  lc: LeetCodeStats | null,
  cf: CodeforcesStats | null,
  cc: CodeChefStats | null,
  lcCalendar: LeetCodeCalendar | null,
  lcSubs: LeetCodeSubmission[] | null,
  cfSubs: CodeforcesSubmission[] | null,
): DsaData {
  return {
    stats: buildStats(lc, cf, cc, cfSubs),
    heatmap: buildHeatmap(lcCalendar, cfSubs),
    submissions: buildSubmissions(lcSubs, cfSubs),
    contests: [],
    topics: buildTopics(lc),
    platformOverview: buildPlatformOverview(profile, lc, cf, cc),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDsaData(): {
  data: DsaData | null;
  loading: boolean;
  error: unknown;
} {
  const profile = useProfileStore((s) => s.profile);
  const leetcode = useProfileStore((s) => s.leetcode);
  const codeforces = useProfileStore((s) => s.codeforces);
  const codechef = useProfileStore((s) => s.codechef);
  const leetcodeCalendar = useProfileStore((s) => s.leetcodeCalendar);
  const leetcodeSubmissions = useProfileStore((s) => s.leetcodeSubmissions);
  const codeforcesSubmissions = useProfileStore((s) => s.codeforcesSubmissions);

  const loadFromStorage = useProfileStore((s) => s.loadFromStorage);
  const fetchLeetCode = useProfileStore((s) => s.fetchLeetCode);
  const fetchCodeforces = useProfileStore((s) => s.fetchCodeforces);
  const fetchCodeChef = useProfileStore((s) => s.fetchCodeChef);
  const fetchLeetCodeCalendarData = useProfileStore((s) => s.fetchLeetCodeCalendarData);
  const fetchLeetCodeSubmissionsData = useProfileStore((s) => s.fetchLeetCodeSubmissionsData);
  const fetchCodeforcesSubmissionsData = useProfileStore((s) => s.fetchCodeforcesSubmissionsData);

  // Load saved profile + cached stats from localStorage once on mount
  useEffect(() => {
    loadFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fetch stats whenever a username is present and cache is stale
  useEffect(() => {
    if (profile.leetcodeUsername && !isCacheValid(leetcode.lastFetchedAt) && !leetcode.loading) {
      fetchLeetCode();
    }
    if (profile.codeforcesUsername && !isCacheValid(codeforces.lastFetchedAt) && !codeforces.loading) {
      fetchCodeforces();
    }
    if (profile.codechefUsername && !isCacheValid(codechef.lastFetchedAt) && !codechef.loading) {
      fetchCodeChef();
    }
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    profile.leetcodeUsername,
    profile.codeforcesUsername,
    profile.codechefUsername,
  ]);

  // Auto-fetch extended data (calendar, submissions) when usernames are set
  useEffect(() => {
    if (profile.leetcodeUsername && !isCacheValid(leetcodeCalendar.lastFetchedAt) && !leetcodeCalendar.loading) {
      fetchLeetCodeCalendarData();
    }
    if (profile.leetcodeUsername && !isCacheValid(leetcodeSubmissions.lastFetchedAt) && !leetcodeSubmissions.loading) {
      fetchLeetCodeSubmissionsData();
    }
    if (profile.codeforcesUsername && !isCacheValid(codeforcesSubmissions.lastFetchedAt) && !codeforcesSubmissions.loading) {
      fetchCodeforcesSubmissionsData();
    }
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    profile.leetcodeUsername,
    profile.codeforcesUsername,
  ]);

  const loading =
    leetcode.loading || codeforces.loading || codechef.loading ||
    leetcodeCalendar.loading || leetcodeSubmissions.loading || codeforcesSubmissions.loading;

  const hasAnyUsername = !!(
    profile.leetcodeUsername ||
    profile.codeforcesUsername ||
    profile.codechefUsername
  );

  const data = useMemo<DsaData | null>(() => {
    if (!hasAnyUsername) return null;
    return buildDsaData(
      profile,
      leetcode.data,
      codeforces.data,
      codechef.data,
      leetcodeCalendar.data,
      leetcodeSubmissions.data,
      codeforcesSubmissions.data,
    );
  }, [
    hasAnyUsername,
    profile,
    leetcode.data,
    codeforces.data,
    codechef.data,
    leetcodeCalendar.data,
    leetcodeSubmissions.data,
    codeforcesSubmissions.data,
  ]);

  return { data, loading, error: null };
}
