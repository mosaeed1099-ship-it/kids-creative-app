/**
 * FavoritesManager — persisted set of favorited content-item ids.
 * Pure id bookkeeping; resolving ids to items is done by ContentManager.
 * Emits 'favorites:change'.
 */
import Persist from '../util/persist.js';

export default class FavoritesManager {
  constructor({ emitter, persist = null, key = 'favorites' } = {}) {
    this.emitter = emitter;
    this.key = key;
    this._store = persist || new Persist('kcs.content');
    this._set = new Set(this._store.get(key, []));
  }

  _save() {
    this._store.set(this.key, [...this._set]);
    this.emitter?.emit('favorites:change', this.ids());
  }

  has(id) { return this._set.has(id); }
  ids() { return [...this._set]; }
  count() { return this._set.size; }

  add(id) { if (!this._set.has(id)) { this._set.add(id); this._save(); } return this; }
  remove(id) { if (this._set.delete(id)) this._save(); return this; }
  toggle(id) { this._set.has(id) ? this._set.delete(id) : this._set.add(id); this._save(); return this._set.has(id); }
  clear() { if (this._set.size) { this._set.clear(); this._save(); } }

  /** Set form for fast membership tests (used by Filter). */
  asSet() { return this._set; }
}
