export type SubmissionStatus = 'accepted' | 'wrong';
export type Platform = 'leetcode' | 'codeforces' | 'codechef' | 'hackerrank';

export type Submission = {
  id: string;
  status: SubmissionStatus;
  problem: string;
  topic: string;
  platform: Platform;
  language: string;
  date: string;
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type Topic = {
  name: string;
  progress: number;
};

export type Contest = {
  name: string;
  platform: string;
  time: string;
};

export type DsaStat = {
  label: string;
  value: string;
  icon: string;
};

export type PlatformOverviewItem = {
  platform: Platform;
  stat: string;
};

export type DsaData = {
  stats: DsaStat[];
  heatmap: number[];
  submissions: Submission[];
  contests: Contest[];
  topics: Topic[];
  platformOverview: PlatformOverviewItem[];
};
