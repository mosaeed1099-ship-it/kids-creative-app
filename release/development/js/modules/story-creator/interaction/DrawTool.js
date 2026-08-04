/**
 * DrawTool.js — freehand drawing on the current page's doodle layer. REUSES Free
 * Draw Studio's strokeRenderer + brush PROFILES (no duplicated drawing logic).
 * Active only in "draw" mode; two fingers still pinch-zoom.
 */
import { ITool } from '../../../engine/index.js';
import { strokeRenderer } from '../../free-draw/index.js';
import { uid } from '../util/geometry.js';
import { drawStrokeOp } from '../history/commands.js';

export default class DrawTool extends ITool {
  constructor(app) { super('draw'); this.app = app; this._active = new Set(); }
  onActivate() { this.app.engine.viewport.canvas.style.cursor = 'crosshair'; }

  onPointerDown(p) {
    this._active.add(p.id);
    if (this._active.size >= 2) { this._cancel(); return false; }
    const draw = this.app.drawObject;
    if (!draw) return false;
    const b = this.app.brush;
    const temp = this.app.drawTemp();
    const tctx = temp.getContext('2d');
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.clearRect(0, 0, temp.width, temp.height);
    tctx.globalCompositeOperation = 'source-over';
    const mark = { id: uid('m'), kind: 'stroke', profileId: b.profileId, color: b.color, size: b.size, opacity: b.opacity, hardness: 0.7, seed: (Math.random() * 1e9) >>> 0, points: [{ x: p.world.x, y: p.world.y, p: 0.6 }] };
    strokeRenderer.paintStroke(tctx, mark, 0);
    this.app.activeStroke = { layerObj: draw, mark, temp: { canvas: temp, ctx: tctx }, lastIdx: 1 };
    this.app.engine.invalidate();
    return true;
  }

  onPointerMove(p) {
    if (this._active.size >= 2 || !this.app.activeStroke) return false;
    const as = this.app.activeStroke;
    const ev = p.native;
    const raw = (typeof ev.getCoalescedEvents === 'function' && ev.getCoalescedEvents().length) ? ev.getCoalescedEvents() : [ev];
    for (const e of raw) {
      const w = this.app.engine.coords.clientToWorld(e.clientX, e.clientY);
      as.mark.points.push({ x: w.x, y: w.y, p: 0.6 });
    }
    strokeRenderer.paintStroke(as.temp.ctx, as.mark, as.lastIdx);
    as.lastIdx = as.mark.points.length;
    this.app.engine.invalidate();
    return true;
  }

  onPointerUp(p) {
    this._active.delete(p.id);
    const as = this.app.activeStroke;
    if (!as) return false;
    if (this._active.size >= 1) return true;
    strokeRenderer.compositeScratch(as.layerObj.layer.ctx, as.temp.canvas, as.mark);
    as.layerObj.layer.marks.push(as.mark);
    this.app.activeStroke = null;
    this.app.pushHistory(drawStrokeOp(this.app, as.layerObj, as.mark));
    this.app.afterEdit();
    this.app.engine.invalidate();
    return true;
  }

  cancel() { this._cancel(); }
  _cancel() { this._active.clear(); if (this.app.activeStroke) { this.app.activeStroke = null; this.app.engine.invalidate(); } }
}
