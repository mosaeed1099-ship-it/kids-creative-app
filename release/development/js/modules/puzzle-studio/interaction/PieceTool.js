/**
 * PieceTool.js — drag jigsaw pieces (extends engine ITool). It consumes pointer
 * events only while a piece is grabbed, so dragging empty space pans the camera
 * and two fingers pinch-zoom (engine built-ins — no duplicated gesture logic).
 * On release it asks the model to snap; a completed drag is one undo step.
 */
import { ITool } from '../../../engine/index.js';

export default class PieceTool extends ITool {
  constructor(app) { super('piece'); this.app = app; this._active = new Set(); this._drag = null; }

  onActivate() { this.app.engine.viewport.canvas.style.cursor = 'grab'; }

  onPointerDown(p) {
    this._active.add(p.id);
    if (this._active.size >= 2) return false;      // let the camera pinch-zoom
    const hit = this.app.hitTopPiece(p.world);
    if (!hit) return false;                          // empty space → camera pan
    this.app.beforeState = this.app.model.serialize();
    this.app.model.raiseGroup(hit.groupId);
    this._drag = { id: hit.groupId, last: { x: p.world.x, y: p.world.y } };
    this.app.engine.viewport.canvas.style.cursor = 'grabbing';
    return true;
  }

  onPointerMove(p) {
    if (this._active.size >= 2 || !this._drag) return false;
    const m = this.app.model;
    m.moveGroupBy(this._drag.id, p.world.x - this._drag.last.x, p.world.y - this._drag.last.y);
    this._drag.last = { x: p.world.x, y: p.world.y };
    m.engine.layers.active.markDirty();
    m.engine.invalidate();
    return true;
  }

  onPointerUp(p) {
    this._active.delete(p.id);
    if (!this._drag) return false;
    if (this._active.size >= 1) return true;          // wait until all fingers up
    const drag = this._drag; this._drag = null;
    this.app.engine.viewport.canvas.style.cursor = 'grab';
    this.app.model.snap(drag.id);
    this.app.commitMove();
    return true;
  }

  cancel() { this._active.clear(); this._drag = null; }
}
