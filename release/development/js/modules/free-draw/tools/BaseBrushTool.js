/**
 * BaseBrushTool.js — shared stroke lifecycle for every freehand tool. The seven
 * concrete tools (pencil, brush, marker, crayon, calligraphy, airbrush, eraser)
 * only pick a brush profile; ALL drawing behaviour lives here + strokeRenderer,
 * so there is zero duplicated logic between tools.
 *
 * It consumes only engine public API (extends ITool). Pen pressure and
 * coalesced pointer samples are used when available for smooth, natural lines.
 */
import { ITool } from '../../../engine/index.js';

export default class BaseBrushTool extends ITool {
  constructor(app, id, profileId) {
    super(id);
    this.app = app;
    this.profileId = profileId;
    this._pid = null; // the pointer id that owns the current stroke
  }

  onActivate() {
    const c = this.app.engine.viewport.canvas;
    c.style.cursor = 'crosshair';
  }

  onPointerDown(p) {
    if (this._pid !== null) return true;         // ignore extra fingers
    if (!this.app.canDrawOnActive()) { this.app.warnLocked(); return true; }
    this._pid = p.id;
    const d = this.app.view.clientToDoc(p.native.clientX, p.native.clientY);
    this.app.beginStroke(this.profileId, { x: d.x, y: d.y, p: this.app.pressureFor(p) }, p.pointerType);
    return true;
  }

  onPointerMove(p) {
    if (this._pid !== p.id) return false;
    this.app.extendStroke(this._samples(p), p.pointerType);
    return true;
  }

  onPointerUp(p) {
    if (this._pid !== p.id) return this._pid !== null;
    this._pid = null;
    this.app.endStroke();
    return true;
  }

  /** Called by the app when a gesture/second finger aborts the stroke. */
  cancel() { this._pid = null; }

  /** Extract one or many (coalesced) points from a move event. */
  _samples(p) {
    const ev = p.native;
    const raw = (typeof ev.getCoalescedEvents === 'function' && ev.getCoalescedEvents().length)
      ? ev.getCoalescedEvents() : [ev];
    return raw.map((e) => {
      const d = this.app.view.clientToDoc(e.clientX, e.clientY);
      return { x: d.x, y: d.y, p: this.app.pressureForEvent(e, p.pointerType) };
    });
  }
}
