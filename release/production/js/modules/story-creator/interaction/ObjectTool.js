/**
 * ObjectTool.js — select / move / resize / rotate any transformable page object
 * (text, image, shape, sticker). Extends engine ITool. Consumes pointer events
 * only while an object/handle is grabbed, so empty-space drags pan and two
 * fingers pinch-zoom (engine built-ins). Each finished manipulation is one undo.
 */
import { ITool } from '../../../engine/index.js';
import { TAU, dist } from '../util/geometry.js';
import { objChangeOp } from '../history/commands.js';

const HANDLE_HIT = 20;
const ROTATE_GAP = 30;

export default class ObjectTool extends ITool {
  constructor(app) { super('object'); this.app = app; this._active = new Set(); this._drag = null; }
  onActivate() { this.app.engine.viewport.canvas.style.cursor = 'default'; }
  _zoom() { return this.app.engine.camera.zoom; }

  onPointerDown(p) {
    this._active.add(p.id);
    if (this._active.size >= 2) { this._cancel(); return false; }
    const w = p.world;
    const sel = this.app.selected;
    if (sel) { const h = this._hitHandle(sel, w); if (h) { this._start(h, sel, w); return true; } }
    const hit = this.app.hitTopObject(w);
    if (hit) {
      this.app.select(hit);
      this._drag = { mode: 'move', obj: hit, before: this.app.objState(hit), off: { x: w.x - hit.x, y: w.y - hit.y } };
      return true;
    }
    this.app.deselect();
    return false;
  }

  onPointerMove(p) {
    if (this._active.size >= 2 || !this._drag) return false;
    const w = p.world, d = this._drag, obj = d.obj;
    if (d.mode === 'move') { obj.x = w.x - d.off.x; obj.y = w.y - d.off.y; }
    else if (d.mode === 'scale') { const cur = dist(obj.x, obj.y, w.x, w.y); obj.scale = Math.max(0.1, Math.min(8, d.startScale * (cur / d.startDist))); }
    else if (d.mode === 'rotate') {
      let a = Math.atan2(w.y - obj.y, w.x - obj.x) - d.startAngle;
      const step = Math.PI / 12;
      if (Math.abs(a % step) < 0.05 || Math.abs(a % step) > step - 0.05) a = Math.round(a / step) * step;
      obj.rotation = a;
    }
    this.app.engine.layers.active.markDirty();
    this.app.engine.invalidate();
    return true;
  }

  onPointerUp(p) {
    this._active.delete(p.id);
    if (!this._drag) return false;
    if (this._active.size >= 1) return true;
    const d = this._drag; this._drag = null;
    const after = this.app.objState(d.obj);
    if (JSON.stringify(after) !== JSON.stringify(d.before)) this.app.pushHistory(objChangeOp(this.app, d.obj, d.before, after));
    this.app.afterEdit(d.obj);
    return true;
  }

  cancel() { this._cancel(); }
  _cancel() { if (this._drag) { this.app.applyObjState(this._drag.obj, this._drag.before); this._drag = null; } this._active.clear(); }

  _box(obj) { return { hw: (obj.width * obj.scaleX) / 2, hh: (obj.height * obj.scaleY) / 2 }; }
  _local(obj, w) { const c = Math.cos(-obj.rotation), s = Math.sin(-obj.rotation); const dx = w.x - obj.x, dy = w.y - obj.y; return { x: dx * c - dy * s, y: dx * s + dy * c }; }
  _hitHandle(obj, w) {
    const { hw, hh } = this._box(obj); const l = this._local(obj, w); const r = HANDLE_HIT / this._zoom();
    if (Math.hypot(l.x, l.y - (-hh - ROTATE_GAP / this._zoom())) <= r) return 'rotate';
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) if (Math.hypot(l.x - sx * hw, l.y - sy * hh) <= r) return 'scale';
    return null;
  }
  _start(mode, obj, w) {
    if (mode === 'scale') this._drag = { mode, obj, before: this.app.objState(obj), startDist: dist(obj.x, obj.y, w.x, w.y) || 1, startScale: obj.scaleX };
    else this._drag = { mode, obj, before: this.app.objState(obj), startAngle: Math.atan2(w.y - obj.y, w.x - obj.x) - obj.rotation };
  }

  render(ctx) {
    const obj = this.app.selected; if (!obj) return;
    const z = this._zoom(); const { hw, hh } = this._box(obj); const hs = 8 / z;
    ctx.save();
    ctx.translate(obj.x, obj.y); ctx.rotate(obj.rotation);
    ctx.strokeStyle = '#5b6bff'; ctx.lineWidth = 2 / z; ctx.setLineDash([7 / z, 5 / z]);
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ctx.setLineDash([]);
    const ry = -hh - ROTATE_GAP / z;
    ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(0, ry); ctx.stroke();
    ctx.fillStyle = '#fff';
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.rect(sx * hw - hs, sy * hh - hs, hs * 2, hs * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, ry, hs, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
