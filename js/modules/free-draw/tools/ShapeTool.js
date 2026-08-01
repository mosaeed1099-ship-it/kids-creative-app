/**
 * ShapeTool.js — draws the nine geometric shapes. Drag defines the bounding box
 * (or the two endpoints for line/arrow); a live preview follows the pointer and
 * the shape is committed to the active layer on release. Shape kind + fill come
 * from Settings; the outline colour is the current colour.
 */
import { ITool } from '../../../engine/index.js';
import { paintShape } from '../shapes/shapeGeometry.js';

export default class ShapeTool extends ITool {
  constructor(app) { super('shape'); this.app = app; this._active = false; }

  onActivate() { this.app.engine.viewport.canvas.style.cursor = 'crosshair'; }

  onPointerDown(p) {
    if (this._active) return true;
    if (!this.app.canDrawOnActive()) { this.app.warnLocked(); return true; }
    this._active = true;
    this.app.beginShape(this.app.view.clientToDoc(p.native.clientX, p.native.clientY));
    return true;
  }

  onPointerMove(p) {
    if (!this._active) return false;
    this.app.updateShape(this.app.view.clientToDoc(p.native.clientX, p.native.clientY), p.native.shiftKey);
    return true;
  }

  onPointerUp(p) {
    if (!this._active) return false;
    this._active = false;
    this.app.commitShape();
    return true;
  }

  cancel() { this._active = false; this.app.cancelShape(); }

  render(ctx) {
    const m = this.app.previewShape;
    if (!m) return;
    ctx.save();
    this.app.applyDocTransform(ctx);
    paintShape(ctx, m);
    ctx.restore();
  }
}
