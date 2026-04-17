// src/shared/date.ts - Date utilities

export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

export function getStartOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfYear(year: number): Date {
  return new Date(year, 0, 1, 0, 0, 0, 0);
}

export function getEndOfYear(year: number): Date {
  return new Date(year, 11, 31, 23, 59, 59, 999);
}

export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDateRangeForYear(year: number): { start: Date; end: Date } {
  return {
    start: getStartOfYear(year),
    end: getEndOfYear(year),
  };
}

export function getDaysDifference(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(date1.getTime() - date2.getTime()) / oneDay);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatISODate(date1) === formatISODate(date2);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function getLast365Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    days.push(subtractDays(today, i));
  }

  return days;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

export function calculateStreaks(activeDates: Date[]): StreakData {
  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates in ascending order
  const sortedDates = activeDates.map((d) => getStartOfDay(new Date(d))).sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate longest streak
  for (let i = 1; i < sortedDates.length; i++) {
    const dayDiff = getDaysDifference(sortedDates[i], sortedDates[i - 1]);
    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak
  const today = getStartOfDay();
  const yesterday = subtractDays(today, 1);
  let currentStreak = 0;

  // Check if active today or yesterday
  const lastActive = sortedDates[sortedDates.length - 1];
  if (isSameDay(lastActive, today) || isSameDay(lastActive, yesterday)) {
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const expectedDate = subtractDays(sortedDates[i + 1], 1);
      if (isSameDay(sortedDates[i], expectedDate)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}