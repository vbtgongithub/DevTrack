import type { DsaData } from '../types/dsa';

// Generate 365 days of realistic heatmap data
const generateHeatmap = (): number[] => {
  const data: number[] = [];
  for (let i = 0; i < 365; i++) {
    const r = Math.random();
    if (r < 0.3) data.push(0);
    else if (r < 0.55) data.push(1);
    else if (r < 0.75) data.push(2);
    else if (r < 0.9) data.push(3);
    else data.push(4 + Math.floor(Math.random() * 2));
  }
  return data;
};

export const mockData: DsaData = {
  stats: [
    { label: 'Problems Solved', value: '247', icon: 'check-circle' },
    { label: 'Current Rating', value: '1684', icon: 'chart-bar' },
    { label: 'Current Streak', value: '12 days', icon: 'fire' },
    { label: 'Max Streak', value: '31 days', icon: 'trophy' },
  ],
  submissions: [
    {
      id: 's1',
      status: 'accepted',
      problem: 'Two Sum',
      topic: 'Arrays',
      platform: 'leetcode',
      language: 'TypeScript',
      date: 'Apr 05, 2026',
      difficulty: 'easy',
    },
    {
      id: 's2',
      status: 'wrong',
      problem: 'Longest Increasing Subsequence',
      topic: 'DP',
      platform: 'leetcode',
      language: 'Python',
      date: 'Apr 05, 2026',
      difficulty: 'medium',
    },
    {
      id: 's3',
      status: 'accepted',
      problem: 'Dijkstra Shortest Path',
      topic: 'Graphs',
      platform: 'codeforces',
      language: 'C++',
      date: 'Apr 04, 2026',
      difficulty: 'hard',
    },
    {
      id: 's4',
      status: 'accepted',
      problem: 'Binary Tree Zigzag Level Order',
      topic: 'Trees',
      platform: 'leetcode',
      language: 'Java',
      date: 'Apr 04, 2026',
      difficulty: 'medium',
    },
    {
      id: 's5',
      status: 'wrong',
      problem: 'Minimum Window Substring',
      topic: 'Arrays',
      platform: 'codechef',
      language: 'Python',
      date: 'Apr 03, 2026',
      difficulty: 'hard',
    },
    {
      id: 's6',
      status: 'accepted',
      problem: 'Coin Change II',
      topic: 'DP',
      platform: 'leetcode',
      language: 'TypeScript',
      date: 'Apr 03, 2026',
      difficulty: 'medium',
    },
  ],
  topics: [
    { name: 'Arrays', progress: 82 },
    { name: 'DP', progress: 64 },
    { name: 'Graphs', progress: 39 },
    { name: 'Trees', progress: 73 },
  ],
  contests: [
    { id: 'c1', contestName: 'LeetCode Weekly 447', platform: 'leetcode', rank: 312, totalParticipants: 18500, problemsSolved: 3, ratingChange: 42, participatedAt: '2026-04-05T10:00:00Z' },
    { id: 'c2', contestName: 'Codeforces Round 1013', platform: 'codeforces', rank: 1200, totalParticipants: 25000, problemsSolved: 2, ratingChange: -15, participatedAt: '2026-04-03T18:00:00Z' },
    { id: 'c3', contestName: 'CodeChef Starters 181', platform: 'codechef', rank: 450, totalParticipants: 8000, problemsSolved: 4, ratingChange: 28, participatedAt: '2026-03-30T14:00:00Z' },
  ],
  platformOverview: [
    { platform: 'leetcode', stat: 'Solved 182' },
    { platform: 'codeforces', stat: 'Rating 1426' },
    { platform: 'codechef', stat: 'Solved 41' },
  ],
  heatmap: generateHeatmap(),
};
