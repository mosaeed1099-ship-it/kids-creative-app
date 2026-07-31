/**
 * HistoryManager — undo/redo via the Command pattern.
 *
 * "Empty" by design: the engine ships the mechanism, not concrete commands.
 * Modules push commands implementing ICommand ({ execute(), undo(), label }).
 * Emits 'history:change' with { canUndo, canRedo, index, length }.
 */
export default class HistoryManager {
  constructor({ events, limit = 100 } = {}) {
    this.events = events;
    this.limit = limit;
    /** @type {import('../interfaces/ICommand.js').default[]} */
    this._stack = [];
    this._index = -1; // points at the last-applied command
  }

  get canUndo() { return this._index >= 0; }
  get canRedo() { return this._index < this._stack.length - 1; }

  _changed() {
    this.events?.emit('history:change', {
      canUndo: this.canUndo, canRedo: this.canRedo,
      index: this._index, length: this._stack.length,
    });
  }

  /** Execute a command and record it (drops any redo tail). */
  push(command) {
    command.execute?.();
    this._stack.splice(this._index + 1); // discard redo branch
    this._stack.push(command);
    if (this._stack.length > this.limit) this._stack.shift();
    this._index = this._stack.length - 1;
    this._changed();
    return command;
  }

  /** Record a command WITHOUT executing (caller already applied it). */
  record(command) {
    this._stack.splice(this._index + 1);
    this._stack.push(command);
    if (this._stack.length > this.limit) this._stack.shift();
    this._index = this._stack.length - 1;
    this._changed();
    return command;
  }

  undo() {
    if (!this.canUndo) return null;
    const cmd = this._stack[this._index];
    cmd.undo?.();
    this._index -= 1;
    this._changed();
    return cmd;
  }

  redo() {
    if (!this.canRedo) return null;
    const cmd = this._stack[this._index + 1];
    cmd.execute?.();
    this._index += 1;
    this._changed();
    return cmd;
  }

  clear() { this._stack = []; this._index = -1; this._changed(); }
}
