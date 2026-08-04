/**
 * AssetStore.js — IndexedDB-backed store for binary CMS assets (C2), now built
 * on the shared KVStore (Phase 17A.2) so there is a single IndexedDB
 * implementation. Public API is unchanged: open / put / get / delete / all /
 * clear, plus an `ok` flag. Records are `{ type, data, mime, name, size }`
 * keyed by an asset ref; CMS records keep only the ref.
 */
import KVStore from './idb.js';

export default class AssetStore {
  constructor() { this.kv = new KVStore('kcs.cms.assets', 'assets'); }
  get ok() { return this.kv.ok; }

  open() { return this.kv.open(); }
  put(key, value) { return this.kv.put(key, value); }
  get(key) { return this.kv.get(key); }
  delete(key) { return this.kv.delete(key); }
  clear() { return this.kv.clear(); }

  /** All assets as `[{ ref, ...value }]`. */
  all() { return this.kv.entries().then((es) => es.map((e) => ({ ref: e.key, ...e.value }))); }
}
