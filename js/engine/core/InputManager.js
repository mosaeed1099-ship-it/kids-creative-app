/**
 * InputManager — unifies mouse, touch and pen through Pointer Events and
 * exposes clean, world-aware input to tools, plugins and the camera.
 *
 * Emits on the engine bus (payloads carry both screen and world coords):
 *   'pointerdown' 'pointermove' 'pointerup' 'pointercancel' 'wheel'
 *
 * Built-in gestures (enabled via engine option `cameraControls`, and only
 * when the active tool does NOT consume the event by returning true):
 *   - one-pointer drag        → pan
 *   - two-pointer pinch       → zoom (+ pan by midpoint)
 *   - wheel / trackpad        → zoom to cursor
 */
export default class InputManager {
  constructor({ engine }) {
    this.engine = engine;
    this.canvas = engine.viewport.canvas;
    this.coords = engine.coords;
    this.events = engine.events;

    /** active pointers: id → { x, y } in screen space */
    this._pointers = new Map();
    this._panning = false;
    this._lastPan = null;
    this._pinch = null;

    this._bind();
  }

  _bind() {
    const c = this.canvas;
    this._onDown = (e) => this._down(e);
    this._onMove = (e) => this._move(e);
    this._onUp = (e) => this._up(e);
    this._onCancel = (e) => this._cancel(e);
    this._onWheel = (e) => this._wheel(e);

    c.addEventListener('pointerdown', this._onDown);
    c.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    c.addEventListener('pointercancel', this._onCancel);
    c.addEventListener('wheel', this._onWheel, { passive: false });
  }

  _mk(e) {
    const s = this.coords.clientToScreen(e.clientX, e.clientY);
    const w = this.coords.screenToWorld(s.x, s.y);
    return { id: e.pointerId, screen: s, world: w, button: e.button, pointerType: e.pointerType, native: e, };
  }

  /** Give the active tool first chance; return true if it consumed the event. */
  _toTool(method, payload) {
    const tool = this.engine.tools?.current;
    if (tool && typeof tool[method] === 'function') {
      return tool[method](payload, this.engine) === true;
    }
    return false;
  }

  _down(e) {
    this.canvas.setPointerCapture?.(e.pointerId);
    const p = this._mk(e);
    this._pointers.set(e.pointerId, p.screen);
    this.events.emit('pointerdown', p);

    const consumed = this._toTool('onPointerDown', p);
    if (consumed || !this.engine.options.cameraControls) return;

    if (this._pointers.size === 1) {
      this._panning = true;
      this._lastPan = { ...p.screen };
    } else if (this._pointers.size === 2) {
      this._panning = false;
      this._pinch = this._pinchState();
    }
  }

  _move(e) {
    const p = this._mk(e);
    if (this._pointers.has(e.pointerId)) this._pointers.set(e.pointerId, p.screen);
    this.events.emit('pointermove', p);

    const consumed = this._toTool('onPointerMove', p);
    if (consumed || !this.engine.options.cameraControls) return;

    if (this._pointers.size >= 2 && this._pinch) {
      this._doPinch();
    } else if (this._panning && this._lastPan) {
      const dx = p.screen.x - this._lastPan.x;
      const dy = p.screen.y - this._lastPan.y;
      this._lastPan = { ...p.screen };
      this.engine.camera.panBy(dx, dy);
      this.engine.invalidate();
    }
  }

  _up(e) {
    const p = this._pointers.has(e.pointerId) ? this._mk(e) : null;
    this._pointers.delete(e.pointerId);
    if (p) {
      this.events.emit('pointerup', p);
      this._toTool('onPointerUp', p);
    }
    if (this._pointers.size < 2) this._pinch = null;
    if (this._pointers.size === 0) { this._panning = false; this._lastPan = null; }
    else if (this._pointers.size === 1) {
      // resume single-pointer pan from the remaining finger
      const [only] = this._pointers.values();
      this._panning = true; this._lastPan = { ...only };
    }
  }

  _cancel(e) {
    this._pointers.delete(e.pointerId);
    this._pinch = null; this._panning = false; this._lastPan = null;
    this.events.emit('pointercancel', { id: e.pointerId, native: e });
  }

  _wheel(e) {
    e.preventDefault();
    const s = this.coords.clientToScreen(e.clientX, e.clientY);
    this.events.emit('wheel', { screen: s, deltaY: e.deltaY, native: e });
    if (this._toTool('onWheel', { screen: s, deltaY: e.deltaY }) || !this.engine.options.cameraControls) return;
    const factor = Math.pow(0.999, e.deltaY); // smooth zoom
    this.engine.camera.zoomAt(s, factor, this.coords);
    this.engine.invalidate();
  }

  _pinchState() {
    const pts = [...this._pointers.values()];
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return {
      dist: Math.hypot(dx, dy),
      mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
    };
  }

  _doPinch() {
    const now = this._pinchState();
    if (!this._pinch || now.dist === 0) { this._pinch = now; return; }
    const factor = now.dist / this._pinch.dist;
    this.engine.camera.zoomAt(now.mid, factor, this.coords);
    // pan by midpoint movement
    const dx = now.mid.x - this._pinch.mid.x;
    const dy = now.mid.y - this._pinch.mid.y;
    this.engine.camera.panBy(dx, dy);
    this._pinch = now;
    this.engine.invalidate();
  }

  destroy() {
    const c = this.canvas;
    c.removeEventListener('pointerdown', this._onDown);
    c.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    c.removeEventListener('pointercancel', this._onCancel);
    c.removeEventListener('wheel', this._onWheel);
    this._pointers.clear();
  }
}
