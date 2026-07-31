/**
 * ActivityTracker — a reusable, per-profile activity + stats engine.
 *
 * Future feature modules call its record methods (open/complete/print/export/
 * useColor/addTime…); it aggregates everything into a localStorage-backed stats
 * object and exposes getStats(). Fully offline. One tracker per child profile.
 *
 * (The coloring/library modules are frozen and don't call it yet; the example
 * seeds realistic activity to demonstrate the dashboard. Wiring a module later
 * is a one-liner: tracker.complete(item).)
 */
import { Store, dayKey } from './util.js';

const EMPTY = () => ({
  completed: {}, started: {}, opened: [], favorites: [],
  packsCompleted: [], counters: { drawings: 0, prints: 0, exports: 0, timeMs: 0 },
  daily: {}, colors: {}, categories: {}, achievements: {},
});

export default class ActivityTracker {
  constructor(profileId, { store = null, key = 'kcs.stats' } = {}) {
    this.profileId = profileId;
    this.store = store || new Store('kcs');
    this.key = `${key}:${profileId}`;
    this.data = Object.assign(EMPTY(), this.store.get(this.key, {}));
  }

  _save() { this.store.set(this.key, this.data); }
  _now() { return Date.now(); }
  _touchDay(count = 1, ms = 0) {
    const k = dayKey();
    const d = this.data.daily[k] || { count: 0, timeMs: 0 };
    d.count += count; d.timeMs += ms; this.data.daily[k] = d;
  }
  _id(item) { return typeof item === 'string' ? item : item.id; }
  _pack(item) { return typeof item === 'string' ? null : (item.packId || null); }

  // ---- record methods (called by feature modules) ----
  open(item) {
    const id = this._id(item); const pack = this._pack(item);
    this.data.opened = [{ id, packId: pack, at: this._now() }, ...this.data.opened.filter((o) => o.id !== id)].slice(0, 50);
    if (!this.data.completed[id]) this.data.started[id] = this._now();
    if (pack) this.data.categories[pack] = (this.data.categories[pack] || 0) + 1;
    this._touchDay(1);
    this._save();
  }

  complete(item) {
    const id = this._id(item); const pack = this._pack(item);
    this.data.completed[id] = { packId: pack, at: this._now() };
    delete this.data.started[id];
    if (pack) this.data.categories[pack] = (this.data.categories[pack] || 0) + 1;
    this.data.counters.drawings += 1;
    this._touchDay(1);
    this._save();
  }

  markPackCompleted(packId) { if (!this.data.packsCompleted.includes(packId)) { this.data.packsCompleted.push(packId); this._save(); } }

  setFavorite(itemId, isFav) {
    const set = new Set(this.data.favorites);
    if (isFav) set.add(itemId); else set.delete(itemId);
    this.data.favorites = [...set]; this._save();
  }

  useColor(hex) { hex = String(hex).toLowerCase(); this.data.colors[hex] = (this.data.colors[hex] || 0) + 1; this._save(); }
  print() { this.data.counters.prints += 1; this._save(); }
  exportImage() { this.data.counters.exports += 1; this._save(); }
  addTime(ms) { this.data.counters.timeMs += ms; this._touchDay(0, ms); this._save(); }

  // ---- derived stats ----
  _activeStreak() {
    let streak = 0; const d = new Date();
    // count consecutive days (including today) with any activity
    for (;;) {
      const k = dayKey(d);
      if (this.data.daily[k] && this.data.daily[k].count > 0) { streak += 1; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  getStats() {
    const completedCount = Object.keys(this.data.completed).length;
    const startedCount = Object.keys(this.data.started).length;
    return {
      raw: this.data,
      completedCount,
      startedCount,
      favoritesCount: this.data.favorites.length,
      packsCompletedCount: this.data.packsCompleted.length,
      categories: this.data.categories,
      colors: this.data.colors,
      daily: this.data.daily,
      counters: this.data.counters,
      opened: this.data.opened,
      completed: this.data.completed,
      started: this.data.started,
      favorites: this.data.favorites,
      activeStreak: this._activeStreak(),
      activeDays: Object.keys(this.data.daily).length,
      achievements: this.data.achievements,
    };
  }

  /** Record achievement unlocks; returns newly-unlocked ids. */
  recordUnlocks(ids = []) {
    const fresh = [];
    for (const id of ids) { if (!this.data.achievements[id]) { this.data.achievements[id] = this._now(); fresh.push(id); } }
    if (fresh.length) this._save();
    return fresh;
  }

  reset() { this.data = EMPTY(); this._save(); }
}
