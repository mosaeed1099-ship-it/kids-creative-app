/**
 * PaperObject.js — the white (or dark) "page" that sits beneath every layer,
 * giving the studio a bounded, printable sheet while the surrounding desk area
 * stays pannable/zoomable (the "infinite canvas" feel). A SceneObject at the
 * bottom of the z-order; rotates with the canvas like the layers do.
 */
import { SceneObject } from '../../../engine/index.js';

export default class PaperObject extends SceneObject {
  constructor(app) {
    super({
      type: 'fd-paper',
      x: app.doc.w / 2, y: app.doc.h / 2,
      width: app.doc.w, height: app.doc.h,
      anchor: { x: 0.5, y: 0.5 },
      zIndex: -1000,
      interactive: false,
    });
    this.app = app;
  }

  sync() { this.rotation = this.app.view.rotation; }

  draw(ctx) {
    const { w, h } = this.app.doc;
    ctx.save();
    // soft drop shadow so the page reads as a sheet on the desk
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = this.app.doc.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
