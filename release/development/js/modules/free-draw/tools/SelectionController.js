/**
 * SelectionController.js — rectangle & lasso selection with a floating
 * transform (move / scale / rotate / flip / delete). Selected pixels are lifted
 * off the active layer into a floating buffer; the change is committed by baking
 * the layer and recording a pixel snapshot op (undoable like everything else).
 *
 * All geometry is in document space, so it stays correct under canvas rotation.
 */
import { TAU, rectFromPoints, polygonBounds, clamp } from '../util/geometry.js';
import { bitmapOp } from '../history/commands.js';
import { cloneCanvas } from '../layers/RasterLayer.js';

const MIN = 6;

export default class SelectionController {
  constructor(app) {
    this.app = app;
    this.mode = 'rect';     // 'rect' | 'lasso'
    this.phase = 'idle';    // 'idle' | 'marquee' | 'floating'
    this.marquee = null;    // {a,b} for rect, or [{x,y}] for lasso
    this.float = null;
    this.drag = null;
  }

  setMode(m) { this.commitIfFloating(); this.mode = m; }
  get hasFloating() { return this.phase === 'floating' && !!this.float; }
  _zoom() { return this.app.engine.camera.zoom; }

  // ---- pointer lifecycle (driven by SelectTool) ----
  begin(pt) {
    if (this.phase === 'floating') {
      const hit = this._hitFloating(pt);
      if (hit) { this._startDrag(hit, pt); return; }
      this.commit(); // clicked outside → drop selection, start a new one
    }
    this.phase = 'marquee';
    this.marquee = this.mode === 'rect' ? { a: pt, b: pt } : [pt];
    this.app.engine.invalidate();
  }

  move(pt) {
    if (this.phase === 'marquee') {
      if (this.mode === 'rect') this.marquee.b = pt;
      else this.marquee.push(pt);
      this.app.engine.invalidate();
    } else if (this.drag) {
      this._applyDrag(pt);
    }
  }

  end() {
    if (this.phase === 'marquee') this._lift();
    else if (this.drag) this.drag = null;
  }

  cancelDrag() { this.drag = null; }

  // ---- lift selection into a floating buffer ----
  _lift() {
    const layer = this.app.doc.active;
    const rect = this._marqueeBounds();
    this.marquee = null;
    if (!layer || !rect || rect.w < MIN || rect.h < MIN) { this.phase = 'idle'; this.app.engine.invalidate(); return; }

    const w = Math.round(rect.w), h = Math.round(rect.h);
    const before = layer.snapshot();

    const fc = document.createElement('canvas');
    fc.width = w; fc.height = h;
    const fctx = fc.getContext('2d');
    if (this._lassoPoly) {
      fctx.save();
      fctx.beginPath();
      this._lassoPoly.forEach((p, i) => (i ? fctx.lineTo(p.x - rect.x, p.y - rect.y) : fctx.moveTo(p.x - rect.x, p.y - rect.y)));
      fctx.closePath(); fctx.clip();
    }
    fctx.drawImage(layer.canvas, rect.x, rect.y, w, h, 0, 0, w, h);
    if (this._lassoPoly) fctx.restore();

    // erase the lifted region from the source layer
    layer.ctx.save();
    if (this._lassoPoly) {
      layer.ctx.beginPath();
      this._lassoPoly.forEach((p, i) => (i ? layer.ctx.lineTo(p.x, p.y) : layer.ctx.moveTo(p.x, p.y)));
      layer.ctx.closePath(); layer.ctx.clip();
    }
    layer.ctx.globalCompositeOperation = 'destination-out';
    layer.ctx.fillStyle = '#000';
    layer.ctx.fillRect(rect.x, rect.y, w, h);
    layer.ctx.restore();
    this._lassoPoly = null;

    this.float = {
      canvas: fc, w, h, cx: rect.x + w / 2, cy: rect.y + h / 2,
      sx: 1, sy: 1, rot: 0, flipH: false, flipV: false, layer, before,
    };
    this.phase = 'floating';
    this.app.onSceneChanged();
    this.app.ui?.setSelectionActive(true);
  }

  _marqueeBounds() {
    if (!this.marquee) return null;
    const d = this.app.doc;
    let r;
    if (this.mode === 'rect') { r = rectFromPoints(this.marquee.a, this.marquee.b); this._lassoPoly = null; }
    else { this._lassoPoly = this.marquee.slice(); r = polygonBounds(this.marquee); }
    // clamp to page
    const x = clamp(r.x, 0, d.w), y = clamp(r.y, 0, d.h);
    return { x, y, w: clamp(r.x + r.w, 0, d.w) - x, h: clamp(r.y + r.h, 0, d.h) - y };
  }

  // ---- floating transforms ----
  flipH() { if (this.float) { this.float.flipH = !this.float.flipH; this.app.onSceneChanged(); } }
  flipV() { if (this.float) { this.float.flipV = !this.float.flipV; this.app.onSceneChanged(); } }
  rotate90() { if (this.float) { this.float.rot += Math.PI / 2; this.app.onSceneChanged(); } }

  deleteSelection() {
    if (!this.float) return;
    const { layer, before } = this.float;
    layer.bake();
    this.app.pushHistory(bitmapOp(this.app, layer, before, layer.snapshot(), 'حذف تحديد', '✂️'));
    this._clearFloat();
  }

  commit() {
    if (!this.float) return;
    const f = this.float;
    const ctx = f.layer.ctx;
    ctx.save();
    ctx.translate(f.cx, f.cy);
    ctx.rotate(f.rot);
    ctx.scale((f.flipH ? -1 : 1) * f.sx, (f.flipV ? -1 : 1) * f.sy);
    ctx.drawImage(f.canvas, -f.w / 2, -f.h / 2);
    ctx.restore();
    f.layer.bake();
    this.app.pushHistory(bitmapOp(this.app, f.layer, f.before, f.layer.snapshot(), 'تحديد', '⬚'));
    this._clearFloat();
  }

  commitIfFloating() { if (this.hasFloating) this.commit(); }

  cancel() {
    if (this.float) { this.float.layer.restore(this.float.before); this._clearFloat(); }
    else { this.phase = 'idle'; this.marquee = null; this.app.engine.invalidate(); }
  }

  _clearFloat() {
    this.float = null; this.drag = null; this.phase = 'idle';
    this.app.onSceneChanged();
    this.app.ui?.setSelectionActive(false);
  }

  // ---- handle hit-testing + dragging ----
  _toLocal(pt, f) {
    const cos = Math.cos(-f.rot), sin = Math.sin(-f.rot);
    const dx = pt.x - f.cx, dy = pt.y - f.cy;
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
  }

  _hitFloating(pt) {
    const f = this.float;
    const l = this._toLocal(pt, f);
    const hw = (f.w / 2) * f.sx, hh = (f.h / 2) * f.sy;
    const r = 18 / this._zoom();
    if (Math.hypot(l.x - 0, l.y - (-hh - 24 / this._zoom())) <= r) return 'rotate';
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      if (Math.hypot(l.x - sx * hw, l.y - sy * hh) <= r) return 'scale';
    }
    if (Math.abs(l.x) <= hw && Math.abs(l.y) <= hh) return 'move';
    return null;
  }

  _startDrag(kind, pt) {
    const f = this.float;
    this.drag = {
      kind, startDoc: pt,
      orig: { cx: f.cx, cy: f.cy, sx: f.sx, sy: f.sy, rot: f.rot,
        angle: Math.atan2(pt.y - f.cy, pt.x - f.cx) },
    };
  }

  _applyDrag(pt) {
    const f = this.float, d = this.drag;
    if (d.kind === 'move') {
      f.cx = d.orig.cx + (pt.x - d.startDoc.x);
      f.cy = d.orig.cy + (pt.y - d.startDoc.y);
    } else if (d.kind === 'scale') {
      const l = this._toLocal(pt, f);
      f.sx = Math.max(MIN / f.w, Math.abs(l.x) / (f.w / 2));
      f.sy = Math.max(MIN / f.h, Math.abs(l.y) / (f.h / 2));
    } else if (d.kind === 'rotate') {
      const ang = Math.atan2(pt.y - f.cy, pt.x - f.cx);
      f.rot = d.orig.rot + (ang - d.orig.angle);
    }
    this.app.engine.invalidate();
  }

  // ---- overlay rendering (called within the doc transform) ----
  render(ctx) {
    const zoom = this._zoom();
    if (this.phase === 'marquee' && this.marquee) {
      ctx.save();
      ctx.lineWidth = 2 / zoom;
      ctx.strokeStyle = '#5b6bff';
      ctx.setLineDash([9 / zoom, 6 / zoom]);
      ctx.beginPath();
      if (this.mode === 'rect') {
        const r = rectFromPoints(this.marquee.a, this.marquee.b);
        ctx.rect(r.x, r.y, r.w, r.h);
      } else {
        this.marquee.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      }
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (this.phase !== 'floating' || !this.float) return;
    const f = this.float;
    ctx.save();
    ctx.translate(f.cx, f.cy);
    ctx.rotate(f.rot);
    ctx.scale((f.flipH ? -1 : 1) * f.sx, (f.flipV ? -1 : 1) * f.sy);
    ctx.drawImage(f.canvas, -f.w / 2, -f.h / 2);
    ctx.restore();

    const hw = (f.w / 2) * f.sx, hh = (f.h / 2) * f.sy, hs = 8 / zoom;
    ctx.save();
    ctx.translate(f.cx, f.cy);
    ctx.rotate(f.rot);
    ctx.lineWidth = 2 / zoom;
    ctx.strokeStyle = '#5b6bff';
    ctx.setLineDash([8 / zoom, 6 / zoom]);
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath(); ctx.rect(sx * hw - hs, sy * hh - hs, hs * 2, hs * 2); ctx.fill(); ctx.stroke();
    }
    const ry = -hh - 24 / zoom;
    ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(0, ry); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, ry, hs, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
