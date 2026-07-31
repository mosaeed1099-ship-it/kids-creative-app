/**
 * LayerManager — creates, orders and renders Layers. There is always at least
 * one "default" layer so simple modules can ignore layering entirely.
 */
import Layer from './Layer.js';

export default class LayerManager {
  constructor({ events } = {}) {
    this.events = events;
    /** @type {Layer[]} */
    this.layers = [];
    this._active = null;
    this.create({ id: 'default', name: 'Default' });
  }

  create(opts = {}) {
    const layer = new Layer(opts);
    this.layers.push(layer);
    this._sort();
    if (!this._active) this._active = layer;
    this.events?.emit('layer:add', layer);
    return layer;
  }

  get active() { return this._active; }
  setActive(idOrLayer) {
    this._active = this._resolve(idOrLayer) || this._active;
    return this._active;
  }

  _resolve(idOrLayer) {
    if (!idOrLayer) return null;
    return typeof idOrLayer === 'string'
      ? this.layers.find((l) => l.id === idOrLayer) || null
      : idOrLayer;
  }

  get(id) { return this.layers.find((l) => l.id === id) || null; }

  remove(idOrLayer) {
    const layer = this._resolve(idOrLayer);
    const i = this.layers.indexOf(layer);
    if (i >= 0) {
      this.layers.splice(i, 1);
      if (this._active === layer) this._active = this.layers[0] || null;
      this.events?.emit('layer:remove', layer);
      return true;
    }
    return false;
  }

  reorder(idOrLayer, zIndex) {
    const layer = this._resolve(idOrLayer);
    if (layer) { layer.zIndex = zIndex; this._sort(); }
    return layer;
  }

  _sort() { this.layers.sort((a, b) => a.zIndex - b.zIndex); }

  render(ctx, engine) {
    for (const layer of this.layers) layer.render(ctx, engine);
  }

  /** Top-most object across all layers (highest z first), or null. */
  hitTest(world) {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const hit = this.layers[i].hitTest(world);
      if (hit) return { object: hit, layer: this.layers[i] };
    }
    return null;
  }

  clear() { this.layers.forEach((l) => l.clear()); }
}
