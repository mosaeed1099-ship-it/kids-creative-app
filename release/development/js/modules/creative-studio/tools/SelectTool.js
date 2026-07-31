/**
 * SelectTool — the core interaction tool. Tap to select a part; drag its body
 * to MOVE; drag the green top knob to ROTATE; drag the orange corner knob to
 * SCALE. Records one undo step per gesture. Consumes pointer events so the view
 * doesn't pan (use the dedicated Pan tool for panning).
 */
import { ITool } from '../../../engine/index.js';

export default class SelectTool extends ITool {
  constructor(app) { super('select'); this.app = app; this._mode = null; this._target = null; this._before = null; }

  _dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  onPointerDown(p) {
    const engine = this.app.engine;
    const sel = engine.selection.items[0];
    const z = engine.camera.zoom;

    if (sel) {
      const H = sel.handles(z);
      const hr = 20 / z;
      if (this._dist(p.world, H.rotate) < hr) return this._begin('rotate', sel, p);
      if (this._dist(p.world, H.scale) < hr) return this._begin('scale', sel, p);
    }

    const hit = this.app.scene.hitTest(p.world);
    if (hit) {
      engine.selection.select(hit);
      const r = this._begin('move', hit, p);
      this._grab = { x: p.world.x - hit.x, y: p.world.y - hit.y };
      return r;
    }
    engine.selection.clear();
    return true;
  }

  _begin(mode, target, p) {
    this._mode = mode;
    this._target = target;
    this._before = this.app.scene.snapshot();
    this._startPointer = { ...p.world };
    this._startRotation = target.rotation;
    this._startScale = target.scale;
    this._startAngle = Math.atan2(p.world.y - target.y, p.world.x - target.x);
    this._startDist = this._dist(p.world, { x: target.x, y: target.y }) || 1;
    return true;
  }

  onPointerMove(p) {
    if (!this._mode || !this._target) return false;
    const t = this._target;
    if (this._mode === 'move') {
      t.x = p.world.x - this._grab.x;
      t.y = p.world.y - this._grab.y;
    } else if (this._mode === 'rotate') {
      const a = Math.atan2(p.world.y - t.y, p.world.x - t.x);
      t.rotation = this._startRotation + (a - this._startAngle);
    } else if (this._mode === 'scale') {
      const d = this._dist(p.world, { x: t.x, y: t.y });
      t.scale = Math.max(0.2, Math.min(6, this._startScale * (d / this._startDist)));
    }
    this.app.engine.invalidate();
    return true;
  }

  onPointerUp() {
    if (this._mode && this._target) this.app.commit(this._before, this._mode);
    this._mode = null; this._target = null; this._before = null;
    return true;
  }

  onDeactivate() { this._mode = null; this._target = null; }
}
