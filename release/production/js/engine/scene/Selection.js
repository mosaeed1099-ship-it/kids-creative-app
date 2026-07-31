/**
 * Selection — tracks which objects are currently selected. Pure state +
 * queries; drawing selection handles is left to a plugin or a module so the
 * engine stays presentation-agnostic. Emits 'selection:change'.
 */
export default class Selection {
  constructor({ objects, events } = {}) {
    this.objects = objects; // ObjectManager (for hit testing)
    this.events = events;
    /** @type {Set<import('./SceneObject.js').default>} */
    this._set = new Set();
  }

  get items() { return [...this._set]; }
  get size() { return this._set.size; }
  has(obj) { return this._set.has(obj); }
  isEmpty() { return this._set.size === 0; }

  _changed() { this.events?.emit('selection:change', this.items); }

  select(obj, { additive = false } = {}) {
    if (!additive) this._set.clear();
    if (obj) this._set.add(obj);
    this._changed();
    return this;
  }

  toggle(obj) {
    if (this._set.has(obj)) this._set.delete(obj); else this._set.add(obj);
    this._changed();
    return this;
  }

  deselect(obj) { if (this._set.delete(obj)) this._changed(); return this; }

  clear() {
    if (this._set.size) { this._set.clear(); this._changed(); }
    return this;
  }

  /** Select the top-most object at a world point (null clears). */
  selectAt(world, opts = {}) {
    const hit = this.objects?.hitTest(world) || null;
    return this.select(hit, opts);
  }

  /** Select every object whose bounds intersect a world rectangle (marquee). */
  selectInRect(rect, { additive = false } = {}) {
    if (!additive) this._set.clear();
    for (const obj of this.objects.all()) {
      const b = obj.getBounds();
      const hit = !(b.x > rect.x + rect.w || b.x + b.w < rect.x || b.y > rect.y + rect.h || b.y + b.h < rect.y);
      if (hit && obj.interactive) this._set.add(obj);
    }
    this._changed();
    return this;
  }
}
