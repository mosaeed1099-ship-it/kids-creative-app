/**
 * StickerObject.js — one placed sticker on the scene. A normal engine
 * SceneObject (public API): position, uniform scale, rotation, plus flip flags.
 * Renders either a cached SVG image or an emoji glyph. Hit-testing is
 * rotation-aware so selecting a rotated sticker feels right.
 */
import { SceneObject } from '../../../engine/index.js';

export const BASE_SIZE = 150;
let _z = 1;

export default class StickerObject extends SceneObject {
  constructor(item, visual, props = {}) {
    super({
      type: 'sticker',
      width: BASE_SIZE, height: BASE_SIZE,
      anchor: { x: 0.5, y: 0.5 },
      zIndex: props.zIndex ?? (_z++),
      x: props.x ?? 0, y: props.y ?? 0,
      scaleX: props.scale ?? 1, scaleY: props.scale ?? 1,
      rotation: props.rotation ?? 0,
    });
    this.contentId = item.id;
    this.item = item;
    this.kind = visual.kind;
    this.img = visual.img || null;
    this.char = visual.char || null;
    this.flipH = !!props.flipH;
    this.flipV = !!props.flipV;
  }

  /** Uniform scale getter/setter (stickers scale proportionally). */
  get scale() { return this.scaleX; }
  set scale(v) { this.scaleX = this.scaleY = v; }

  draw(ctx) {
    const w = this.width, h = this.height;
    ctx.save();
    if (this.flipH || this.flipV) {
      ctx.translate(this.flipH ? w : 0, this.flipV ? h : 0);
      ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
    }
    if (this.kind === 'emoji') {
      ctx.font = `${h * 0.84}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.char, w / 2, h / 2 + h * 0.04);
    } else if (this.img) {
      ctx.drawImage(this.img, 0, 0, w, h);
    }
    ctx.restore();
  }

  /** Rotation-aware point test in world space. */
  hitTest(world) {
    if (!this.interactive || !this.visible) return false;
    const c = Math.cos(-this.rotation), s = Math.sin(-this.rotation);
    const dx = world.x - this.x, dy = world.y - this.y;
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    const hw = (this.width * Math.abs(this.scaleX)) / 2;
    const hh = (this.height * Math.abs(this.scaleY)) / 2;
    return Math.abs(lx) <= hw && Math.abs(ly) <= hh;
  }

  serialize() {
    return {
      contentId: this.contentId,
      x: this.x, y: this.y, scale: this.scaleX, rotation: this.rotation,
      flipH: this.flipH, flipV: this.flipV, zIndex: this.zIndex,
    };
  }
}
