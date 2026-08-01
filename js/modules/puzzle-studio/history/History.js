/**
 * History.js — unlimited undo/redo. The engine's HistoryManager is capped at
 * 100 by design; the brief needs unlimited, so the module keeps its own uncapped
 * stack of { undo(), redo() } ops (recorded after being applied once).
 */
export default class History {
  constructor({ onChange = null } = {}) { this.onChange = onChange; this._s = []; this._i = -1; }
  get canUndo() { return this._i >= 0; }
  get canRedo() { return this._i < this._s.length - 1; }
  _emit() { this.onChange?.({ canUndo: this.canUndo, canRedo: this.canRedo }); }
  push(op) { this._s.splice(this._i + 1); this._s.push(op); this._i = this._s.length - 1; this._emit(); return op; }
  undo() { if (!this.canUndo) return; this._s[this._i].undo?.(); this._i -= 1; this._emit(); }
  redo() { if (!this.canRedo) return; this._s[this._i + 1].redo?.(); this._i += 1; this._emit(); }
  clear() { this._s = []; this._i = -1; this._emit(); }
}
