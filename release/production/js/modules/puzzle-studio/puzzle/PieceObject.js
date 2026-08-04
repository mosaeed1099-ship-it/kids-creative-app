/**
 * PieceObject.js — one jigsaw piece as an engine SceneObject. It clips the
 * board image to the piece's interlocking path and strokes a bevel border.
 * Hit-testing is pixel-accurate (isPointInPath), so overlapping pieces select
 * correctly. Placed pieces sit at their home and become non-draggable.
 */
import { SceneObject } from '../../../engine/index.js';
import { buildPiecePath, pieceSigns } from './jigsaw.js';

export default class PieceObject extends SceneObject {
  constructor(model, r, c, index) {
    super({ type: 'piece', width: model.cw, height: model.ch, anchor: { x: 0, y: 0 }, x: 0, y: 0, zIndex: 10 + index });
    this.model = model;
    this.r = r; this.c = c;
    this.homeX = model.boardX + c * model.cw;
    this.homeY = model.boardY + r * model.ch;
    this.path = buildPiecePath(model.cw, model.ch, model.rad, pieceSigns(model.edges, r, c));
    this.placed = false;
    this.groupId = index;
  }

  draw(ctx) {
    const m = this.model, rad = m.rad, cw = m.cw, ch = m.ch;
    // drop shadow (silhouette) for floating pieces
    if (!this.placed) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.32)';
      ctx.shadowBlur = 10; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#000';
      ctx.fill(this.path);
      ctx.restore();
    }
    // image content, clipped to the piece
    ctx.save();
    ctx.clip(this.path);
    ctx.drawImage(m.imageCanvas, this.c * cw - rad, this.r * ch - rad, cw + 2 * rad, ch + 2 * rad, -rad, -rad, cw + 2 * rad, ch + 2 * rad);
    ctx.restore();
    // bevel border
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke(this.path);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.stroke(this.path);
    if (m.hintPiece === this) { ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 5; ctx.stroke(this.path); }
    ctx.restore();
  }

  hitTest(world) {
    if (this.placed || !this.visible) return false;
    return this.model.hitCtx.isPointInPath(this.path, world.x - this.x, world.y - this.y);
  }
}
