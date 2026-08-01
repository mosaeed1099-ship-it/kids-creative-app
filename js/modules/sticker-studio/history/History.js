/**
 * History.js — unlimited undo/redo for the Sticker Studio.
 * The engine's HistoryManager is capped at 100 by design, and the brief
 * requires UNLIMITED undo/redo, so the module keeps its own uncapped stack of
 * { label, emoji, undo(), redo() } ops (recorded after being applied once).
 */
export default class History {
  constructor({ onChange = null } = {}) {
    this.onChange = onChange;
    this._stack = [];
    this._i = -1;
  }
  get canUndo() { return this._i >= 0; }
  get canRedo() { return this._i < this._stack.length - 1; }
  _emit() { this.onChange?.({ canUndo: this.canUndo, canRedo: this.canRedo }); }

  push(op) {
    this._stack.splice(this._i + 1);
    this._stack.push(op);
    this._i = this._stack.length - 1;
    this._emit();
    return op;
  }
  undo() {
    if (!this.canUndo) return;
    this._stack[this._i].undo?.();
    this._i -= 1;
    this._emit();
  }
  redo() {
    if (!this.canRedo) return;
    this._stack[this._i + 1].redo?.();
    this._i += 1;
    this._emit();
  }
  clear() { this._stack = []; this._i = -1; this._emit(); }
}
