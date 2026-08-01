/**
 * commands.js — undo/redo ops for sticker actions. Each returns
 * { label, emoji, undo(), redo() }. All are cheap (object references + a few
 * numbers), so undo history stays light even with hundreds of steps.
 */

const TKEYS = ['x', 'y', 'scale', 'rotation', 'flipH', 'flipV'];
export function snapshotTransform(obj) {
  const t = {}; for (const k of TKEYS) t[k] = obj[k]; return t;
}
function applyTransform(app, obj, t) {
  for (const k of TKEYS) obj[k] = t[k];
  app.refreshScene();
}

/** Add a sticker to the scene. */
export function addStickerOp(app, obj) {
  return {
    label: 'إضافة ملصق', emoji: '➕',
    undo() { app.removeObjectFromScene(obj); app.refreshScene(); },
    redo() { app.addObjectToScene(obj); app.refreshScene(); },
  };
}

/** Delete a sticker. */
export function deleteStickerOp(app, obj) {
  return {
    label: 'حذف ملصق', emoji: '🗑️',
    undo() { app.addObjectToScene(obj); app.select(obj); app.refreshScene(); },
    redo() { app.removeObjectFromScene(obj); app.refreshScene(); },
  };
}

/** Move / resize / rotate / flip a sticker (before → after transforms). */
export function transformOp(app, obj, before, after, label = 'تعديل', emoji = '🎯') {
  return {
    label, emoji,
    undo() { applyTransform(app, obj, before); app.select(obj); },
    redo() { applyTransform(app, obj, after); app.select(obj); },
  };
}

/** Reorder (bring forward/back/front/back) — snapshots the whole z-order. */
export function reorderOp(app, before, after) {
  const apply = (snap) => { snap.forEach((e) => { e.obj.zIndex = e.z; }); app.refreshScene(); };
  return { label: 'ترتيب الطبقات', emoji: '↕️', undo() { apply(before); }, redo() { apply(after); } };
}
