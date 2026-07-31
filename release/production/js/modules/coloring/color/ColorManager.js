/**
 * ColorManager — the coloring color system.
 *   - a default solid palette
 *   - recently used colors (auto, capped, persisted)
 *   - favorite colors (persisted)
 *   - unlimited expansion via custom colors (the picker adds to recents)
 *
 * Self-contained persistence (localStorage with a safe fallback) so the module
 * has no external dependency. Notifies via an onChange callback.
 */
const DEFAULT_PALETTE = [
  '#000000', '#ffffff', '#9aa0b5',
  '#ff5a5a', '#ff9a3d', '#ffd23d', '#7ed957', '#57c98a',
  '#35b0ff', '#5b6bff', '#b06bff', '#ff6bb0',
  '#8a5a2b', '#c98a5a', '#ffd1a6', '#3a2e28',
];

export default class ColorManager {
  constructor({ storageKey = 'kcs.coloring.colors', onChange = null, recentLimit = 14 } = {}) {
    this.storageKey = storageKey;
    this.onChange = onChange;
    this.recentLimit = recentLimit;
    this.defaults = [...DEFAULT_PALETTE];

    const saved = this._read();
    this._recent = saved.recent || [];
    this._favorites = saved.favorites || [];
    this.current = saved.current || '#ff5a5a';
  }

  _read() {
    try { return JSON.parse(localStorage.getItem(this.storageKey)) || {}; } catch (_) { return {}; }
  }
  _write() {
    try { localStorage.setItem(this.storageKey, JSON.stringify({ recent: this._recent, favorites: this._favorites, current: this.current })); } catch (_) {}
  }
  _emit() { this._write(); this.onChange?.(this); }

  static normalize(hex) {
    let s = String(hex || '').trim().toLowerCase();
    if (s[0] !== '#') s = `#${s}`;
    if (s.length === 4) s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
    return s;
  }

  getCurrent() { return this.current; }

  /** Select a color and record it in recents. */
  setCurrent(hex) {
    this.current = ColorManager.normalize(hex);
    this._pushRecent(this.current);
    this._emit();
    return this.current;
  }

  _pushRecent(hex) {
    hex = ColorManager.normalize(hex);
    this._recent = [hex, ...this._recent.filter((c) => c !== hex)].slice(0, this.recentLimit);
  }

  /** A custom color from the picker — becomes current + recent. */
  addCustom(hex) { return this.setCurrent(hex); }

  recent() { return [...this._recent]; }
  favorites() { return [...this._favorites]; }
  palette() { return [...this.defaults]; }

  isFavorite(hex) { return this._favorites.includes(ColorManager.normalize(hex)); }
  toggleFavorite(hex) {
    hex = ColorManager.normalize(hex);
    this._favorites = this.isFavorite(hex)
      ? this._favorites.filter((c) => c !== hex)
      : [hex, ...this._favorites].slice(0, 40);
    this._emit();
    return this.isFavorite(hex);
  }
}
