/**
 * Rewards — data-driven badges earned from local progress. Fully offline.
 * Each badge has a predicate over the aggregate stats; newly-earned badges are
 * surfaced on the completion screen. Earned ids persist locally.
 */
const BADGES = [
  { id: 'first',    icon: '🌟', title: 'أول نشاط',        test: (s) => s.completed >= 1 },
  { id: 'five',     icon: '🏅', title: 'خمسة أنشطة',      test: (s) => s.completed >= 5 },
  { id: 'ten',      icon: '🏆', title: 'عشرة أنشطة',      test: (s) => s.completed >= 10 },
  { id: 'stars15',  icon: '✨', title: '١٥ نجمة',          test: (s) => s.totalStars >= 15 },
  { id: 'stars30',  icon: '💫', title: '٣٠ نجمة',          test: (s) => s.totalStars >= 30 },
  { id: 'perfect3', icon: '🎖️', title: 'ثلاثة أداء مثالي', test: (s) => s.perfect >= 3 },
  { id: 'master',   icon: '👑', title: 'بطل الأنشطة',      test: (s) => s.completed >= 16 },
];

export default class Rewards {
  constructor({ key = 'kcs.learning.badges' } = {}) {
    this.key = key;
    this.earned = new Set(this._read());
  }
  _read() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch (_) { return []; } }
  _write() { try { localStorage.setItem(this.key, JSON.stringify([...this.earned])); } catch (_) {} }

  all() { return BADGES.map((b) => ({ ...b, earned: this.earned.has(b.id) })); }

  /** Evaluate against stats; returns badges newly unlocked this call. */
  evaluate(stats) {
    const fresh = [];
    for (const b of BADGES) if (!this.earned.has(b.id) && b.test(stats)) { this.earned.add(b.id); fresh.push(b); }
    if (fresh.length) this._write();
    return fresh;
  }
  reset() { this.earned = new Set(); this._write(); }
}
