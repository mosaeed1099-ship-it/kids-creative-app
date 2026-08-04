/**
 * NavigationController.js — canvas navigation: wheel/trackpad zoom, two-finger
 * pinch-zoom + twist-rotate + pan, and button helpers (zoom in/out, rotate,
 * reset view, fit). It listens to the engine's PUBLIC pointer/wheel events and
 * drives the engine camera + the module ViewTransform — the engine's own camera
 * gestures are disabled so rotation stays consistent.
 *
 * When a second finger lands mid-stroke it cancels the active stroke so a
 * two-finger gesture never leaves a stray mark.
 */
export default class NavigationController {
  constructor(app) {
    this.app = app;
    this.engine = app.engine;
    this.coords = app.engine.coords;
    this.camera = app.engine.camera;
    this._pointers = new Map(); // id → {x,y} client
    this._g = null;             // gesture snapshot
    this._disposers = [];
    this._bind();
  }

  _on(evt, fn) {
    this.engine.events.on(evt, fn);
    this._disposers.push(() => this.engine.events.off?.(evt, fn));
  }

  _bind() {
    this._on('pointerdown', (p) => {
      this._pointers.set(p.id, { x: p.native.clientX, y: p.native.clientY });
      if (this._pointers.size === 2) {
        this.app.cancelStroke();       // abort any single-finger stroke
        this._g = this._snapshot();
      }
    });
    this._on('pointermove', (p) => {
      if (!this._pointers.has(p.id)) return;
      this._pointers.set(p.id, { x: p.native.clientX, y: p.native.clientY });
      if (this._pointers.size >= 2 && this._g) this._pinch();
    });
    const end = (p) => {
      this._pointers.delete(p.id);
      this._g = this._pointers.size >= 2 ? this._snapshot() : null;
    };
    this._on('pointerup', end);
    this._on('pointercancel', end);
    this._on('wheel', ({ screen, native }) => {
      this.app._autoFit = false;
      if (native?.ctrlKey) { this.app.view.rotateBy((native.deltaY > 0 ? 1 : -1) * (Math.PI / 36)); return; }
      const factor = Math.pow(0.999, native ? native.deltaY : 0);
      this.camera.zoomAt(screen, factor, this.coords);
      this.engine.invalidate();
    });
  }

  _snapshot() {
    const [a, b] = [...this._pointers.values()];
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      ang: Math.atan2(b.y - a.y, b.x - a.x),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  }

  _pinch() {
    this.app._autoFit = false;
    const now = this._snapshot();
    const g = this._g;
    // zoom about the gesture midpoint
    if (g.dist > 0 && now.dist > 0) {
      const midScreen = this.coords.clientToScreen(now.mid.x, now.mid.y);
      this.camera.zoomAt(midScreen, now.dist / g.dist, this.coords);
    }
    // twist → rotate the canvas
    let dA = now.ang - g.ang;
    if (dA > Math.PI) dA -= Math.PI * 2; else if (dA < -Math.PI) dA += Math.PI * 2;
    if (Math.abs(dA) > 0.002) this.app.view.rotation += dA;
    // pan by midpoint travel
    this.camera.panBy(now.mid.x - g.mid.x, now.mid.y - g.mid.y);
    this._g = now;
    this.app.doc.syncScene();
  }

  // ---- button helpers ----
  _centerScreen() { return { x: this.engine.viewport.width / 2, y: this.engine.viewport.height / 2 }; }
  zoomIn() { this.app._autoFit = false; this.camera.zoomAt(this._centerScreen(), 1.2, this.coords); this.engine.invalidate(); }
  zoomOut() { this.app._autoFit = false; this.camera.zoomAt(this._centerScreen(), 1 / 1.2, this.coords); this.engine.invalidate(); }
  rotateLeft() { this.app._autoFit = false; this.app.view.rotateBy(-Math.PI / 12); }
  rotateRight() { this.app._autoFit = false; this.app.view.rotateBy(Math.PI / 12); }
  resetView() { this.app.view.rotation = 0; this.app.fitPage(); }
  get zoomPercent() { return Math.round(this.camera.zoom * 100); }

  destroy() { this._disposers.splice(0).forEach((d) => d()); this._pointers.clear(); }
}
