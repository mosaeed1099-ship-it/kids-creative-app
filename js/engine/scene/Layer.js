/**
 * Layer — an ordered bucket of SceneObjects with its own visibility, opacity
 * and z-index. Layers let modules separate concerns (e.g. background image /
 * artwork / overlay) and toggle or reorder them cheaply.
 *
 * Objects are drawn in world space; the engine has already applied the camera
 * transform before calling layer.render().
 */
export default class Layer {
  constructor({ id, name = '', zIndex = 0, visible = true, opacity = 1, locked = false } = {}) {
    this.id = id || `layer_${Math.floor(performance.now())}_${Math.floor(Math.abs(Math.sin(zIndex) * 1e6))}`;
    this.name = name || this.id;
    this.zIndex = zIndex;
    this.visible = visible;
    this.opacity = opacity;
    this.locked = locked;
    /** @type {import('./SceneObject.js').default[]} */
    this.objects = [];
    this._needsSort = false;
  }

  add(obj) {
    this.objects.push(obj);
    this._needsSort = true;
    return obj;
  }

  remove(obj) {
    const i = this.objects.indexOf(obj);
    if (i >= 0) this.objects.splice(i, 1);
    return i >= 0;
  }

  clear() { this.objects.length = 0; }

  _sort() {
    if (this._needsSort) {
      this.objects.sort((a, b) => a.zIndex - b.zIndex);
      this._needsSort = false;
    }
  }

  markDirty() { this._needsSort = true; }

  render(ctx, engine) {
    if (!this.visible || this.opacity <= 0) return;
    this._sort();
    ctx.save();
    ctx.globalAlpha *= this.opacity;
    for (const obj of this.objects) obj.render(ctx, engine);
    ctx.restore();
  }

  /** Top-most object at a world point, or null. */
  hitTest(world) {
    this._sort();
    for (let i = this.objects.length - 1; i >= 0; i--) {
      if (this.objects[i].hitTest(world)) return this.objects[i];
    }
    return null;
  }
}
