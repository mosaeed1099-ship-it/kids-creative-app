/**
 * MoveReferenceTool — drag to move the reference image (when it is not locked).
 * A Canvas-Engine ITool that consumes pointer events so it doesn't pan the view.
 */
import { ITool } from '../../../engine/index.js';

export default class MoveReferenceTool extends ITool {
  constructor(app) { super('move-ref'); this.app = app; this._last = null; }

  onPointerDown(p) {
    if (this.app.reference.locked) return false; // let the camera pan instead
    this._last = { x: p.world.x, y: p.world.y };
    return true;
  }

  onPointerMove(p) {
    if (!this._last || this.app.reference.locked) return false;
    this.app.reference.x += p.world.x - this._last.x;
    this.app.reference.y += p.world.y - this._last.y;
    this._last = { x: p.world.x, y: p.world.y };
    this.app.engine.invalidate();
    return true;
  }

  onPointerUp() { this._last = null; return false; }
  onDeactivate() { this._last = null; }
}
