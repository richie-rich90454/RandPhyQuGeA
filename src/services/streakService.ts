/**
 * Streak tracking service.
 *
 * Computes streak data (current streak, best streak, total active days)
 * from a list of practice results, using calendar-day granularity.
 */

import type { PracticeResult } from '../types/models';

/** Aggregated streak metrics derived from practice results. */
export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  totalActiveDays: number;
}

function toDateKey(timestamp: string): string {
  // Returns YYYY-MM-DD
  return new Date(timestamp).toISOString().split('T')[0];
}

function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function computeStreak(results: PracticeResult[]): StreakData {
  if (results.length === 0) {
    return { currentStreak: 0, bestStreak: 0, totalActiveDays: 0 };
  }

  // Get unique active days sorted
  const activeDays = new Set(results.map(r => toDateKey(r.timestamp)));
  const sortedDays = Array.from(activeDays).sort();

  const totalActiveDays = sortedDays.length;

  // Compute best streak
  let bestStreak = 1;
  let currentRun = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = getDaysDifference(sortedDays[i], sortedDays[i - 1]);
    if (diff === 1) {
      currentRun++;
      bestStreak = Math.max(bestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // Compute current streak
  const today = toDateKey(new Date().toISOString());
  const yesterday = toDateKey(new Date(Date.now() - 86400000).toISOString());

  let currentStreak = 0;
  const lastDay = sortedDays[sortedDays.length - 1];

  if (lastDay === today || lastDay === yesterday) {
    currentStreak = 1;
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const diff = getDaysDifference(sortedDays[i + 1], sortedDays[i]);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, bestStreak, totalActiveDays };
}
