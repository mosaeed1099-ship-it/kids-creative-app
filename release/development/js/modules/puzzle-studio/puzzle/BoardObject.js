/**
 * BoardObject.js — the target board: a faint ghost of the full picture plus a
 * frame, so children can see where the puzzle should form. Sits beneath the
 * pieces and is never interactive.
 */
import { SceneObject } from '../../../engine/index.js';

export default class BoardObject extends SceneObject {
  constructor(model) {
    super({
      type: 'board', x: model.boardX, y: model.boardY,
      width: model.boardW, height: model.boardH,
      anchor: { x: 0, y: 0 }, zIndex: -500, interactive: false,
    });
    this.model = model;
  }

  draw(ctx) {
    const m = this.model;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, m.boardW, m.boardH);
    ctx.globalAlpha = 0.16;
    ctx.drawImage(m.imageCanvas, 0, 0, m.boardW, m.boardH);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, m.boardW, m.boardH);
    ctx.restore();
  }
}
