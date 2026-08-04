/**
 * VersionStore.js — persisted history snapshots (Phase 17A.2), on the shared
 * KVStore (IndexedDB). Snapshots hold the store STATE (which references assets
 * by id, not their binaries), so they stay small and never duplicate asset data.
 * Kept out of localStorage on purpose (the C1/C2 lesson).
 *
 * Record: { id, seq, createdAt, author, kind:'auto'|'manual', note, state, stats }
 */
import KVStore from './idb.js';

export default class VersionStore {
  constructor() { this.kv = new KVStore('kcs.cms.versions', 'versions'); }
  get ok() { return this.kv.ok; }

  open() { return this.kv.open(); }
  add(record) { return this.kv.put(record.id, record); }
  get(id) { return this.kv.get(id); }
  remove(id) { return this.kv.delete(id); }
  clear() { return this.kv.clear(); }

  /** Newest first (by seq). */
  async list() { const es = await this.kv.entries(); return es.map((e) => e.value).sort((a, b) => (b.seq || 0) - (a.seq || 0)); }
}
