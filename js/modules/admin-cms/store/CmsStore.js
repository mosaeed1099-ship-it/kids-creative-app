/**
 * CmsStore.js — the offline, localStorage-backed data store for the CMS.
 * No backend, no API, no database — everything lives in the browser.
 *
 * Reliability (Phase 17A.1, C1): every mutation is transactional. The previous
 * state is snapshotted, the change applied, then persisted; if persistence
 * fails (e.g. localStorage quota exhausted) the in-memory state is ROLLED BACK
 * and registered error listeners fire, so the UI can show a real, persistent
 * error instead of a false "saved". Binary assets no longer live here — they
 * are referenced (see io/assets.js, C2) — so this blob stays small.
 *
 * Collections (all arrays of plain objects):
 *   packs       themed bundles      { id, title{ar,en}, description, thumbnail, premium, order, tags[] }
 *   items       all content items   { id, assetType, title{ar,en}, description, tags[], categoryId, packId, asset, order }
 *   categories  groupings           { id, title{ar,en}, icon, packId, order }
 *   assets      uploaded media       { id, name, asset, tags[] }
 */
const KEY = 'kcs.cms.v1';
const BUDGET = 5 * 1024 * 1024; // ~5 MB typical localStorage ceiling
let _seq = 0;
export const uid = (p = 'x') => `${p}_${Date.now().toString(36)}${(_seq++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const write = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const human = (b) => (b < 1024 ? `${b} ب` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} ك.ب` : `${(b / 1024 / 1024).toFixed(2)} م.ب`);

function defaults() { return { version: 1, packs: [], items: [], categories: [], assets: [] }; }

export default class CmsStore {
  constructor() { this.state = read() || defaults(); this._listeners = new Set(); this._errListeners = new Set(); }

  on(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
  onPersistError(fn) { this._errListeners.add(fn); return () => this._errListeners.delete(fn); }
  _emit() { this._listeners.forEach((f) => { try { f(); } catch (e) { console.error('[CMS] listener', e); } }); }
  _emitError(info) { this._errListeners.forEach((f) => { try { f(info); } catch (e) { console.error('[CMS] err-listener', e); } }); }

  /**
   * Persist current state; on failure roll back to `backup`, notify error
   * listeners, and return false. On success emit change and return true.
   */
  _commit(backup) {
    if (write(this.state)) { this._emit(); return true; }
    this.state = backup;            // rollback memory — never keep an unpersisted change
    this._emit();
    this._emitError(this.usage());
    return false;
  }

  /** Force a write of in-place mutations (used by the asset migration). */
  flush() { return this._commit(clone(this.state)); }
  /** @deprecated kept for compatibility — prefer the transactional mutators. */
  save() { return this.flush(); }

  // ---- generic collection ops (all transactional) ----
  list(coll) { return this.state[coll] || []; }
  get(coll, id) { return this.list(coll).find((x) => x.id === id) || null; }

  create(coll, obj = {}) {
    const backup = clone(this.state);
    const o = { ...obj };
    o.id = o.id || uid(coll.slice(0, 3));
    if (o.order == null) o.order = this.list(coll).length;
    this.state[coll].push(o);
    return this._commit(backup) ? o : null;
  }
  update(coll, id, patch) { const backup = clone(this.state); const o = this.get(coll, id); if (!o) return null; Object.assign(o, patch); return this._commit(backup) ? o : null; }
  remove(coll, id) { const backup = clone(this.state); this.state[coll] = this.list(coll).filter((x) => x.id !== id); return this._commit(backup); }

  duplicate(coll, id) {
    const backup = clone(this.state);
    const src = this.get(coll, id); if (!src) return null;
    const c = clone(src); c.id = uid(coll.slice(0, 3)); c.order = this.list(coll).length;
    if (c.title) c.title = copyTitle(c.title);
    this.state[coll].push(c);
    return this._commit(backup) ? c : null;
  }

  /** Reorder a subset (by id, in the desired order) within the collection. */
  reorder(coll, orderedIds) {
    const backup = clone(this.state);
    orderedIds.forEach((id, i) => { const o = this.get(coll, id); if (o) o._reorder = i; });
    this.state[coll].sort((a, b) => (a._reorder ?? a.order ?? 0) - (b._reorder ?? b.order ?? 0));
    this.state[coll].forEach((o, i) => { o.order = i; delete o._reorder; });
    return this._commit(backup);
  }

  bulkRemove(coll, ids) { const backup = clone(this.state); const set = new Set(ids); this.state[coll] = this.list(coll).filter((x) => !set.has(x.id)); return this._commit(backup); }
  bulkUpdate(coll, ids, patch) { const backup = clone(this.state); const set = new Set(ids); this.list(coll).forEach((o) => { if (set.has(o.id)) Object.assign(o, patch); }); return this._commit(backup); }

  // ---- items by assetType (a "section") ----
  itemsByType(t) { return this.list('items').filter((i) => i.assetType === t).sort((a, b) => (a.order || 0) - (b.order || 0)); }

  // ---- categories / packs helpers ----
  categoriesForPack(packId) { return this.list('categories').filter((c) => !packId || c.packId === packId); }

  // ---- whole-store ops ----
  snapshot() { return clone(this.state); }
  replace(state) { const backup = clone(this.state); this.state = { ...defaults(), ...state }; return this._commit(backup); }
  clearAll() { const backup = clone(this.state); this.state = defaults(); return this._commit(backup); }
  stats() { return { packs: this.list('packs').length, items: this.list('items').length, categories: this.list('categories').length, assets: this.list('assets').length }; }

  /** Current localStorage footprint of this store vs the ~5 MB budget (C1). */
  usage() {
    let bytes = 0; try { bytes = (localStorage.getItem(KEY) || '').length * 2; } catch { bytes = JSON.stringify(this.state).length * 2; }
    return { bytes, budget: BUDGET, ratio: Math.min(1, bytes / BUDGET), human: human(bytes), budgetHuman: human(BUDGET) };
  }

  /** Best-effort device-wide estimate (includes IndexedDB assets), if supported. */
  async estimate() { try { if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); return { usage: e.usage, quota: e.quota }; } } catch { /* ignore */ } return null; }
}

function copyTitle(t) {
  if (typeof t === 'string') return `${t} (نسخة)`;
  const out = { ...t };
  if (out.ar) out.ar = `${out.ar} (نسخة)`;
  if (out.en) out.en = `${out.en} (copy)`;
  return out;
}
