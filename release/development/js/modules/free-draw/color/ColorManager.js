/**
 * ColorManager.js — the current colour plus recent + favourite colours and the
 * preset palettes. Recents/favourites persist to localStorage. Emits change so
 * the colour panel refreshes. Consumes only the pure colorConvert helpers.
 */
import { normalizeHex } from './colorConvert.js';
import PALETTES from './palettes.js';

const KEY = 'kcs.freedraw.colors.v1';
const MAX_RECENT = 12;

export default class ColorManager {
  constructor({ onChange = null } = {}) {
    this.onChange = onChange;
    this.palettes = PALETTES;
    const saved = load();
    this.current = saved.current || '#ff3b30';
    this.recent = saved.recent || [];
    this.favorites = saved.favorites || ['#ff3b30', '#ffcc00', '#34c759', '#30b0ff', '#000000'];
  }

  get() { return this.current; }

  set(hex, { pushRecent = true } = {}) {
    const c = normalizeHex(hex);
    if (!c) return this.current;
    this.current = c;
    if (pushRecent) {
      this.recent = [c, ...this.recent.filter((x) => x !== c)].slice(0, MAX_RECENT);
    }
    this._save();
    this.onChange?.(this.current);
    return c;
  }

  toggleFavorite(hex) {
    const c = normalizeHex(hex);
    if (!c) return;
    this.favorites = this.favorites.includes(c)
      ? this.favorites.filter((x) => x !== c)
      : [...this.favorites, c].slice(0, 24);
    this._save();
    this.onChange?.(this.current);
  }

  isFavorite(hex) { return this.favorites.includes(normalizeHex(hex)); }

  _save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        current: this.current, recent: this.recent, favorites: this.favorites,
      }));
    } catch { /* private mode */ }
  }
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
