/**
 * PrintSettings — persisted print options: page size (A4/Letter), orientation
 * (portrait/landscape), margins, scale, fit-to-page, and color / black&white.
 */
import { Store, Emitter } from './util.js';

const DEFAULTS = {
  pageSize: 'A4',
  orientation: 'portrait',
  marginMm: 10,
  scale: 1,
  fit: true,
  color: 'color', // 'color' | 'bw'
};

export default class PrintSettings {
  constructor({ store = null, key = 'kcs.print.settings' } = {}) {
    this.events = new Emitter();
    this.store = store || new Store('kcs');
    this.key = key;
    this.data = { ...DEFAULTS, ...(this.store.get(key, {}) || {}) };
  }
  get() { return { ...this.data }; }
  value(k) { return this.data[k]; }
  set(k, v) { this.data[k] = v; this.store.set(this.key, this.data); this.events.emit('change', this.get()); return this; }
  reset() { this.data = { ...DEFAULTS }; this.store.set(this.key, this.data); this.events.emit('change', this.get()); }
}
