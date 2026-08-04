/**
 * commands.js — undo/redo ops for page-object edits. All keep live object
 * references (no async rebuild): transform/style/text/crop changes swap a small
 * state snapshot; add/delete swap presence; reorder swaps z; draw adds/removes a
 * vector mark and repaints. Cheap and reliable.
 */

/** Any transform / style / text / crop change (before/after object state). */
export function objChangeOp(app, obj, before, after) {
  return {
    undo() { app.applyObjState(obj, before); app.select(obj); app.afterEdit(obj); },
    redo() { app.applyObjState(obj, after); app.select(obj); app.afterEdit(obj); },
  };
}

export function addObjOp(app, obj) {
  return {
    undo() { app.removeObject(obj); app.afterEdit(); },
    redo() { app.addObject(obj); app.select(obj); app.afterEdit(); },
  };
}

export function deleteObjOp(app, obj) {
  return {
    undo() { app.addObject(obj); app.select(obj); app.afterEdit(); },
    redo() { app.removeObject(obj); app.afterEdit(); },
  };
}

export function reorderOp(app, before, after) {
  const apply = (snap) => { snap.forEach((e) => { e.obj.zIndex = e.z; }); app.afterEdit(); };
  return { undo() { apply(before); }, redo() { apply(after); } };
}

export function drawStrokeOp(app, drawObj, mark) {
  return {
    undo() { const i = drawObj.layer.marks.indexOf(mark); if (i >= 0) drawObj.layer.marks.splice(i, 1); drawObj.layer.repaint(); app.afterEdit(); },
    redo() { if (!drawObj.layer.marks.includes(mark)) drawObj.layer.marks.push(mark); drawObj.layer.repaint(); app.afterEdit(); },
  };
}
