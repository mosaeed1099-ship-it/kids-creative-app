/**
 * HandTool.js — pan the canvas by dragging with one finger/mouse. (Two-finger
 * pan/zoom/rotate always works via NavigationController regardless of tool.)
 */
import { ITool } from '../../../engine/index.js';

export default class HandTool extends ITool {
  constructor(app) { super('hand'); this.app = app; this._pid = null; this._last = null; }

  onActivate() { this.app.engine.viewport.canvas.style.cursor = 'grab'; }

  onPointerDown(p) {
    if (this._pid !== null) return true;
    this._pid = p.id;
    this._last = { x: p.native.clientX, y: p.native.clientY };
    this.app.engine.viewport.canvas.style.cursor = 'grabbing';
    return true;
  }

  onPointerMove(p) {
    if (this._pid !== p.id) return false;
    const dx = p.native.clientX - this._last.x;
    const dy = p.native.clientY - this._last.y;
    this._last = { x: p.native.clientX, y: p.native.clientY };
    this.app.engine.camera.panBy(dx, dy);
    this.app.engine.invalidate();
    return true;
  }

  onPointerUp(p) {
    if (this._pid === p.id) { this._pid = null; this.app.engine.viewport.canvas.style.cursor = 'grab'; }
    return true;
  }

  cancel() { this._pid = null; }
}
