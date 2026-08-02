/**
 * LayerObject.js — the bridge between a RasterLayer and the Canvas Engine.
 * It is a normal SceneObject (engine public API): the engine renders it every
 * frame by blitting the layer bitmap. Canvas rotation is expressed purely
 * through this object's `rotation` (about the document centre), so the engine
 * needs no rotation support of its own.
 *
 * While a stroke is in progress on this layer, the live scratch is composited
 * with the correct blend mode into an isolated display buffer, so the preview
 * matches the committed result exactly (marker=multiply, eraser=erase).
 */
import { SceneObject } from '../../../engine/index.js';

export default class LayerObject extends SceneObject {
  constructor(layer, app) {
    super({
      type: 'fd-layer',
      x: app.doc.w / 2, y: app.doc.h / 2,
      width: layer.w, height: layer.h,
      anchor: { x: 0.5, y: 0.5 },
      interactive: false,
    });
    this.layer = layer;
    this.app = app;
  }

  /** Keep engine-visible transform props in sync with layer + view. */
  sync() {
    this.visible = this.layer.visible;
    this.opacity = this.layer.opacity;
    this.rotation = this.app.view.rotation;
    this.zIndex = this.app.doc.layers.indexOf(this.layer);
  }

  draw(ctx) {
    const as = this.app.activeStroke;
    if (as && as.layer === this.layer) {
      const disp = this.app.displayBuffer();
      const dctx = disp.getContext('2d');
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.clearRect(0, 0, disp.width, disp.height);
      dctx.globalCompositeOperation = 'source-over';
      dctx.globalAlpha = 1;
      dctx.drawImage(this.layer.canvas, 0, 0);
      dctx.globalAlpha = as.mark.opacity ?? 1;
      dctx.globalCompositeOperation = as.composite;
      dctx.drawImage(as.temp.canvas, 0, 0);
      dctx.globalAlpha = 1;
      dctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(disp, 0, 0);
    } else {
      ctx.drawImage(this.layer.canvas, 0, 0);
    }
  }
}
