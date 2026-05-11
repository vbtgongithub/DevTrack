import { describe, it, expect } from 'vitest';
import { parseLeetCodeCalendar, calculateStreaksFromHeatmap } from './dsa.service.js';

describe('DSA Rolling Logic', () => {
  describe('parseLeetCodeCalendar', () => {
    it('should correctly parse a valid LeetCode calendar object', () => {
      const rawData = {
        submissionCalendar: {
          "2024-05-10": 5,
          "2024-05-11": 2,
          "2024-05-12": 0,
        }
      };
      const result = parseLeetCodeCalendar(rawData);
      expect(result["2024-05-10"]).toBe(5);
      expect(result["2024-05-11"]).toBe(2);
      expect(result["2024-05-12"]).toBeUndefined(); // Should skip 0
    });

    it('should parse the legacy LeetCode submissionCalendar JSON string', () => {
      // LeetCode returns a JSON string keyed by unix timestamp (seconds)
      const legacy = {
        matchedUser: {
          submissionCalendar: JSON.stringify({
            // 2024-05-10T00:00:00.000Z
            [String(Date.UTC(2024, 4, 10) / 1000)]: 3,
            // 2024-05-11T00:00:00.000Z
            [String(Date.UTC(2024, 4, 11) / 1000)]: 1,
            // 0-counts should be ignored
            [String(Date.UTC(2024, 4, 12) / 1000)]: 0,
          }),
        },
      };

      const result = parseLeetCodeCalendar(legacy as any);
      expect(result['2024-05-10']).toBe(3);
      expect(result['2024-05-11']).toBe(1);
      expect(result['2024-05-12']).toBeUndefined();
    });

    it('should parse unix-second-keyed submissionCalendar objects', () => {
      const ts = String(Date.UTC(2024, 4, 10) / 1000);
      const rawData = {
        submissionCalendar: {
          [ts]: 4,
        },
      };

      const result = parseLeetCodeCalendar(rawData as any);
      expect(result['2024-05-10']).toBe(4);
    });

    it('should return empty object for invalid calendar', () => {
      expect(parseLeetCodeCalendar({})).toEqual({});
      expect(parseLeetCodeCalendar({ submissionCalendar: "invalid" } as any)).toEqual({});
      expect(parseLeetCodeCalendar({ submissionCalendar: [] } as any)).toEqual({});
    });
  });

  describe('calculateStreaksFromHeatmap', () => {
    it('should calculate current and longest streaks correctly', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const heatmap = [
        { date: '2024-01-01', count: 1 },
        { date: '2024-01-02', count: 1 },
        { date: '2024-01-03', count: 0 },
        { date: '2024-01-04', count: 1 },
        { date: '2024-01-05', count: 1 },
        { date: '2024-01-06', count: 1 },
        { date: '2024-01-07', count: 0 },
        // Current streak part
        { date: yesterdayStr, count: 2 },
        { date: today, count: 1 },
      ];

      const streaks = calculateStreaksFromHeatmap(heatmap);
      expect(streaks.longest).toBe(3); // Jan 4, 5, 6
      expect(streaks.current).toBe(2); // Yesterday + Today
    });

    it('should handle zero streaks', () => {
      const heatmap = [
        { date: '2024-01-01', count: 0 },
        { date: '2024-01-02', count: 0 },
      ];
      const streaks = calculateStreaksFromHeatmap(heatmap);
      expect(streaks.longest).toBe(0);
      expect(streaks.current).toBe(0);
    });

    it('should maintain current streak if active yesterday but not today (yet)', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const heatmap = [
        { date: yesterdayStr, count: 1 },
        { date: today, count: 0 },
      ];
      const streaks = calculateStreaksFromHeatmap(heatmap);
      expect(streaks.current).toBe(1);
    });
  });
});
