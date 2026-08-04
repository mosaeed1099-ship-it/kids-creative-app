/**
 * PaperObject.js — the scene's background "page" beneath the stickers. Sits at
 * the bottom of the z-order and defines the printable/exportable area.
 */
import { SceneObject } from '../../../engine/index.js';

export default class PaperObject extends SceneObject {
  constructor(app) {
    super({
      type: 'ss-paper',
      x: app.pageW / 2, y: app.pageH / 2,
      width: app.pageW, height: app.pageH,
      anchor: { x: 0.5, y: 0.5 },
      zIndex: -100000,
      interactive: false,
    });
    this.app = app;
  }

  draw(ctx) {
    const { pageW: w, pageH: h } = this.app;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.16)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = this.app.pageBg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
