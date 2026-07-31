/**
 * EventBus.js — minimal publish/subscribe hub.
 * Lets modules and managers talk without importing each other directly,
 * which is what keeps the architecture decoupled and extensible.
 */
export default class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @returns {() => void} unsubscribe function
   */
  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /** Subscribe for a single emission. */
  once(event, handler) {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  off(event, handler) {
    const set = this._listeners.get(event);
    if (set) set.delete(handler);
  }

  /** Emit an event to all subscribers. Handler errors are isolated. */
  emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set) return;
    [...set].forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] handler for "${event}" threw:`, err);
      }
    });
  }

  clear() {
    this._listeners.clear();
  }
}
