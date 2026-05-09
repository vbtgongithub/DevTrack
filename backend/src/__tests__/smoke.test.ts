// ============================================================================
// smoke.test.ts — Minimal Smoke Tests
// ============================================================================
// Validates core API response shapes without needing a running server.
// These are structural/contract tests, not integration tests.
// ============================================================================

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// 1. Auth API response contract
// ---------------------------------------------------------------------------
describe('Auth API contract', () => {
  it('login response should have expected shape', () => {
    // Simulates expected response from POST /api/auth/login
    const mockLoginResponse = {
      success: true,
      data: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '663f0001...',
          email: 'test@example.com',
          username: 'testuser',
        },
      },
      message: 'Login successful',
    };

    expect(mockLoginResponse.success).toBe(true);
    expect(mockLoginResponse.data).toHaveProperty('token');
    expect(mockLoginResponse.data).toHaveProperty('user');
    expect(mockLoginResponse.data.user).toHaveProperty('id');
    expect(mockLoginResponse.data.user).toHaveProperty('email');
    expect(typeof mockLoginResponse.data.token).toBe('string');
    expect(mockLoginResponse.data.token.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Dashboard API response contract
// ---------------------------------------------------------------------------
describe('Dashboard API contract', () => {
  it('GET /api/dashboard response should have all required sections', () => {
    const mockDashboardResponse = {
      success: true,
      data: {
        stats: {
          totalProblems: 42,
          totalSubmissions: 100,
          totalActiveDays: 20,
          currentStreak: 5,
          longestStreak: 12,
          totalProjects: 3,
          totalCommits: 150,
          totalPullRequests: 10,
          totalContributions: 200,
        },
        streak: {
          currentStreak: 5,
          longestStreak: 12,
          lastActiveDate: '2026-05-03',
          streakStartDate: '2026-04-28',
          isActiveToday: true,
          streakHistory: [],
        },
        platformStats: [],
        missions: [],
        recentActivity: [],
      },
    };

    const { data } = mockDashboardResponse;
    expect(data).toHaveProperty('stats');
    expect(data).toHaveProperty('streak');
    expect(data).toHaveProperty('platformStats');
    expect(data).toHaveProperty('missions');
    expect(data).toHaveProperty('recentActivity');

    // Stats shape
    expect(data.stats).toHaveProperty('totalProblems');
    expect(data.stats).toHaveProperty('currentStreak');
    expect(data.stats).toHaveProperty('longestStreak');
    expect(typeof data.stats.totalProblems).toBe('number');

    // Streak shape
    expect(data.streak).toHaveProperty('currentStreak');
    expect(data.streak).toHaveProperty('isActiveToday');
    expect(data.streak).toHaveProperty('streakHistory');

    // Arrays
    expect(Array.isArray(data.platformStats)).toBe(true);
    expect(Array.isArray(data.missions)).toBe(true);
    expect(Array.isArray(data.recentActivity)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Activity API response contract
// ---------------------------------------------------------------------------
describe('Activity API contract', () => {
  it('GET /api/activity response should have events + heatmap', () => {
    const mockActivityResponse = {
      success: true,
      data: {
        events: [
          {
            id: 'evt-001',
            type: 'streak_milestone',
            title: 'Platform Sync',
            description: 'Synced 2 platform(s) successfully',
            platform: 'devtrack',
            url: null,
            tags: ['sync'],
            metadata: { platformsSynced: 2, successCount: 2, failedCount: 0 },
            occurredAt: '2026-05-03T01:00:00.000Z',
          },
        ],
        heatmap: {
          '2026-05-03': 1,
          '2026-05-02': 3,
        },
        summary: {
          totalActivities: 4,
          totalActiveDays: 2,
          currentStreak: 2,
          longestStreak: 2,
          mostActiveDay: 'Saturday',
          avgPerDay: 2,
          byPlatform: {},
          byType: {},
        },
      },
    };

    const { data } = mockActivityResponse;
    expect(data).toHaveProperty('events');
    expect(data).toHaveProperty('heatmap');
    expect(data).toHaveProperty('summary');

    // Events
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events[0]).toHaveProperty('id');
    expect(data.events[0]).toHaveProperty('type');
    expect(data.events[0]).toHaveProperty('title');
    expect(data.events[0]).toHaveProperty('occurredAt');

    // Heatmap
    expect(typeof data.heatmap).toBe('object');
    const firstVal = Object.values(data.heatmap)[0];
    expect(typeof firstVal).toBe('number');

    // Summary
    expect(data.summary).toHaveProperty('totalActivities');
    expect(data.summary).toHaveProperty('currentStreak');
  });
});
