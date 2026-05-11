// src/config/platforms.ts - DSA Platform configuration (only LeetCode + Codeforces)

export type DsaPlatform = 'leetcode' | 'codeforces';

export const DSA_PLATFORMS: Readonly<Record<DsaPlatform, PlatformConfig>> = {
  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    displayName: 'LeetCode',
    baseUrl: 'https://leetcode.com',
    graphQLUrl: 'https://leetcode.com/graphql',
    profileUrl: (username: string) => `https://leetcode.com/u/${username}`,
    problemUrl: (slug: string) => `https://leetcode.com/problems/${slug}`,
    color: '#ffa116',
    icon: 'leetcode',
  },
  codeforces: {
    id: 'codeforces',
    name: 'Codeforces',
    displayName: 'Codeforces',
    baseUrl: 'https://codeforces.com',
    apiUrl: 'https://codeforces.com/api',
    profileUrl: (username: string) => `https://codeforces.com/profile/${username}`,
    problemUrl: (contestId: number, index: string) =>
      `https://codeforces.com/problemset/problem/${contestId}/${index}`,
    color: '#1a8cd8',
    icon: 'codeforces',
  },
} as const;

export interface PlatformConfig {
  id: DsaPlatform;
  name: string;
  displayName: string;
  baseUrl: string;
  profileUrl: (username: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  problemUrl: (...args: any[]) => string;
  color: string;
  icon: string;
  graphQLUrl?: string;
  apiUrl?: string;
}

// Platform-specific display helpers
export function getPlatformDisplayName(platform: DsaPlatform): string {
  return DSA_PLATFORMS[platform].displayName;
}

export function getPlatformColor(platform: DsaPlatform): string {
  return DSA_PLATFORMS[platform].color;
}

export function getPlatformIcon(platform: DsaPlatform): string {
  return DSA_PLATFORMS[platform].icon;
}

export function isValidDsaPlatform(value: string): value is DsaPlatform {
  return value === 'leetcode' || value === 'codeforces';
}

// Difficulty normalization
export function normalizeDifficulty(
  difficulty: string | number
): 'easy' | 'medium' | 'hard' {
  const d = String(difficulty).toLowerCase();

  if (d === 'easy' || d === 'easy') return 'easy';
  if (d === 'medium' || d === 'medium') return 'medium';
  if (d === 'hard' || d === 'hard') return 'hard';

  // Codeforces rating-based difficulty
  if (typeof difficulty === 'number') {
    if (difficulty < 1200) return 'easy';
    if (difficulty <= 1900) return 'medium';
    return 'hard';
  }

  return 'medium'; // Default
}

// Language normalization
export function normalizeLanguage(lang: string): string {
  const normalized = lang.toLowerCase().trim();

  const languageMap: Record<string, string> = {
    'c++': 'C++',
    'cpp': 'C++',
    'c++17': 'C++',
    'c++20': 'C++',
    'python': 'Python',
    'python3': 'Python',
    'py': 'Python',
    'java': 'Java',
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'go': 'Go',
    'golang': 'Go',
    'rust': 'Rust',
    'rs': 'Rust',
    'c': 'C',
    'csharp': 'C#',
    'c#': 'C#',
  };

  return languageMap[normalized] ?? lang;
}

// Topic tag normalization
export function normalizeTopicTag(tag: string): string {
  const tagMap: Record<string, string> = {
    dp: 'Dynamic Programming',
    'dynamic-programming': 'Dynamic Programming',
    graphs: 'Graphs',
    graph: 'Graphs',
    greedy: 'Greedy',
    'two-pointers': 'Two Pointers',
    'binary-search': 'Binary Search',
    'sorting': 'Sorting',
    'sliding-window': 'Sliding Window',
    'hash-table': 'Hash Table',
    'string': 'String',
    'math': 'Math',
    'recursion': 'Recursion',
    'backtracking': 'Backtracking',
    'stack': 'Stack',
    'queue': 'Queue',
    'heap': 'Heap',
    'tree': 'Tree',
    'trie': 'Trie',
    'bit-manipulation': 'Bit Manipulation',
    'array': 'Array',
    'matrix': 'Matrix',
    'linked-list': 'Linked List',
    'implementation': 'Implementation',
    'geometry': 'Geometry',
    'number-theory': 'Number Theory',
  };

  const normalized = tag.toLowerCase().trim();
  return tagMap[normalized] ?? tag;
}