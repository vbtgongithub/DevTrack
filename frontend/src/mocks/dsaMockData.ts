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
    { name: 'LeetCode Weekly 447', platform: 'LeetCode', time: 'In 2 hrs' },
    { name: 'Codeforces Round 1013', platform: 'Codeforces', time: 'Tomorrow' },
    { name: 'CodeChef Starters 181', platform: 'CodeChef', time: 'In 4 days' },
  ],
  platformOverview: [
    { platform: 'leetcode', stat: 'Solved 182' },
    { platform: 'codeforces', stat: 'Rating 1426' },
    { platform: 'codechef', stat: 'Solved 41' },
  ],
  heatmap: generateHeatmap(),
};
