/**
 * ProgressTracker — local, offline progress for learning activities.
 * Persists per-item best stars + completion + an in-progress snapshot (so a
 * child can *continue* an activity), plus aggregate totals used by Rewards.
 * Self-contained localStorage with a safe in-memory fallback.
 */
export default class ProgressTracker {
  constructor({ key = 'kcs.learning.progress' } = {}) {
    this.key = key; this._mem = null;
    this.data = this._read();
    this.data.items ||= {};
  }
  _read() {
    try { const raw = localStorage.getItem(this.key); if (raw) return JSON.parse(raw); } catch (_) {}
    return this._mem || { items: {} };
  }
  _write() {
    this._mem = this.data;
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (_) {}
  }
  _now() { return (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0; }

  entry(id) { return this.data.items[id] || { stars: 0, completed: false, state: null, at: 0, plays: 0 }; }
  best(id) { return this.entry(id).stars || 0; }
  isCompleted(id) { return !!this.entry(id).completed; }
  hasSaved(id) { return !!this.entry(id).state; }
  savedState(id) { return this.entry(id).state; }

  /** Persist an in-progress snapshot so the activity can be continued. */
  saveState(id, state) {
    const e = this.entry(id); e.state = state; e.at = this._now();
    this.data.items[id] = e; this._write();
  }
  clearState(id) { const e = this.entry(id); e.state = null; this.data.items[id] = e; this._write(); }

  /** Record a completion; keeps the best star score, clears in-progress state. */
  complete(id, stars) {
    const e = this.entry(id);
    e.completed = true; e.stars = Math.max(e.stars || 0, stars || 0);
    e.plays = (e.plays || 0) + 1; e.state = null; e.at = this._now();
    this.data.items[id] = e; this._write();
    return e;
  }

  stats() {
    const items = Object.values(this.data.items);
    const completed = items.filter((e) => e.completed);
    return {
      completed: completed.length,
      totalStars: items.reduce((s, e) => s + (e.stars || 0), 0),
      perfect: completed.filter((e) => e.stars === 3).length,
      plays: items.reduce((s, e) => s + (e.plays || 0), 0),
    };
  }
  reset() { this.data = { items: {} }; this._write(); }
}
