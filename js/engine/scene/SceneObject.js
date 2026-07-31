/**
 * SceneObject — base class for anything drawable in a scene.
 *
 * Feature modules create their own objects by extending this and overriding
 * `draw(ctx)` (and optionally `hitTest`/`getBounds`/`toJSON`). The engine
 * never assumes what an object is — it only calls this contract.
 *
 * Transform: position (x,y), uniform/non-uniform scale, rotation (radians),
 * with an intrinsic width/height and a normalized anchor (0..1).
 */
let _seq = 0;

export default class SceneObject {
  constructor(props = {}) {
    this.id = props.id || `obj_${(_seq += 1)}`;
    this.type = props.type || 'object';
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.width = props.width || 0;
    this.height = props.height || 0;
    this.scaleX = props.scaleX ?? props.scale ?? 1;
    this.scaleY = props.scaleY ?? props.scale ?? 1;
    this.rotation = props.rotation || 0;
    this.anchor = props.anchor || { x: 0.5, y: 0.5 };
    this.zIndex = props.zIndex || 0;
    this.visible = props.visible !== false;
    this.opacity = props.opacity ?? 1;
    this.interactive = props.interactive !== false;
    this.locked = !!props.locked;
    this.data = props.data || {}; // free-form per-object payload for modules
  }

  /** Override: draw in LOCAL space (engine has already applied the transform). */
  draw(/* ctx, engine */) { /* abstract */ }

  /** Apply this object's transform then call draw(). Called by Layer. */
  render(ctx, engine) {
    if (!this.visible || this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha *= this.opacity;
    ctx.translate(this.x, this.y);
    if (this.rotation) ctx.rotate(this.rotation);
    if (this.scaleX !== 1 || this.scaleY !== 1) ctx.scale(this.scaleX, this.scaleY);
    ctx.translate(-this.width * this.anchor.x, -this.height * this.anchor.y);
    this.draw(ctx, engine);
    ctx.restore();
  }

  /** Axis-aligned world bounds (ignores rotation for a fast broad-phase). */
  getBounds() {
    const w = this.width * Math.abs(this.scaleX);
    const h = this.height * Math.abs(this.scaleY);
    return { x: this.x - w * this.anchor.x, y: this.y - h * this.anchor.y, w, h };
  }

  /** Hit test a world-space point. Override for pixel-perfect tests. */
  hitTest(world) {
    if (!this.interactive || !this.visible) return false;
    const b = this.getBounds();
    return world.x >= b.x && world.x <= b.x + b.w && world.y >= b.y && world.y <= b.y + b.h;
  }

  /** Serialize the transform + type. Subclasses extend with their own props. */
  toJSON() {
    return {
      id: this.id, type: this.type, x: this.x, y: this.y,
      width: this.width, height: this.height,
      scaleX: this.scaleX, scaleY: this.scaleY, rotation: this.rotation,
      anchor: { ...this.anchor }, zIndex: this.zIndex,
      visible: this.visible, opacity: this.opacity, data: this.data,
    };
  }
}
