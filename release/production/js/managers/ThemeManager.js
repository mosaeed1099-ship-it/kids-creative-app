/**
 * ThemeManager.js — applies data-driven themes.
 * Reads token maps from theme.config.js and writes them as CSS custom
 * properties on <html>, plus a data-theme attribute for any CSS that keys
 * off it. Persists the choice and announces changes on the EventBus.
 */
import { THEMES, DEFAULT_THEME } from '../config/theme.config.js';

export default class ThemeManager {
  /**
   * @param {object} opts
   * @param {import('../core/EventBus.js').default} opts.bus
   * @param {import('../utils/storage.js').LocalStorageManager} opts.storage
   * @param {string} [opts.initial]
   */
  constructor({ bus, storage, initial = DEFAULT_THEME }) {
    this.bus = bus;
    this.storage = storage;
    this.themes = THEMES;
    this.current = storage?.get('theme', initial) || initial;
  }

  get available() {
    return Object.keys(this.themes);
  }

  init() {
    this.apply(this.current, { silent: true });
    return this;
  }

  apply(name, { silent = false } = {}) {
    const tokens = this.themes[name];
    if (!tokens) return;
    const root = document.documentElement;
    for (const [prop, value] of Object.entries(tokens)) {
      root.style.setProperty(prop, value);
    }
    root.setAttribute('data-theme', name);
    this.current = name;
    if (this.storage) this.storage.set('theme', name);
    if (!silent && this.bus) this.bus.emit('theme:changed', name);
  }

  toggle() {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
    return this.current;
  }
}
