/**
 * BackgroundObject.js — the page background: a colour fill (with a soft page
 * shadow) plus an optional cover-fit background image. Sits below everything and
 * is never interactive.
 */
import { SceneObject } from '../../../engine/index.js';

export default class BackgroundObject extends SceneObject {
  constructor(app) {
    super({ type: 'bg', x: 0, y: 0, width: app.PAGE_W, height: app.PAGE_H, anchor: { x: 0, y: 0 }, zIndex: -1000000, interactive: false });
    this.app = app;
    this.img = null;
  }

  draw(ctx) {
    const w = this.app.PAGE_W, h = this.app.PAGE_H;
    const bg = this.app.page?.bgColor || '#ffffff';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.16)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    if (this.img) {
      const s = Math.max(w / this.img.naturalWidth, h / this.img.naturalHeight);
      const dw = this.img.naturalWidth * s, dh = this.img.naturalHeight * s;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
      ctx.drawImage(this.img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.restore();
    }
  }
}
