/**
 * PuzzleModel.js — generates a jigsaw from a Content-Engine image and owns the
 * grid, pieces, groups, snapping and solve state. Pieces that fit together snap
 * into a shared group and move as one; a group dropped at its home locks in.
 * Consumes only engine public API (objects add/remove, invalidate, layer sort).
 */
import PieceObject from './PieceObject.js';
import BoardObject from './BoardObject.js';
import { generateEdgeSigns } from './jigsaw.js';
import { rasterizeSvg } from './image.js';
import { dist, clamp } from '../util/geometry.js';

const BOARD_W = 960;

export default class PuzzleModel {
  constructor(app) { this.app = app; this.pieces = []; this.hintPiece = null; this.board = null; }
  get engine() { return this.app.engine; }

  async generate(item, rows, cols) {
    this.teardown();
    this.item = item; this.rows = rows; this.cols = cols;
    this.boardW = BOARD_W; this.boardH = Math.round(BOARD_W * 3 / 4);
    this.cw = this.boardW / cols; this.ch = this.boardH / rows;
    this.rad = Math.min(this.cw, this.ch) * 0.2;
    this.pageW = this.boardW + 540; this.pageH = this.boardH + 480;
    this.boardX = (this.pageW - this.boardW) / 2;
    this.boardY = (this.pageH - this.boardH) / 2;
    this.edges = generateEdgeSigns(rows, cols);
    this.imageCanvas = await rasterizeSvg(item.asset.data, this.boardW, this.boardH);
    this.hitCtx = document.createElement('canvas').getContext('2d');

    this.board = new BoardObject(this);
    this.engine.objects.add(this.board);
    let idx = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const p = new PieceObject(this, r, c, idx++);
      this.pieces.push(p);
      this.engine.objects.add(p);
    }
    this.scatter();
    return this;
  }

  teardown() {
    if (this.board) this.engine.objects.remove(this.board);
    for (const p of this.pieces) this.engine.objects.remove(p);
    this.pieces = []; this.board = null; this.hintPiece = null;
  }

  scatter() {
    this.pieces.forEach((p, i) => {
      p.placed = false;
      p.groupId = i;
      p.zIndex = 10 + i;
      p.x = clamp(this.rad + Math.random() * (this.pageW - this.cw - 2 * this.rad), 0, this.pageW - this.cw);
      p.y = clamp(this.rad + Math.random() * (this.pageH - this.ch - 2 * this.rad), 0, this.pageH - this.ch);
    });
    this.engine.layers.active.markDirty();
    this.engine.invalidate();
  }

  // ---- queries ----
  pieceAt(r, c) { return (r < 0 || c < 0 || r >= this.rows || c >= this.cols) ? null : this.pieces[r * this.cols + c]; }
  groupPieces(id) { return this.pieces.filter((p) => p.groupId === id); }
  neighbors(p) { return [[p.r - 1, p.c], [p.r + 1, p.c], [p.r, p.c - 1], [p.r, p.c + 1]].map(([r, c]) => this.pieceAt(r, c)).filter(Boolean); }

  moveGroupBy(id, dx, dy) { for (const p of this.groupPieces(id)) { p.x += dx; p.y += dy; } }
  raiseGroup(id) { let z = 1000; for (const p of this.groupPieces(id)) p.zIndex = z++; this.engine.layers.active.markDirty(); }

  /** After a drag, snap to home or to a neighbouring group. Returns true if it moved. */
  snap(id) {
    const T = this.rad * 1.25;
    const grp = this.groupPieces(id);
    let best = null;
    for (const p of grp) {
      const dhx = p.homeX - p.x, dhy = p.homeY - p.y, dh = Math.hypot(dhx, dhy);
      if (dh < T && (!best || dh < best.d)) best = { dx: dhx, dy: dhy, d: dh, type: 'board' };
      for (const q of this.neighbors(p)) {
        if (q.groupId === id) continue;
        const tx = q.x + (p.homeX - q.homeX), ty = q.y + (p.homeY - q.homeY);
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
        if (d < T && (!best || d < best.d)) best = { dx, dy, d, type: 'neighbor', target: q.groupId };
      }
    }
    if (!best) return false;
    this.moveGroupBy(id, best.dx, best.dy);
    const finalId = best.type === 'neighbor' ? best.target : id;
    if (best.type === 'neighbor') for (const p of grp) p.groupId = best.target;
    this.settle(finalId);
    this.engine.layers.active.markDirty();
    this.engine.invalidate();
    return true;
  }

  /** Lock any piece of a group that is essentially at its home position. */
  settle(id) {
    for (const p of this.groupPieces(id)) {
      if (dist(p.x, p.y, p.homeX, p.homeY) < 1.5) {
        p.x = p.homeX; p.y = p.homeY;
        if (!p.placed) { p.placed = true; p.zIndex = 1; }
      }
    }
  }

  isSolved() { return this.pieces.length > 0 && this.pieces.every((p) => p.placed); }
  placedCount() { return this.pieces.filter((p) => p.placed).length; }

  /** Hint: reveal one unplaced piece's outline briefly. */
  hint() {
    const remaining = this.pieces.filter((p) => !p.placed);
    if (!remaining.length) return null;
    this.hintPiece = remaining[Math.floor(Math.random() * remaining.length)];
    this.engine.invalidate();
    clearTimeout(this._hintT);
    this._hintT = setTimeout(() => { this.hintPiece = null; this.engine.invalidate(); }, 1600);
    return this.hintPiece;
  }

  // ---- progress state ----
  serialize() {
    return {
      itemId: this.item.id, rows: this.rows, cols: this.cols,
      pieces: this.pieces.map((p) => ({ r: p.r, c: p.c, x: Math.round(p.x), y: Math.round(p.y), g: p.groupId, placed: p.placed, z: p.zIndex })),
    };
  }
  applyPieceState(pieces) {
    if (!Array.isArray(pieces)) return;
    for (const s of pieces) {
      const p = this.pieceAt(s.r, s.c);
      if (!p) continue;
      p.x = s.x; p.y = s.y; p.groupId = s.g; p.placed = !!s.placed; p.zIndex = s.z;
    }
    this.engine.layers.active.markDirty();
    this.engine.invalidate();
  }
}
