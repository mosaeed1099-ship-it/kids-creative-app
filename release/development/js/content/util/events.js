/**
 * events.js — tiny standalone event emitter for the Content Engine.
 * Kept internal so the content layer has no dependency on the app or engine.
 */
export default class Emitter {
  constructor() { this._m = new Map(); }

  on(type, fn) {
    if (!this._m.has(type)) this._m.set(type, new Set());
    this._m.get(type).add(fn);
    return () => this.off(type, fn);
  }

  off(type, fn) { this._m.get(type)?.delete(fn); }

  emit(type, payload) {
    const s = this._m.get(type);
    if (!s) return;
    for (const fn of [...s]) {
      try { fn(payload); } catch (e) { console.error(`[Content] "${type}"`, e); }
    }
  }

  clear() { this._m.clear(); }
}
