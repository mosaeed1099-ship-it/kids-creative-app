/**
 * AssetStore.js — IndexedDB-backed store for binary CMS assets (Phase 17A.1, C2).
 *
 * Images / SVG / PDF data used to live inline inside the single localStorage
 * blob, which has a ~5 MB ceiling. They now live here (IndexedDB, a far larger
 * quota, async), and CMS records keep only a lightweight reference `{ ref }`.
 *
 * Fully offline. Degrades gracefully: if IndexedDB is unavailable (private mode,
 * old browser) `open()` resolves `false` and callers fall back to inline data.
 */
const DB_NAME = 'kcs.cms.assets';
const STORE = 'assets';
const VERSION = 1;

export default class AssetStore {
  constructor() { this.db = null; this.ok = false; }

  /** Open (or create) the database. Never rejects — resolves to a boolean. */
  open() {
    return new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') return resolve(false);
        const req = indexedDB.open(DB_NAME, VERSION);
        req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); };
        req.onsuccess = () => { this.db = req.result; this.ok = true; resolve(true); };
        req.onerror = () => { this.ok = false; resolve(false); };
        req.onblocked = () => resolve(false);
      } catch { resolve(false); }
    });
  }

  _os(mode) { return this.db.transaction(STORE, mode).objectStore(STORE); }

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
      r.onsuccess = () => resolve(r.result || null);
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

  /** All records as `[{ ref, ...value }]` (one transaction, cursor-ordered). */
  all() {
    return new Promise((resolve) => {
      if (!this.ok) return resolve([]);
      const out = [];
      const c = this._os('readonly').openCursor();
      c.onsuccess = () => { const cur = c.result; if (cur) { out.push({ ref: cur.key, ...cur.value }); cur.continue(); } else resolve(out); };
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
