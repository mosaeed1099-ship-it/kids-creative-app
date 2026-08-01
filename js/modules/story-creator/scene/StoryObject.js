/**
 * StoryObject.js — base class for every transformable page object (text, image,
 * shape). A normal engine SceneObject (public API) with a centre anchor,
 * uniform scale, rotation and flip flags, plus rotation-aware hit testing so
 * overlapping objects select correctly. Subclasses implement drawContent() in
 * local top-left space (0..width, 0..height); the base applies flip.
 *
 * (Stickers reuse Sticker Studio's StickerObject, which shares this interface.)
 */
import { SceneObject } from '../../../engine/index.js';

export default class StoryObject extends SceneObject {
  constructor(props = {}) {
    super({
      type: props.type || 'obj',
      width: props.width || 100, height: props.height || 100,
      anchor: { x: 0.5, y: 0.5 },
      x: props.x ?? 0, y: props.y ?? 0,
      scaleX: props.scale ?? 1, scaleY: props.scale ?? 1,
      rotation: props.rotation || 0,
      zIndex: props.zIndex ?? 1,
    });
    this.flipH = !!props.flipH;
    this.flipV = !!props.flipV;
  }

  get scale() { return this.scaleX; }
  set scale(v) { this.scaleX = this.scaleY = v; }

  draw(ctx) {
    const w = this.width, h = this.height;
    ctx.save();
    if (this.flipH || this.flipV) {
      ctx.translate(this.flipH ? w : 0, this.flipV ? h : 0);
      ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
    }
    this.drawContent(ctx);
    ctx.restore();
  }

  drawContent(/* ctx */) { /* abstract */ }

  hitTest(world) {
    if (!this.interactive || !this.visible) return false;
    const c = Math.cos(-this.rotation), s = Math.sin(-this.rotation);
    const dx = world.x - this.x, dy = world.y - this.y;
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    const hw = (this.width * Math.abs(this.scaleX)) / 2;
    const hh = (this.height * Math.abs(this.scaleY)) / 2;
    return Math.abs(lx) <= hw && Math.abs(ly) <= hh;
  }

  baseSerialize() {
    return { type: this.type, x: Math.round(this.x), y: Math.round(this.y), scale: this.scaleX, rotation: this.rotation, flipH: this.flipH, flipV: this.flipV, z: this.zIndex };
  }
}
