/**
 * VersionManager.js — snapshot history (Phase 17A.2). Reuses the store's own
 * snapshot()/replace() and the VersionStore (IndexedDB). Provides:
 *   • automatic version creation (debounced, coalesced, capped, skips no-ops)
 *   • manual version creation (author + note)
 *   • restore any version
 *   • compare two versions (→ diff for the viewer)
 *   • the change log (the ordered version list)
 */
import VersionStore from '../store/VersionStore.js';
import { uid } from '../store/CmsStore.js';
import { diffStates, isEmpty, summarize } from './diff.js';

export default class VersionManager {
  constructor(store, { author = 'المحرر', autoCap = 40, autoDelay = 1200 } = {}) {
    this.store = store; this.vs = new VersionStore();
    this.author = author; this.autoCap = autoCap; this.autoDelay = autoDelay;
    this.seq = 0; this.suspend = false; this._timer = null; this._subs = new Set();
  }

  async init() {
    await this.vs.open();
    const list = await this.list();
    this.seq = list.reduce((m, v) => Math.max(m, v.seq || 0), 0);
    this._off = this.store.onCommit(() => this._scheduleAuto());
    if (!list.length && this.store.stats().items + this.store.stats().packs > 0) await this.create({ kind: 'auto', note: 'أول لقطة' });
    return this;
  }

  on(fn) { this._subs.add(fn); return () => this._subs.delete(fn); }
  _emit() { this._subs.forEach((f) => { try { f(); } catch (e) { console.error('[CMS] version sub', e); } }); }

  list() { return this.vs.list(); }
  get(id) { return this.vs.get(id); }
  async latest() { const l = await this.list(); return l[0] || null; }

  /** Create a version from the current state. */
  async create({ kind = 'manual', note = '' } = {}) {
    const rec = { id: uid('ver'), seq: ++this.seq, createdAt: new Date().toISOString(), author: this.author, kind, note, state: this.store.snapshot(), stats: this.store.stats() };
    await this.vs.add(rec);
    if (kind === 'auto') await this._pruneAuto();
    this._emit();
    return rec;
  }

  _scheduleAuto() { if (this.suspend) return; clearTimeout(this._timer); this._timer = setTimeout(() => this._autoSnapshot(), this.autoDelay); }

  async _autoSnapshot() {
    if (this.suspend) return;
    const cur = this.store.snapshot();
    const latest = await this.latest();
    if (latest && isEmpty(diffStates(latest.state, cur))) return;   // nothing changed → no version
    const note = latest ? `تغيير تلقائي (${summarize(diffStates(latest.state, cur))})` : 'أول لقطة';
    await this.create({ kind: 'auto', note });
  }

  /** Keep only the newest `autoCap` auto versions; manual versions are never pruned. */
  async _pruneAuto() {
    const autos = (await this.list()).filter((v) => v.kind === 'auto');
    for (const v of autos.slice(this.autoCap)) await this.vs.remove(v.id);
  }

  /** Restore a version (undoable — the pre-restore state is captured by onCommit). */
  async restore(id) {
    const v = await this.vs.get(id); if (!v) return false;
    this.suspend = true;
    const ok = this.store.replace(v.state);
    this.suspend = false;
    this._emit();
    return ok;
  }

  async compare(idA, idB) {
    const [a, b] = await Promise.all([this.vs.get(idA), this.vs.get(idB)]);
    if (!a || !b) return null;
    // order by seq so the diff reads old → new
    const [older, newer] = (a.seq <= b.seq) ? [a, b] : [b, a];
    return { older, newer, diff: diffStates(older.state, newer.state) };
  }

  async remove(id) { await this.vs.remove(id); this._emit(); }
  async clear() { await this.vs.clear(); this.seq = 0; this._emit(); }

  setAuthor(name) { this.author = name || 'المحرر'; this.store.author = this.author; try { localStorage.setItem('kcs.cms.author', this.author); } catch { /* ignore */ } }

  destroy() { this._off && this._off(); clearTimeout(this._timer); }
}
