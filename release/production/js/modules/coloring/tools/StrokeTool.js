/**
 * StrokeTool — shared base for freehand tools (Brush, Pencil, Eraser).
 * Handles the pointer down/move/up lifecycle, records a single undo step per
 * stroke, and delegates the actual mark to PaintSurface. Subclasses only tune
 * size and whether they erase.
 */
import { ITool } from '../../../engine/index.js';

export default class StrokeTool extends ITool {
  constructor(id, app, { erase = false, sizeFactor = 1 } = {}) {
    super(id);
    this.app = app;
    this.erase = erase;
    this.sizeFactor = sizeFactor;
    this._drawing = false;
    this._last = null;
  }

  _size() { return Math.max(1, this.app.brushSize * this.sizeFactor); }
  _opts() { return { color: this.app.color, size: this._size(), erase: this.erase }; }

  onPointerDown(p) {
    this.app._before = this.app.surface.snapshot();
    const l = this.app.toLocalPixel(p.world);
    this._last = l;
    this._drawing = true;
    this.app.surface.dot(l.x, l.y, this._opts());
    this.app.engine.invalidate();
    return true;
  }

  onPointerMove(p) {
    if (!this._drawing) return false;
    const l = this.app.toLocalPixel(p.world);
    this.app.surface.stroke(this._last.x, this._last.y, l.x, l.y, this._opts());
    this._last = l;
    this.app.engine.invalidate();
    return true;
  }

  onPointerUp() {
    if (!this._drawing) return false;
    this._drawing = false;
    this.app.commitFrom(this.app._before, this.id);
    return true;
  }

  onDeactivate() { this._drawing = false; }
}
