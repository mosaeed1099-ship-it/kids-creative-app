/**
 * CmsStore.js — the offline, localStorage-backed data store for the CMS.
 * No backend, no API, no database — everything lives in the browser.
 *
 * Collections (all arrays of plain objects):
 *   packs       themed bundles      { id, title{ar,en}, description, thumbnail, premium, order, tags[] }
 *   items       all content items   { id, assetType, title{ar,en}, description, tags[], categoryId, packId, asset, order }
 *   categories  groupings           { id, title{ar,en}, icon, packId, order }
 *   assets      uploaded media       { id, name, mime, kind, dataUrl, size }
 *
 * Sections (Coloring / Stickers / Puzzle images / Stories / Activities / PDFs)
 * are just `items` filtered by `assetType`, matching the Content Engine model.
 */
const KEY = 'kcs.cms.v1';
let _seq = 0;
export const uid = (p = 'x') => `${p}_${Date.now().toString(36)}${(_seq++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const write = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; } };
const clone = (o) => JSON.parse(JSON.stringify(o));

function defaults() { return { version: 1, packs: [], items: [], categories: [], assets: [] }; }

export default class CmsStore {
  constructor() { this.state = read() || defaults(); this._listeners = new Set(); }

  on(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
  _emit() { this._listeners.forEach((f) => { try { f(); } catch (e) { console.error('[CMS] listener', e); } }); }
  save() { const ok = write(this.state); this._emit(); return ok; }

  // ---- generic collection ops ----
  list(coll) { return this.state[coll] || []; }
  get(coll, id) { return this.list(coll).find((x) => x.id === id) || null; }

  create(coll, obj = {}) {
    const o = { ...obj };
    o.id = o.id || uid(coll.slice(0, 3));
    if (o.order == null) o.order = this.list(coll).length;
    this.state[coll].push(o);
    this.save();
    return o;
  }
  update(coll, id, patch) { const o = this.get(coll, id); if (o) { Object.assign(o, patch); this.save(); } return o; }
  remove(coll, id) { this.state[coll] = this.list(coll).filter((x) => x.id !== id); this.save(); }

  duplicate(coll, id) {
    const src = this.get(coll, id); if (!src) return null;
    const c = clone(src); c.id = uid(coll.slice(0, 3)); c.order = this.list(coll).length;
    if (c.title) c.title = copyTitle(c.title);
    this.state[coll].push(c); this.save();
    return c;
  }

  /** Reorder a subset (by id, in the desired order) within the collection. */
  reorder(coll, orderedIds) {
    orderedIds.forEach((id, i) => { const o = this.get(coll, id); if (o) o._reorder = i; });
    this.state[coll].sort((a, b) => (a._reorder ?? a.order ?? 0) - (b._reorder ?? b.order ?? 0));
    this.state[coll].forEach((o, i) => { o.order = i; delete o._reorder; });
    this.save();
  }

  bulkRemove(coll, ids) { const set = new Set(ids); this.state[coll] = this.list(coll).filter((x) => !set.has(x.id)); this.save(); }
  bulkUpdate(coll, ids, patch) { const set = new Set(ids); this.list(coll).forEach((o) => { if (set.has(o.id)) Object.assign(o, patch); }); this.save(); }

  // ---- items by assetType (a "section") ----
  itemsByType(t) { return this.list('items').filter((i) => i.assetType === t).sort((a, b) => (a.order || 0) - (b.order || 0)); }

  // ---- categories / packs helpers ----
  categoriesForPack(packId) { return this.list('categories').filter((c) => !packId || c.packId === packId); }

  // ---- whole-store ops ----
  snapshot() { return clone(this.state); }
  replace(state) { this.state = { ...defaults(), ...state }; this.save(); }
  clearAll() { this.state = defaults(); this.save(); }
  stats() {
    return {
      packs: this.list('packs').length,
      items: this.list('items').length,
      categories: this.list('categories').length,
      assets: this.list('assets').length,
    };
  }
}

function copyTitle(t) {
  if (typeof t === 'string') return `${t} (نسخة)`;
  const out = { ...t };
  if (out.ar) out.ar = `${out.ar} (نسخة)`;
  if (out.en) out.en = `${out.en} (copy)`;
  return out;
}
