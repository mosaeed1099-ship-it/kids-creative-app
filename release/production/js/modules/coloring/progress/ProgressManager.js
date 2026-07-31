/**
 * ProgressManager — saves and restores unfinished coloring locally.
 * Each content item's paint layer is stored as a PNG dataURL under its id, so
 * a child can close the app and come back to the same half-colored page.
 *
 * Self-contained localStorage (safe fallback). Large images are big in storage;
 * saving is debounced by the app and old entries can be trimmed if needed.
 */
export default class ProgressManager {
  constructor({ prefix = 'kcs.coloring.progress' } = {}) {
    this.prefix = prefix;
    this._ok = this._probe();
    this._mem = {};
  }

  _probe() { try { localStorage.setItem('__kcs_p__', '1'); localStorage.removeItem('__kcs_p__'); return true; } catch (_) { return false; } }
  _key(id) { return `${this.prefix}:${id}`; }
  _now() { return (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0; }

  save(itemId, dataUrl) {
    const rec = { dataUrl, at: this._now() };
    try { if (this._ok) { localStorage.setItem(this._key(itemId), JSON.stringify(rec)); return true; } } catch (_) {}
    this._mem[itemId] = rec; return false;
  }

  load(itemId) {
    try {
      if (this._ok) { const raw = localStorage.getItem(this._key(itemId)); return raw ? JSON.parse(raw).dataUrl : null; }
    } catch (_) {}
    return this._mem[itemId]?.dataUrl || null;
  }

  has(itemId) { return !!this.load(itemId); }

  remove(itemId) {
    try { if (this._ok) localStorage.removeItem(this._key(itemId)); } catch (_) {}
    delete this._mem[itemId];
  }
}
