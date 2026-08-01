/**
 * ViewTransform.js — the ONE place that maps a pointer's client coordinates to
 * document coordinates, accounting for camera pan/zoom (via the engine's public
 * CoordinateSystem) AND the module-level canvas rotation the engine doesn't know
 * about. The same rotation is applied to rendering via each SceneObject's
 * `rotation`, so input and pixels always agree.
 */
export default class ViewTransform {
  constructor(app) {
    this.app = app;
    this.rotation = 0; // radians
  }

  get coords() { return this.app.engine.coords; }

  /** client (event.clientX/Y) → document-space point {x,y}. */
  clientToDoc(clientX, clientY) {
    const s = this.coords.clientToScreen(clientX, clientY);
    const w = this.coords.screenToWorld(s.x, s.y);
    return this._unrotate(w.x, w.y);
  }

  /** document point → screen (CSS px) accounting for rotation. */
  docToScreen(dx, dy) {
    const r = this._rotate(dx, dy);
    return this.coords.worldToScreen(r.x, r.y);
  }

  _center() { return { x: this.app.doc.w / 2, y: this.app.doc.h / 2 }; }

  _rotate(x, y) {
    const c = this._center();
    const cos = Math.cos(this.rotation), sin = Math.sin(this.rotation);
    const dx = x - c.x, dy = y - c.y;
    return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
  }

  _unrotate(x, y) {
    const c = this._center();
    const cos = Math.cos(-this.rotation), sin = Math.sin(-this.rotation);
    const dx = x - c.x, dy = y - c.y;
    return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
  }

  setRotation(rad) { this.rotation = rad; this.app.doc.syncScene(); }
  rotateBy(rad) { this.setRotation(this.rotation + rad); }
  reset() { this.setRotation(0); }
}
