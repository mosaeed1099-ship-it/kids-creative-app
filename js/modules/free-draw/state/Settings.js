/**
 * Settings.js — the current tool + brush/shape parameters, with tiny persistence
 * so a child's last brush size/opacity survive a reload. Emits change events so
 * the toolbar/brush panel stay in sync.
 */
const KEY = 'kcs.freedraw.settings.v1';

const DEFAULTS = {
  tool: 'brush',        // active tool id
  size: 24,             // 1..160
  opacity: 1,           // 0..1
  hardness: 0.7,        // 0..1
  shape: 'rectangle',   // active shape id
  shapeFill: false,     // fill shapes with current colour
  sides: 6,             // polygon sides
};

export default class Settings {
  constructor({ onChange = null } = {}) {
    this.onChange = onChange;
    this.state = { ...DEFAULTS, ...load() };
  }

  get(k) { return this.state[k]; }

  set(k, v) {
    if (this.state[k] === v) return;
    this.state[k] = v;
    save(this.state);
    this.onChange?.(k, v);
  }

  patch(obj) {
    let changed = false;
    for (const [k, v] of Object.entries(obj)) {
      if (this.state[k] !== v) { this.state[k] = v; changed = true; }
    }
    if (changed) { save(this.state); this.onChange?.(null, this.state); }
  }
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
}
