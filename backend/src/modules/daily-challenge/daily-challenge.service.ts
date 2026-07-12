// src/modules/daily-challenge/daily-challenge.service.ts
import { Types } from 'mongoose';
import { DailyChallenge, DsaProblem, DsaSubmission, XpTransaction, UserAnalytics } from '../../db/models/index.js';
import { processXpEvent } from '../xp/processor.js';
import { eventBus } from '../../shared/sse/index.js';
import { logger } from '../../shared/logger.js';

// ---------------------------------------------------------------------------
// Expanded Challenge Pool — organized by difficulty
// ---------------------------------------------------------------------------

interface ChallengeTemplate {
  title: string;
  titleSlug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  platform: 'leetcode' | 'codeforces' | 'codechef';
  problemUrl: string;
  xpReward: number;
  completionCount: number;
}

const CHALLENGE_POOL: Record<'easy' | 'medium' | 'hard', ChallengeTemplate[]> = {
  easy: [
    { title: 'Two Sum', titleSlug: 'two-sum', description: 'Find two numbers that add up to a specific target.', difficulty: 'easy', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/two-sum', xpReward: 30, completionCount: 320 },
    { title: 'Valid Parentheses', titleSlug: 'valid-parentheses', description: 'Determine if the input string has valid brackets.', difficulty: 'easy', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/valid-parentheses', xpReward: 30, completionCount: 245 },
    { title: 'Watermelon', titleSlug: '4-a', description: 'Divide the watermelon into two even parts.', difficulty: 'easy', platform: 'codeforces', problemUrl: 'https://codeforces.com/problemset/problem/4/A', xpReward: 30, completionCount: 512 },
    { title: 'Best Time to Buy and Sell Stock', titleSlug: 'best-time-to-buy-and-sell-stock', description: 'Find the maximum profit from a single stock transaction.', difficulty: 'easy', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock', xpReward: 30, completionCount: 410 },
    { title: 'Merge Two Sorted Lists', titleSlug: 'merge-two-sorted-lists', description: 'Merge two sorted linked lists into one.', difficulty: 'easy', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/merge-two-sorted-lists', xpReward: 30, completionCount: 380 },
    { title: 'Climbing Stairs', titleSlug: 'climbing-stairs', description: 'Count distinct ways to climb n stairs taking 1 or 2 steps.', difficulty: 'easy', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/climbing-stairs', xpReward: 30, completionCount: 356 },
    { title: 'Maximum Subarray', titleSlug: 'maximum-subarray', description: 'Find the contiguous subarray with the largest sum.', difficulty: 'easy', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/maximum-subarray', xpReward: 30, completionCount: 290 },
    { title: 'Palindrome Number', titleSlug: 'palindrome-number', description: 'Determine whether an integer is a palindrome.', difficulty: 'easy', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/palindrome-number', xpReward: 30, completionCount: 445 },
  ],
  medium: [
    { title: 'Longest Substring Without Repeating Characters', titleSlug: 'longest-substring-without-repeating-characters', description: 'Find the length of the longest substring without repeating characters.', difficulty: 'medium', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters', xpReward: 50, completionCount: 188 },
    { title: 'Container With Most Water', titleSlug: 'container-with-most-water', description: 'Find two lines that together form a container holding the most water.', difficulty: 'medium', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/container-with-most-water', xpReward: 50, completionCount: 195 },
    { title: '3Sum', titleSlug: '3sum', description: 'Find all unique triplets that sum to zero.', difficulty: 'medium', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/3sum', xpReward: 50, completionCount: 165 },
    { title: 'Group Anagrams', titleSlug: 'group-anagrams', description: 'Group strings that are anagrams of each other.', difficulty: 'medium', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/group-anagrams', xpReward: 50, completionCount: 210 },
    { title: 'Coin Change', titleSlug: 'coin-change', description: 'Find the minimum number of coins to make a given amount.', difficulty: 'medium', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/coin-change', xpReward: 50, completionCount: 178 },
    { title: 'Binary Tree Level Order', titleSlug: 'binary-tree-level-order-traversal', description: 'Return the level order traversal of a binary tree.', difficulty: 'medium', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal', xpReward: 50, completionCount: 202 },
    { title: 'Product of Array Except Self', titleSlug: 'product-of-array-except-self', description: 'Return array where each element is the product of all other elements.', difficulty: 'medium', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/product-of-array-except-self', xpReward: 50, completionCount: 225 },
    { title: 'Word Search', titleSlug: 'word-search', description: 'Determine if a word exists in a 2D grid of characters.', difficulty: 'medium', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/word-search', xpReward: 50, completionCount: 145 },
  ],
  hard: [
    { title: 'Trapping Rain Water', titleSlug: 'trapping-rain-water', description: 'Compute how much water is trapped after raining.', difficulty: 'hard', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/trapping-rain-water', xpReward: 80, completionCount: 85 },
    { title: 'Merge k Sorted Lists', titleSlug: 'merge-k-sorted-lists', description: 'Merge k sorted linked lists into one sorted list.', difficulty: 'hard', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/merge-k-sorted-lists', xpReward: 80, completionCount: 92 },
    { title: 'Minimum Window Substring', titleSlug: 'minimum-window-substring', description: 'Find the minimum window containing all characters of another string.', difficulty: 'hard', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/minimum-window-substring', xpReward: 80, completionCount: 72 },
    { title: 'Median of Two Sorted Arrays', titleSlug: 'median-of-two-sorted-arrays', description: 'Find the median of two sorted arrays in O(log(m+n)).', difficulty: 'hard', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays', xpReward: 80, completionCount: 65 },
    { title: 'Serialize and Deserialize Binary Tree', titleSlug: 'serialize-and-deserialize-binary-tree', description: 'Design an algorithm to serialize and deserialize a binary tree.', difficulty: 'hard', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree', xpReward: 80, completionCount: 78 },
    { title: 'Word Ladder', titleSlug: 'word-ladder', description: 'Find the shortest transformation sequence from one word to another.', difficulty: 'hard', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/word-ladder', xpReward: 80, completionCount: 88 },
    { title: 'Longest Increasing Path in a Matrix', titleSlug: 'longest-increasing-path-in-a-matrix', description: 'Find the longest increasing path in a matrix.', difficulty: 'hard', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix', xpReward: 80, completionCount: 70 },
    { title: 'Regular Expression Matching', titleSlug: 'regular-expression-matching', description: 'Implement regular expression matching with . and *.', difficulty: 'hard', platform: 'leetcode', problemUrl: 'https://leetcode.com/problems/regular-expression-matching', xpReward: 80, completionCount: 55 },
  ],
};

// Legacy flat list for backward compatibility
const DEFAULT_CHALLENGES = [
  ...CHALLENGE_POOL.easy.slice(0, 3),
  ...CHALLENGE_POOL.medium.slice(0, 2),
];

// ---------------------------------------------------------------------------
// Adaptive Difficulty Selection
// ---------------------------------------------------------------------------

async function selectAdaptiveDifficulty(userId: string): Promise<'easy' | 'medium' | 'hard'> {
  try {
    const analytics = await UserAnalytics.findOne({ userId: new Types.ObjectId(userId) }).lean();
    const currentStreak = analytics?.currentStreak ?? 0;

    // Weekend/weekday balancing — easier on weekends
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      return currentStreak >= 14 ? 'medium' : 'easy';
    }

    // Streak-sensitive difficulty
    if (currentStreak >= 30) return 'hard';
    if (currentStreak >= 14) return 'medium';
    if (currentStreak >= 7) {
      // Mix: 60% medium, 40% easy based on date hash
      const dateHash = hashDateString(getTodayDateString());
      return dateHash % 5 < 3 ? 'medium' : 'easy';
    }
    if (currentStreak >= 3) {
      // Mix: 70% easy, 30% medium
      const dateHash = hashDateString(getTodayDateString());
      return dateHash % 10 < 3 ? 'medium' : 'easy';
    }
    return 'easy'; // New or low-streak users get easy
  } catch (err) {
    logger.debug('[daily-challenge] Difficulty calculation failed, defaulting to easy', { userId, error: err instanceof Error ? err.message : String(err) });
    return 'easy';
  }
}

async function fetchLeetcodeDailyChallenge(): Promise<{
  title: string;
  titleSlug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  problemUrl: string;
  xpReward: number;
  completionCount: number;
} | null> {
  const query = `
    query questionOfToday {
      activeDailyCodingChallengeQuestion {
        date
        link
        question {
          title
          titleSlug
          difficulty
        }
      }
    }
  `;

  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      logger.error(`[daily-challenge] LeetCode GraphQL fetch failed: ${res.status}`);
      return null;
    }

    const response = await res.json() as any;
    const challengeData = response?.data?.activeDailyCodingChallengeQuestion;
    if (!challengeData || !challengeData.question) return null;

    const q = challengeData.question;
    const difficultyLower = q.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';

    let xpReward = 30;
    if (difficultyLower === 'medium') {
      xpReward = 50;
    } else if (difficultyLower === 'hard') {
      xpReward = 80;
    }

    return {
      title: q.title,
      titleSlug: q.titleSlug,
      description: `Solve today's official LeetCode daily challenge: ${q.title}.`,
      difficulty: difficultyLower,
      problemUrl: `https://leetcode.com${challengeData.link}`,
      xpReward,
      completionCount: 0, // This will be updated by the background job
    };
  } catch (err) {
    logger.error('[daily-challenge] Error fetching LeetCode daily challenge', err);
    return null;
  }
}

function getChallengeForDate(dateStr: string, difficulty?: 'easy' | 'medium' | 'hard') {
  const pool = difficulty ? CHALLENGE_POOL[difficulty] : DEFAULT_CHALLENGES;
  const hash = hashDateString(dateStr);
  const index = hash % pool.length;
  const selected = pool[index];
  
  // Apply streak-based XP multiplier
  return { ...selected };
}

function hashDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getTodayChallenge(userId: string) {
  const dateStr = getTodayDateString();
  let challenge = await DailyChallenge.findOne({ date: dateStr });

  // If a challenge exists but was created from the static fallback templates,
  // try to upgrade it dynamically to today's official LeetCode challenge.
  if (challenge && !challenge.description.includes("official LeetCode daily challenge")) {
    try {
      const leetcodeChallenge = await fetchLeetcodeDailyChallenge();
      if (leetcodeChallenge) {
        const updated = await DailyChallenge.findOneAndUpdate(
          { date: dateStr },
          {
            $set: {
              title: leetcodeChallenge.title,
              titleSlug: leetcodeChallenge.titleSlug,
              description: leetcodeChallenge.description,
              difficulty: leetcodeChallenge.difficulty,
              platform: 'leetcode',
              problemUrl: leetcodeChallenge.problemUrl,
              xpReward: leetcodeChallenge.xpReward,
              completionCount: leetcodeChallenge.completionCount,
            }
          },
          { new: true }
        );
        if (updated) {
          challenge = updated;
          logger.info('[daily-challenge] Upgraded static challenge to dynamic LeetCode daily challenge', {
            date: dateStr,
            title: leetcodeChallenge.title,
          });
        }
      }
    } catch (lcErr) {
      logger.error('[daily-challenge] Failed to upg