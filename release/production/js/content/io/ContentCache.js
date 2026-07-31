/**
 * ContentCache — two-tier cache for loaded JSON.
 *   L1: in-memory Map (fast, per-session)
 *   L2: localStorage (survives reloads), with TTL + version stamp
 *
 * Used by ContentLoader so packs/catalog are fetched once, then served from
 * cache (lazy loading friendly). Safe when storage is unavailable.
 */
import Persist from '../util/persist.js';

export default class ContentCache {
  constructor({ namespace = 'kcs.content.cache', ttl = 1000 * 60 * 60 * 24, version = 1 } = {}) {
    this._mem = new Map();
    this._store = new Persist(namespace);
    this.ttl = ttl;           // ms; 0 = no expiry
    this.version = version;   // bump to invalidate all persisted entries
  }

  _now() { return (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0; }

  get(key) {
    if (this._mem.has(key)) return this._mem.get(key);
    const rec = this._store.get(key);
    if (!rec) return null;
    if (rec.v !== this.version) { this._store.remove(key); return null; }
    if (this.ttl && rec.t && (this._now() - rec.t) > this.ttl) { this._store.remove(key); return null; }
    this._mem.set(key, rec.d);
    return rec.d;
  }

  set(key, data, { persist = true } = {}) {
    this._mem.set(key, data);
    if (persist) this._store.set(key, { v: this.version, t: this._now(), d: data });
    return data;
  }

  has(key) { return this.get(key) != null; }

  invalidate(key) { this._mem.delete(key); this._store.remove(key); }

  clearMemory() { this._mem.clear(); }
}
