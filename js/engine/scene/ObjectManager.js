/**
 * ObjectManager — convenience façade over layers for object CRUD and queries.
 * Modules can add objects without caring about layers (uses the active layer),
 * or target a specific layer explicitly.
 */
export default class ObjectManager {
  constructor({ layers, events } = {}) {
    this.layers = layers;
    this.events = events;
    this._index = new Map(); // id → { object, layer }
  }

  /** Add an object to a layer (defaults to the active layer). */
  add(object, layer = null) {
    const target = layer ? this.layers._resolve(layer) : this.layers.active;
    target.add(object);
    this._index.set(object.id, { object, layer: target });
    this.events?.emit('object:add', { object, layer: target });
    return object;
  }

  remove(object) {
    const entry = typeof object === 'string' ? this._index.get(object) : this._index.get(object.id);
    if (!entry) return false;
    entry.layer.remove(entry.object);
    this._index.delete(entry.object.id);
    this.events?.emit('object:remove', entry);
    return true;
  }

  get(id) { return this._index.get(id)?.object || null; }

  all() { return [...this._index.values()].map((e) => e.object); }

  count() { return this._index.size; }

  /** All objects passing a predicate. */
  query(predicate) { return this.all().filter(predicate); }

  /** Top-most object at a world point. */
  hitTest(world) { return this.layers.hitTest(world)?.object || null; }

  clear() {
    this.layers.clear();
    this._index.clear();
  }
}
