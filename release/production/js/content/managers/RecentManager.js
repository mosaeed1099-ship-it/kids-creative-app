/**
 * RecentManager — persisted "recently opened" list (most-recent first, capped).
 * A future module calls `push(id)` when the child opens an item.
 * Emits 'recent:change'.
 */
import Persist from '../util/persist.js';

export default class RecentManager {
  constructor({ emitter, persist = null, key = 'recent', limit = 40 } = {}) {
    this.emitter = emitter;
    this.key = key;
    this.limit = limit;
    this._store = persist || new Persist('kcs.content');
    this._list = this._store.get(key, []); // [{ id, at }]
  }

  _save() {
    this._store.set(this.key, this._list);
    this.emitter?.emit('recent:change', this.ids());
  }

  _now() { return (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0; }

  push(id) {
    this._list = this._list.filter((r) => r.id !== id);
    this._list.unshift({ id, at: this._now() });
    if (this._list.length > this.limit) this._list.length = this.limit;
    this._save();
    return this;
  }

  ids(limit = this.limit) { return this._list.slice(0, limit).map((r) => r.id); }
  entries(limit = this.limit) { return this._list.slice(0, limit); }
  has(id) { return this._list.some((r) => r.id === id); }
  count() { return this._list.length; }
  clear() { if (this._list.length) { this._list = []; this._save(); } }

  asSet() { return new Set(this.ids()); }
}
