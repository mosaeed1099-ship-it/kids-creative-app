/**
 * PrintQueue — an ordered, persisted list of item ids to print. Supports add,
 * remove, reorder and clear. Restored on load so parents can "continue
 * printing". Offline (localStorage).
 */
import { Store, Emitter } from './util.js';

export default class PrintQueue {
  constructor({ store = null, key = 'kcs.print.queue' } = {}) {
    this.events = new Emitter();
    this.store = store || new Store('kcs');
    this.key = key;
    this._ids = this.store.get(key, []);
  }
  _save() { this.store.set(this.key, this._ids); this.events.emit('change', this.list()); }

  list() { return [...this._ids]; }
  size() { return this._ids.length; }
  has(id) { return this._ids.includes(id); }

  add(id) { if (!this._ids.includes(id)) { this._ids.push(id); this._save(); } return this; }
  addMany(ids) { let changed = false; ids.forEach((id) => { if (!this._ids.includes(id)) { this._ids.push(id); changed = true; } }); if (changed) this._save(); return this; }
  remove(id) { const i = this._ids.indexOf(id); if (i >= 0) { this._ids.splice(i, 1); this._save(); } return this; }
  clear() { if (this._ids.length) { this._ids = []; this._save(); } return this; }
  toggle(id) { this.has(id) ? this.remove(id) : this.add(id); return this.has(id); }

  move(id, dir) {
    const i = this._ids.indexOf(id); if (i < 0) return this;
    const j = dir < 0 ? i - 1 : i + 1;
    if (j < 0 || j >= this._ids.length) return this;
    [this._ids[i], this._ids[j]] = [this._ids[j], this._ids[i]];
    this._save();
    return this;
  }
}
