/**
 * UndoManager.js — session undo/redo for ALL operations, destructive included
 * (Phase 17A.2). Uniform and dup-free: instead of per-operation inverse
 * commands, it snapshots state. The store emits the pre-mutation state on every
 * successful commit (`onCommit`); we stack those. Undo/redo replace the store
 * state, which is how create/edit/delete/bulk/reorder/restore/empty-trash all
 * become reversible through one mechanism.
 *
 * In-memory (session-scoped) by design; persisted history lives in
 * VersionManager. `busy` prevents undo/redo's own replace() from recording.
 */
export default class UndoManager {
  constructor(store, { cap = 80 } = {}) {
    this.store = store; this.cap = cap; this.undo = []; this.redo = []; this.busy = false; this._subs = new Set();
    this._off = store.onCommit((before) => {
      if (this.busy) return;
      this.undo.push(before);
      if (this.undo.length > this.cap) this.undo.shift();
      this.redo.length = 0;
      this._emit();
    });
  }

  canUndo() { return this.undo.length > 0; }
  canRedo() { return this.redo.length > 0; }
  on(fn) { this._subs.add(fn); return () => this._subs.delete(fn); }
  _emit() { this._subs.forEach((f) => { try { f(); } catch (e) { console.error('[CMS] undo sub', e); } }); }

  _perform(from, to) {
    if (!from.length) return false;
    const target = from.pop();
    const current = this.store.snapshot();
    this.busy = true;
    const ok = this.store.replace(target);
    this.busy = false;
    if (ok) { to.push(current); this._emit(); } else { from.push(target); }
    return ok;
  }

  undoOp() { return this._perform(this.undo, this.redo); }
  redoOp() { return this._perform(this.redo, this.undo); }

  destroy() { this._off && this._off(); }
}
