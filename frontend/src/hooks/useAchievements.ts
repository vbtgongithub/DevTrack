// ============================================================================
// useAchievements.ts — Achievement State Hook
// ============================================================================
// Fetches unlocked and available achievements from GET /api/profile/achievements.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import axiosClient from '../utils/axiosClient';
import { queryKeys } from '../lib/queryClient';

export interface Achievement {
  id: string;
  achievementTemplateId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  xpReward: number;
}

export interface AchievementTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  xpReward: number;
  isHidden?: boolean;
}

export interface AchievementsResponse {
  unlocked: Achievement[];
  available: AchievementTemplate[];
}

async function fetchAchievements(): Promise<AchievementsResponse> {
  const { data } = await axiosClient.get('/profile/achievements');
  if (!data.success) throw new Error(data.error || 'Failed to load achievements');
  return data.data;
}

export function useAchievements() {
  return useQuery<AchievementsResponse>({
    queryKey: queryKeys.achievements.all,
    queryFn: fetchAchievements,
    staleTime: 60_000, // 1 minute
  });
}
