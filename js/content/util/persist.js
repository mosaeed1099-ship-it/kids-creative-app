/**
 * persist.js — namespaced localStorage with an in-memory fallback.
 * Standalone (the Content Engine ships its own persistence so it stays
 * portable). Never throws: blocked storage transparently degrades to memory.
 */
export default class Persist {
  constructor(namespace = 'kcs.content') {
    this.ns = namespace;
    this._mem = {};
    this._ok = this._probe();
  }

  _probe() {
    try { localStorage.setItem('__kcs_c__', '1'); localStorage.removeItem('__kcs_c__'); return true; }
    catch (_) { return false; }
  }

  _k(key) { return `${this.ns}:${key}`; }

  get(key, fallback = null) {
    try {
      if (this._ok) { const v = localStorage.getItem(this._k(key)); return v == null ? fallback : JSON.parse(v); }
      return key in this._mem ? this._mem[key] : fallback;
    } catch (_) { return fallback; }
  }

  set(key, value) {
    try { if (this._ok) { localStorage.setItem(this._k(key), JSON.stringify(value)); return true; } }
    catch (_) { /* fall through */ }
    this._mem[key] = value; return false;
  }

  remove(key) {
    try { if (this._ok) localStorage.removeItem(this._k(key)); } catch (_) {}
    delete this._mem[key];
  }

  get available() { return this._ok; }
}
