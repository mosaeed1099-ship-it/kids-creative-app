/**
 * EngineEventBus — engine-scoped pub/sub.
 *
 * The engine ships its OWN event bus (it does not import the app's) so the
 * whole engine stays standalone and reusable outside this app.
 *
 * Common events emitted by the engine:
 *   'ready', 'resize', 'frame',
 *   'camera:change', 'pointerdown', 'pointermove', 'pointerup', 'wheel',
 *   'object:add', 'object:remove', 'layer:add', 'layer:remove',
 *   'selection:change', 'tool:change', 'history:change', 'plugin:change'
 */
export default class EngineEventBus {
  constructor() {
    this._map = new Map();
  }

  on(type, handler) {
    if (!this._map.has(type)) this._map.set(type, new Set());
    this._map.get(type).add(handler);
    return () => this.off(type, handler);
  }

  once(type, handler) {
    const off = this.on(type, (p) => { off(); handler(p); });
    return off;
  }

  off(type, handler) {
    this._map.get(type)?.delete(handler);
  }

  emit(type, payload) {
    const set = this._map.get(type);
    if (!set) return;
    for (const handler of [...set]) {
      try { handler(payload); } catch (err) { console.error(`[Engine] "${type}" handler:`, err); }
    }
  }

  clear() { this._map.clear(); }
}
