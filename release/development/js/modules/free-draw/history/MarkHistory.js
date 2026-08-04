/**
 * MarkHistory.js — unlimited undo/redo.
 *
 * The engine ships a HistoryManager, but its stack is capped at 100 by design.
 * The brief requires UNLIMITED undo/redo + a history timeline, so the studio
 * keeps its own uncapped stack built on the same Command idea ({undo, redo}).
 * Strokes/shapes store only vector data, so thousands of steps stay cheap.
 *
 * Each op: { label, emoji, undo(), redo() }. Ops are recorded AFTER the action
 * has already been applied once (push does not re-run redo()).
 */
export default class MarkHistory {
  constructor({ onChange = null } = {}) {
    this.onChange = onChange;
    this._stack = [];
    this._index = -1;
  }

  get canUndo() { return this._index >= 0; }
  get canRedo() { return this._index < this._stack.length - 1; }

  _emit() {
    this.onChange?.({
      canUndo: this.canUndo, canRedo: this.canRedo,
      index: this._index, length: this._stack.length,
    });
  }

  /** Record an op that has already been applied once. */
  push(op) {
    this._stack.splice(this._index + 1); // drop redo tail
    this._stack.push(op);
    this._index = this._stack.length - 1;
    this._emit();
    return op;
  }

  undo() {
    if (!this.canUndo) return null;
    const op = this._stack[this._index];
    op.undo?.();
    this._index -= 1;
    this._emit();
    return op;
  }

  redo() {
    if (!this.canRedo) return null;
    const op = this._stack[this._index + 1];
    op.redo?.();
    this._index += 1;
    this._emit();
    return op;
  }

  /** Jump directly to a point on the timeline (0 = before first op). */
  goto(targetIndex) {
    const t = Math.max(-1, Math.min(this._stack.length - 1, targetIndex));
    while (this._index > t) { this._stack[this._index].undo?.(); this._index -= 1; }
    while (this._index < t) { this._stack[this._index + 1].redo?.(); this._index += 1; }
    this._emit();
  }

  /** Timeline entries (oldest → newest). */
  entries() {
    return this._stack.map((op, i) => ({
      label: op.label || 'إجراء', emoji: op.emoji || '•',
      index: i, applied: i <= this._index,
    }));
  }

  get index() { return this._index; }
  clear() { this._stack = []; this._index = -1; this._emit(); }
}
