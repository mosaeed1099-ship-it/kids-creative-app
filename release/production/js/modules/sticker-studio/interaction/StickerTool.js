/**
 * StickerTool.js — the single interaction tool (extends engine ITool):
 *   • tap a sticker to select it; tap empty space to deselect
 *   • drag a sticker to move it (with alignment snapping + guides)
 *   • drag a corner handle to resize (uniform), the top handle to rotate
 * It consumes pointer events only while touching a sticker/handle, so dragging
 * empty space pans the camera and two fingers pinch-zoom (engine built-ins).
 * Every finished manipulation is recorded as one undo step.
 */
import { ITool } from '../../../engine/index.js';
import { TAU, dist } from '../util/geometry.js';
import { snapshotTransform, transformOp } from '../history/commands.js';

const HANDLE_HIT = 20;   // screen px
const ROTATE_GAP = 30;   // screen px above the box

export default class StickerTool extends ITool {
  constructor(app) {
    super('sticker');
    this.app = app;
    this._active = new Set();   // active pointer ids (for multi-touch cooperation)
    this._drag = null;          // { mode, obj, before, ... }
    this.guides = [];
  }

  onActivate() { this.app.engine.viewport.canvas.style.cursor = 'default'; }

  _zoom() { return this.app.engine.camera.zoom; }

  onPointerDown(p) {
    this._active.add(p.id);
    if (this._active.size >= 2) { this._cancelDrag(); return false; } // let pinch happen

    const w = p.world;
    const sel = this.app.selected;
    if (sel) {
      const handle = this._hitHandle(sel, w);
      if (handle) { this._startHandle(handle, sel, w); return true; }
    }
    const hit = this.app.hitTopSticker(w);
    if (hit) {
      this.app.select(hit);
      this._drag = { mode: 'move', obj: hit, before: snapshotTransform(hit), off: { x: w.x - hit.x, y: w.y - hit.y } };
      return true;
    }
    this.app.deselect();
    return false; // empty space → allow camera pan
  }

  onPointerMove(p) {
    if (this._active.size >= 2 || !this._drag) return false;
    const w = p.world, d = this._drag, obj = d.obj;
    if (d.mode === 'move') {
      const r = this.app.snap.snap(obj, w.x - d.off.x, w.y - d.off.y);
      obj.x = r.x; obj.y = r.y; this.guides = r.guides;
    } else if (d.mode === 'scale') {
      const cur = dist(obj.x, obj.y, w.x, w.y);
      obj.scale = Math.max(0.15, Math.min(6, d.startScale * (cur / d.startDist)));
    } else if (d.mode === 'rotate') {
      let a = Math.atan2(w.y - obj.y, w.x - obj.x) - d.startAngle;
      const step = Math.PI / 12;
      if (Math.abs(a % step) < 0.06 || Math.abs(a % step) > step - 0.06) a = Math.round(a / step) * step;
      obj.rotation = a;
    }
    this.app.refreshSceneLight();
    return true;
  }

  onPointerUp(p) {
    this._active.delete(p.id);
    const wasDragging = !!this._drag;
    if (this._drag) {
      const { obj, before, mode } = this._drag;
      const after = snapshotTransform(obj);
      if (TKEYSChanged(before, after)) {
        const meta = { move: ['تحريك', '✋'], scale: ['تغيير الحجم', '↔️'], rotate: ['تدوير', '🔄'] }[mode];
        this.app.pushHistory(transformOp(this.app, obj, before, after, meta[0], meta[1]));
      }
    }
    this._drag = null;
    this.guides = [];
    if (wasDragging) this.app.refreshScene(); else this.app.refreshSceneLight();
    return wasDragging;
  }

  cancel() { this._cancelDrag(); this._active.clear(); }
  _cancelDrag() {
    if (this._drag) { const { obj, before } = this._drag; for (const k in before) obj[k] = before[k]; }
    this._drag = null; this.guides = [];
  }

  // ---- handles ----
  _boxLocal(obj) {
    return { hw: (obj.width * obj.scaleX) / 2, hh: (obj.height * obj.scaleY) / 2 };
  }
  _toLocal(obj, w) {
    const c = Math.cos(-obj.rotation), s = Math.sin(-obj.rotation);
    const dx = w.x - obj.x, dy = w.y - obj.y;
    return { x: dx * c - dy * s, y: dx * s + dy * c };
  }
  _hitHandle(obj, w) {
    const { hw, hh } = this._boxLocal(obj);
    const l = this._toLocal(obj, w);
    const r = HANDLE_HIT / this._zoom();
    if (Math.hypot(l.x, l.y - (-hh - ROTATE_GAP / this._zoom())) <= r) return 'rotate';
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      if (Math.hypot(l.x - sx * hw, l.y - sy * hh) <= r) return 'scale';
    }
    return null;
  }
  _startHandle(mode, obj, w) {
    if (mode === 'scale') {
      this._drag = { mode, obj, before: snapshotTransform(obj), startDist: dist(obj.x, obj.y, w.x, w.y) || 1, startScale: obj.scaleX };
    } else {
      this._drag = { mode, obj, before: snapshotTransform(obj), startAngle: Math.atan2(w.y - obj.y, w.x - obj.x) - obj.rotation };
    }
  }

  // ---- overlay (selection box, handles, snap guides) ----
  render(ctx) {
    const z = this._zoom();
    if (this.guides.length) {
      ctx.save();
      ctx.strokeStyle = '#ff2d92';
      ctx.lineWidth = 1.5 / z;
      ctx.setLineDash([8 / z, 6 / z]);
      for (const g of this.guides) {
        ctx.beginPath();
        if (g.axis === 'v') { ctx.moveTo(g.pos, -4000); ctx.lineTo(g.pos, this.app.pageH + 4000); }
        else { ctx.moveTo(-4000, g.pos); ctx.lineTo(this.app.pageW + 4000, g.pos); }
        ctx.stroke();
      }
      ctx.restore();
    }
    const obj = this.app.selected;
    if (!obj) return;
    const { hw, hh } = this._boxLocal(obj);
    const hs = 8 / z;
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.rotation);
    ctx.strokeStyle = '#5b6bff';
    ctx.lineWidth = 2 / z;
    ctx.setLineDash([7 / z, 5 / z]);
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ctx.setLineDash([]);
    const ry = -hh - ROTATE_GAP / z;
    ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(0, ry); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath(); ctx.rect(sx * hw - hs, sy * hh - hs, hs * 2, hs * 2); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, ry, hs, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

function TKEYSChanged(a, b) {
  return a.x !== b.x || a.y !== b.y || a.scale !== b.scale || a.rotation !== b.rotation || a.flipH !== b.flipH || a.flipV !== b.flipV;
}
