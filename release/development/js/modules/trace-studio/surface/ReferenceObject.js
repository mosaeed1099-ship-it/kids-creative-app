/**
 * ReferenceObject — the reference image layer the child traces over.
 * A Canvas-Engine SceneObject with its OWN transform (scale, move, rotate,
 * flip) and opacity/visibility/lock, independent of the drawing. Honors the
 * studio's comparison mode (before/after/split/overlay).
 */
import { SceneObject } from '../../../engine/index.js';
import { applySplitClip } from './compareClip.js';

export default class ReferenceObject extends SceneObject {
  /** @param {object} state - shared studio state, reads state.compare */
  constructor(state) {
    super({ type: 'reference', interactive: true });
    this.state = state;
    this.image = null;
    this.imgW = 0; this.imgH = 0;
    this.opacity = 0.5;
    this.visible = true;
    this.locked = false;
    this.flipH = false; this.flipV = false;
    this.scale = 1; this.rotation = 0; // radians
    this.x = 0; this.y = 0;            // centre in world
  }

  setImage(image, w, h) {
    this.image = image; this.imgW = w; this.imgH = h;
    this.width = w; this.height = h;
    return this;
  }

  /** Axis-aligned-ish world bounds (ignores rotation) for fit/center. */
  worldBounds() {
    const w = this.imgW * this.scale, h = this.imgH * this.scale;
    return { x: this.x - w / 2, y: this.y - h / 2, w, h };
  }

  hitTest(world) {
    if (!this.visible || this.locked) return false;
    const b = this.worldBounds();
    return world.x >= b.x && world.x <= b.x + b.w && world.y >= b.y && world.y <= b.y + b.h;
  }

  render(ctx, engine) {
    if (!this.visible || !this.image) return;
    const mode = this.state.compare || 'overlay';
    if (mode === 'after') return;                // drawing only
    ctx.save();
    if (mode === 'split') applySplitClip(ctx, engine, 'left');
    ctx.globalAlpha *= this.opacity;
    ctx.translate(this.x, this.y);
    if (this.rotation) ctx.rotate(this.rotation);
    ctx.scale((this.flipH ? -1 : 1) * this.scale, (this.flipV ? -1 : 1) * this.scale);
    ctx.drawImage(this.image, -this.imgW / 2, -this.imgH / 2, this.imgW, this.imgH);
    ctx.restore();
  }
}
