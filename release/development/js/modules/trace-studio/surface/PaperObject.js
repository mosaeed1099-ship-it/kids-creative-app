/**
 * PaperObject — a white "page" backdrop behind the reference and drawing so the
 * canvas reads as paper on any stage background. Sized to the drawing page.
 */
import { SceneObject } from '../../../engine/index.js';

export default class PaperObject extends SceneObject {
  constructor() { super({ type: 'paper', interactive: false }); }

  setSize(w, h) {
    this.width = w; this.height = h;
    this.x = -w / 2; this.y = -h / 2;
    return this;
  }

  worldBounds() { return { x: this.x, y: this.y, w: this.width, h: this.height }; }

  render(ctx) {
    if (!this.width) return;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.12)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}
