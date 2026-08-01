/**
 * commands.js — factory functions building undo/redo ops for MarkHistory.
 * Each returns { label, emoji, undo(), redo() }. Vector ops (mark/shape/layer)
 * are cheap; pixel ops (selection/transform) snapshot the affected layer bitmap.
 */
import { getProfile } from '../brushes/brushProfiles.js';

/** Add a freehand/shape mark to a layer. */
export function addMarkOp(app, layer, mark) {
  const label = mark.kind === 'stroke' ? getProfile(mark.profileId).label : 'شكل';
  const emoji = mark.kind === 'stroke' ? getProfile(mark.profileId).emoji : '⬛';
  return {
    label, emoji,
    undo() { layer.removeMark(mark); layer.repaint(); app.onSceneChanged(); },
    redo() { layer.addMark(mark); app.onSceneChanged(); },
  };
}

/** Clear all pixels/marks of a layer. */
export function clearLayerOp(app, layer) {
  const prev = layer.marks.slice();
  return {
    label: 'مسح الطبقة', emoji: '🧹',
    redo() { layer.clearMarks(); app.onSceneChanged(); },
    undo() { layer.marks = prev.slice(); layer.repaint(); app.onSceneChanged(); },
  };
}

/** Add a new (empty) layer. */
export function addLayerOp(app, layer, at) {
  return {
    label: 'طبقة جديدة', emoji: '➕',
    undo() { app.doc.removeLayer(layer); app.onSceneChanged(); },
    redo() { app.doc.reinsertLayer(layer, at); app.onSceneChanged(); },
  };
}

/** Delete a layer (undo restores it at its old position). */
export function deleteLayerOp(app, layer, at) {
  return {
    label: 'حذف طبقة', emoji: '🗑️',
    undo() { app.doc.reinsertLayer(layer, at); app.onSceneChanged(); },
    redo() { app.doc.removeLayer(layer); app.onSceneChanged(); },
  };
}

/** Reorder a layer from → to. */
export function reorderLayerOp(app, from, to) {
  return {
    label: 'ترتيب الطبقات', emoji: '↕️',
    undo() { app.doc.reorder(to, from); app.onSceneChanged(); },
    redo() { app.doc.reorder(from, to); app.onSceneChanged(); },
  };
}

/**
 * Generic pixel op: swap a layer between two full snapshots (base+marks+bitmap).
 * Used by selection move/resize/rotate/flip/delete commits.
 */
export function bitmapOp(app, layer, before, after, label = 'تعديل', emoji = '🔧') {
  return {
    label, emoji,
    undo() { layer.restore(before); app.onSceneChanged(); },
    redo() { layer.restore(after); app.onSceneChanged(); },
  };
}

export default {
  addMarkOp, clearLayerOp, addLayerOp, deleteLayerOp, reorderLayerOp, bitmapOp,
};
