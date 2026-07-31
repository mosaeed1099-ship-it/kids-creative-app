/**
 * ProfileManager — multiple child profiles with create / edit / delete /
 * switch, persisted entirely in localStorage (offline, no accounts).
 * Emits 'change' and 'active' events.
 */
import { Store, Emitter } from './util.js';
import Profile from './model/Profile.js';

export default class ProfileManager {
  constructor({ storeKey = 'kcs.profiles', store = null } = {}) {
    this.events = new Emitter();
    this.store = store || new Store('kcs');
    this.storeKey = storeKey;
    const saved = this.store.get(storeKey, { profiles: [], activeId: null });
    this.profiles = (saved.profiles || []).map(Profile.fromJSON);
    this.activeId = saved.activeId || (this.profiles[0]?.id ?? null);
  }

  _save() {
    this.store.set(this.storeKey, { profiles: this.profiles.map((p) => p.toJSON()), activeId: this.activeId });
    this.events.emit('change', this.list());
  }

  list() { return [...this.profiles]; }
  count() { return this.profiles.length; }
  get(id) { return this.profiles.find((p) => p.id === id) || null; }

  active() { return this.get(this.activeId) || this.profiles[0] || null; }
  setActive(id) {
    if (this.get(id)) { this.activeId = id; this._save(); this.events.emit('active', this.active()); }
    return this.active();
  }

  create(data) {
    const p = new Profile(data);
    this.profiles.push(p);
    if (!this.activeId) this.activeId = p.id;
    this._save();
    this.events.emit('active', this.active());
    return p;
  }

  update(id, patch) {
    const p = this.get(id);
    if (!p) return null;
    Object.assign(p, patch);
    this._save();
    return p;
  }

  remove(id) {
    const i = this.profiles.findIndex((p) => p.id === id);
    if (i < 0) return false;
    this.profiles.splice(i, 1);
    if (this.activeId === id) this.activeId = this.profiles[0]?.id ?? null;
    this._save();
    this.events.emit('active', this.active());
    return true;
  }
}
