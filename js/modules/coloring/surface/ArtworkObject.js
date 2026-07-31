/**
 * ArtworkObject — a Canvas-Engine SceneObject that renders a PaintSurface into
 * the engine world. It is the bridge between the raster PaintSurface and the
 * engine's camera/zoom/pan/render loop. The object sits centered at the world
 * origin so `engine.fit(bounds)` frames it nicely.
 *
 * Consumes the engine's public SceneObject contract only.
 */
import { SceneObject } from '../../../engine/index.js';

export default class ArtworkObject extends SceneObject {
  constructor(surface) {
    super({
      type: 'artwork',
      width: surface.width,
      height: surface.height,
      x: -surface.width / 2,
      y: -surface.height / 2,
      anchor: { x: 0, y: 0 },   // draw from top-left of the object position
      interactive: true,
    });
    this.surface = surface;
  }

  draw(ctx) {
    // subtle page shadow so the artwork reads as paper on any background
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.12)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
    this.surface.drawInto(ctx);
  }

  /** World bounds of the artwork (used for fit-to-screen). */
  worldBounds() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }
}
