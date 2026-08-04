/**
 * idb.js — a tiny generic IndexedDB key/value store (Phase 17A.2).
 * One implementation shared by AssetStore (binary assets) and VersionStore
 * (history snapshots) — no duplicated IndexedDB boilerplate. Fully offline,
 * and degrades gracefully: if IndexedDB is unavailable `open()` resolves false
 * and every method becomes a safe no-op.
 */
export default class KVStore {
  constructor(dbName, storeName, version = 1) { this.dbName = dbName; this.storeName = storeName; this.version = version; this.db = null; this.ok = false; }

  open() {
    return new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') return resolve(false);
        const req = indexedDB.open(this.dbName, this.version);
        req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName); };
        req.onsuccess = () => { this.db = req.result; this.ok = true; resolve(true); };
        req.onerror = () => { this.ok = false; resolve(false); };
        req.onblocked = () => resolve(false);
      } catch { resolve(false); }
    });
  }

  _os(mode) { return this.db.transaction(this.storeName, mode).objectStore(this.storeName); }

  put(key, value) {
    return new Promise((resolve, reject) => {
      if (!this.ok) return reject(new Error('no-idb'));
      const r = this._os('readwrite').put(value, key);
      r.onsuccess = () => resolve(true);
      r.onerror = () => reject(r.error || new Error('put'));
    });
  }

  get(key) {
    return new Promise((resolve) => {
      if (!this.ok) return resolve(null);
      const r = this._os('readonly').get(key);
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => resolve(null);
    });
  }

  delete(key) {
    return new Promise((resolve) => {
      if (!this.ok) return resolve(false);
      const r = this._os('readwrite').delete(key);
      r.onsuccess = () => resolve(true);
      r.onerror = () => resolve(false);
    });
  }

  /** All records as `[{ key, value }]` (one transaction, cursor-ordered). */
  entries() {
    return new Promise((resolve) => {
      if (!this.ok) return resolve([]);
      const out = [];
      const c = this._os('readonly').openCursor();
      c.onsuccess = () => { const cur = c.result; if (cur) { out.push({ key: cur.key, value: cur.value }); cur.continue(); } else resolve(out); };
      c.onerror = () => resolve(out);
    });
  }

  clear() {
    return new Promise((resolve) => {
      if (!this.ok) return resolve(false);
      const r = this._os('readwrite').clear();
      r.onsuccess = () => resolve(true);
      r.onerror = () => resolve(false);
    });
  }
}
