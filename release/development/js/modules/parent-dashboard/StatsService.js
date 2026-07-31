/**
 * StatsService — derives display statistics from an ActivityTracker stats
 * object. Pure functions; the UI renders whatever it returns.
 */
import { dayKey } from './util.js';

const WEEKDAY_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default class StatsService {
  /** Overall completion vs a known total number of pages. */
  static completionPercent(stats, totalPages) {
    if (!totalPages) return 0;
    return Math.min(100, Math.round((stats.completedCount / totalPages) * 100));
  }

  /** Top packs by activity. @returns [{ packId, count }] */
  static favoriteCategories(stats, n = 4) {
    return Object.entries(stats.categories || {})
      .sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([packId, count]) => ({ packId, count }));
  }

  /** Top colors by usage. @returns [{ hex, count }] */
  static favoriteColors(stats, n = 6) {
    return Object.entries(stats.colors || {})
      .sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([hex, count]) => ({ hex, count }));
  }

  /** Activity for the last `days` days (oldest→newest), zero-filled. */
  static activityByDay(stats, days = 7) {
    const out = [];
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    for (let i = 0; i < days; i++) {
      const key = dayKey(d);
      const rec = stats.daily?.[key];
      out.push({ key, label: WEEKDAY_AR[d.getDay()], count: rec?.count || 0, timeMs: rec?.timeMs || 0 });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  static totals(stats) {
    return {
      drawings: stats.counters.drawings || 0,
      prints: stats.counters.prints || 0,
      exports: stats.counters.exports || 0,
      completed: stats.completedCount,
      started: stats.startedCount,
      favorites: stats.favoritesCount,
      packsCompleted: stats.packsCompletedCount,
      timeMinutes: Math.round((stats.counters.timeMs || 0) / 60000),
      activeStreak: stats.activeStreak,
    };
  }
}
