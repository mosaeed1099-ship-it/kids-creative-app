/**
 * MovableObject — base for every draggable character part / sticker.
 * A Canvas-Engine SceneObject with an independent transform (position, scale,
 * rotation, flip H/V) and z-index. Handles rotation-aware hit testing and
 * selection-handle math. Subclasses implement drawContent() only.
 */
import { SceneObject } from '../../../engine/index.js';

export default class MovableObject extends SceneObject {
  constructor(props = {}) {
    super({ type: props.type || 'part', interactive: true });
    this.partId = props.id || `p_${Math.random().toString(36).slice(2, 8)}`;
    this.kind = props.kind || 'part';
    this.slot = props.slot || null;
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.scale = props.scale || 1;
    this.rotation = props.rotation || 0; // radians
    this.flipH = !!props.flipH;
    this.flipV = !!props.flipV;
    this.zIndex = props.z ?? props.zIndex ?? 0;
    this.natW = props.natW || 0;
    this.natH = props.natH || 0;
    this.locked = !!props.locked;
  }

  setNatural(w, h) { this.natW = w; this.natH = h; this.width = w; this.height = h; return this; }

  /** Override: draw the content centered at (0,0) in local space. */
  drawContent(/* ctx */) {}

  render(ctx) {
    if (!this.visible || !this.natW) return;
    ctx.save();
    ctx.globalAlpha *= this.opacity ?? 1;
    ctx.translate(this.x, this.y);
    if (this.rotation) ctx.rotate(this.rotation);
    ctx.scale((this.flipH ? -1 : 1) * this.scale, (this.flipV ? -1 : 1) * this.scale);
    this.drawContent(ctx);
    ctx.restore();
  }

  /** World-space corners (TL, TR, BR, BL). */
  cornersWorld() {
    const hw = (this.natW / 2) * this.scale, hh = (this.natH / 2) * this.scale;
    const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    const c = Math.cos(this.rotation), s = Math.sin(this.rotation);
    return pts.map(([px, py]) => ({ x: this.x + px * c - py * s, y: this.y + px * s + py * c }));
  }

  _localPoint(world) {
    const dx = world.x - this.x, dy = world.y - this.y;
    const c = Math.cos(-this.rotation), s = Math.sin(-this.rotation);
    return { x: (dx * c - dy * s) / this.scale, y: (dx * s + dy * c) / this.scale };
  }

  hitTest(world) {
    if (!this.visible || this.locked) return false;
    const l = this._localPoint(world);
    return Math.abs(l.x) <= this.natW / 2 && Math.abs(l.y) <= this.natH / 2;
  }

  getBounds() {
    const cs = this.cornersWorld();
    const xs = cs.map((p) => p.x), ys = cs.map((p) => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
  }

  /** Selection handle positions in world space. */
  handles(zoom = 1) {
    const cs = this.cornersWorld();
    const topMid = { x: (cs[0].x + cs[1].x) / 2, y: (cs[0].y + cs[1].y) / 2 };
    let dx = topMid.x - this.x, dy = topMid.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const off = 42 / zoom;
    return {
      rotate: { x: topMid.x + (dx / len) * off, y: topMid.y + (dy / len) * off },
      scale: cs[2], // bottom-right corner
      topMid,
    };
  }

  toJSON() {
    return {
      id: this.partId, kind: this.kind, slot: this.slot, type: this.type,
      src: this.src || null, emoji: this.emoji || null,
      x: this.x, y: this.y, scale: this.scale, rotation: this.rotation,
      flipH: this.flipH, flipV: this.flipV, z: this.zIndex, natW: this.natW, natH: this.natH,
    };
  }
}
