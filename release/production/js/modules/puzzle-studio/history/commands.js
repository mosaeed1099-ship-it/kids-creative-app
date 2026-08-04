/**
 * commands.js — undo/redo ops. A drag (move + any snapping/merging) is captured
 * as before/after snapshots of all piece positions + group + placed state, so a
 * single op cleanly reverses grouping and locking too. Snapshots are tiny.
 */
export function moveOp(app, before, after) {
  return {
    undo() { app.model.applyPieceState(before.pieces); app.afterHistory(); },
    redo() { app.model.applyPieceState(after.pieces); app.afterHistory(); },
  };
}
