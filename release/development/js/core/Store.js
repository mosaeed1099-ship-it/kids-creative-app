/**
 * Store.js — tiny reactive state container.
 * Holds global app state, notifies subscribers on change, and can
 * transparently persist itself through a LocalStorageManager.
 */
export default class Store {
  /**
   * @param {object} initialState
   * @param {object} [options]
   * @param {string} [options.persistKey] - if set, state is saved/loaded under this key
   * @param {import('../utils/storage.js').LocalStorageManager} [options.storage]
   */
  constructor(initialState = {}, { persistKey = null, storage = null } = {}) {
    this._state = { ...initialState };
    this._subscribers = new Set();
    this._persistKey = persistKey;
    this._storage = storage;

    if (persistKey && storage) {
      const saved = storage.get(persistKey);
      if (saved && typeof saved === 'object') {
        this._state = { ...this._state, ...saved };
      }
    }
  }

  /** Read-only snapshot. */
  get state() {
    return this._state;
  }

  get(key) {
    return this._state[key];
  }

  /** Merge a patch into state and notify subscribers. */
  set(patch) {
    const next = typeof patch === 'function' ? patch(this._state) : patch;
    this._state = { ...this._state, ...next };
    this._flush();
    return this._state;
  }

  /**
   * Subscribe to any state change.
   * @returns {() => void} unsubscribe
   */
  subscribe(handler) {
    this._subscribers.add(handler);
    return () => this._subscribers.delete(handler);
  }

  _flush() {
    this._subscribers.forEach((handler) => {
      try {
        handler(this._state);
      } catch (err) {
        console.error('[Store] subscriber threw:', err);
      }
    });
    if (this._persistKey && this._storage) {
      this._storage.set(this._persistKey, this._state);
    }
  }
}
