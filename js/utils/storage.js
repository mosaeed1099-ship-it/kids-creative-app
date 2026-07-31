/**
 * storage.js — LocalStorageManager
 * Namespaced, JSON-safe wrapper around localStorage with an in-memory
 * fallback so the app never crashes when storage is blocked (private mode,
 * quota exceeded, or the artifact sandbox).
 */
export class LocalStorageManager {
  /** @param {string} namespace - prefix for all keys, keeps products isolated. */
  constructor(namespace = 'kcs') {
    this.namespace = namespace;
    this._memory = {};
    this._available = this._probe();
  }

  _probe() {
    try {
      const k = '__kcs_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (_) {
      return false;
    }
  }

  get available() {
    return this._available;
  }

  _key(key) {
    return `${this.namespace}:${key}`;
  }

  /** Read a value (parsed from JSON). Returns `fallback` if missing/invalid. */
  get(key, fallback = null) {
    try {
      if (this._available) {
        const raw = window.localStorage.getItem(this._key(key));
        return raw == null ? fallback : JSON.parse(raw);
      }
      return key in this._memory ? this._memory[key] : fallback;
    } catch (_) {
      return fallback;
    }
  }

  /** Write a value (serialized to JSON). Returns true if it hit real storage. */
  set(key, value) {
    try {
      if (this._available) {
        window.localStorage.setItem(this._key(key), JSON.stringify(value));
        return true;
      }
    } catch (_) {
      /* fall through to memory */
    }
    this._memory[key] = value;
    return false;
  }

  remove(key) {
    try {
      if (this._available) window.localStorage.removeItem(this._key(key));
    } catch (_) { /* ignore */ }
    delete this._memory[key];
  }

  has(key) {
    return this.get(key, undefined) !== undefined;
  }

  /** Remove only this namespace's keys. */
  clear() {
    try {
      if (this._available) {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith(`${this.namespace}:`))
          .forEach((k) => window.localStorage.removeItem(k));
      }
    } catch (_) { /* ignore */ }
    this._memory = {};
  }
}

export default LocalStorageManager;
