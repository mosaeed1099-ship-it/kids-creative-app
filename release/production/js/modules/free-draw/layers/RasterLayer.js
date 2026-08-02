/**
 * RasterLayer.js — one drawing layer backed by an offscreen canvas at document
 * resolution, plus the ordered vector `marks` that produced it.
 *
 * Keeping BOTH the bitmap (fast to blit → 60fps regardless of stroke count) and
 * the vector marks (tiny memory → truly unlimited undo by replay) is the core
 * performance decision of the studio.
 */
import { paintStroke, compositeScratch, releaseSprite } from '../brushes/strokeRenderer.js';
import { paintShape } from '../shapes/shapeGeometry.js';

let _seq = 0;

export default class RasterLayer {
  constructor({ w, h, name = null, id = null } = {}) {
    this.id = id || `L${Date.now().toString(36)}${(_seq++).toString(36)}`;
    this.name = name || `طبقة ${_seq}`;
    this.w = w;
    this.h = h;
    this.visible = true;
    this.locked = false;
    this.opacity = 1;
    /** @type {object[]} ordered marks (paint order) */
    this.marks = [];
    /**
     * Optional "baked" bitmap drawn beneath the vector marks. Pixel-level edits
     * (selection move/flip/rotate) bake the current result here and reset marks,
     * so repaint() stays correct while vector strokes keep unlimited undo.
     */
    this.base = null;

    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');
  }

  /** Paint one mark onto this layer (incremental commit). */
  paintMark(mark, scratchCanvas = null) {
    if (mark.kind === 'shape') { paintShape(this.ctx, mark); return; }
    // stroke: needs a fully-stamped scratch, then a single composite
    if (scratchCanvas) { compositeScratch(this.ctx, scratchCanvas, mark); return; }
    // no scratch supplied → stamp into a private temp (used by repaint)
    const tmp = this._scratch(scratchCanvas);
    tmp.ctx.setTransform(1, 0, 0, 1, 0, 0);
    tmp.ctx.clearRect(0, 0, this.w, this.h);
    tmp.ctx.globalCompositeOperation = 'source-over';
    paintStroke(tmp.ctx, mark);
    compositeScratch(this.ctx, tmp.canvas, mark);
  }

  _scratch() {
    if (!this._tmp) {
      const c = document.createElement('canvas');
      c.width = this.w; c.height = this.h;
      this._tmp = { canvas: c, ctx: c.getContext('2d') };
    }
    return this._tmp;
  }

  /** Rebuild the bitmap from the baked base + all marks (used on undo/redo). */
  repaint() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.w, this.h);
    if (this.base) this.ctx.drawImage(this.base, 0, 0);
    for (const mark of this.marks) this.paintMark(mark);
  }

  /** Bake the current bitmap into `base` and clear the vector marks. */
  bake() {
    this.base = cloneCanvas(this.canvas);
    this.marks.forEach((m) => m.kind === 'stroke' && releaseSprite(m));
    this.marks = [];
  }

  /** Full snapshot for pixel-level undo (base + marks + bitmap). */
  snapshot() {
    return {
      base: this.base ? cloneCanvas(this.base) : null,
      marks: this.marks.slice(),
      bitmap: cloneCanvas(this.canvas),
    };
  }

  /** Restore a snapshot produced by snapshot(). */
  restore(snap) {
    this.base = snap.base ? cloneCanvas(snap.base) : null;
    this.marks = snap.marks.slice();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.ctx.drawImage(snap.bitmap, 0, 0);
  }

  addMark(mark, scratchCanvas = null) {
    this.marks.push(mark);
    this.paintMark(mark, scratchCanvas);
  }

  removeMark(mark) {
    const i = this.marks.indexOf(mark);
    if (i >= 0) { this.marks.splice(i, 1); if (mark.kind === 'stroke') releaseSprite(mark); }
    return i;
  }

  clearMarks() {
    this.marks.forEach((m) => m.kind === 'stroke' && releaseSprite(m));
    this.marks.length = 0;
    this.base = null;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  isEmpty() { return this.marks.length === 0; }

  /** Free GPU/CPU memory held by this layer. */
  destroy() {
    this.clearMarks();
    this.canvas.width = this.canvas.height = 0;
    if (this._tmp) { this._tmp.canvas.width = this._tmp.canvas.height = 0; this._tmp = null; }
  }

  serialize() {
    return {
      id: this.id, name: this.name, visible: this.visible,
      locked: this.locked, opacity: this.opacity, marks: this.marks,
      base: this.base ? this.base.toDataURL('image/png') : null,
    };
  }
}

/** Copy a canvas into a fresh one (deep pixel copy). */
export function cloneCanvas(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}
