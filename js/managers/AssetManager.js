/**
 * AssetManager.js — resolves and preloads static assets.
 *
 * All assets live under /assets. Paths are resolved relative to THIS file
 * via import.meta.url so they work at any hosting base path. Images can be
 * preloaded and are cached to avoid duplicate network work.
 */
export default class AssetManager {
  constructor() {
    this._base = new URL('../../assets/', import.meta.url);
    this._imageCache = new Map();
    this._audioCache = new Map();
  }

  /**
   * Resolve an asset path (e.g. "images/logo.svg") to an absolute URL string.
   */
  url(path) {
    return new URL(String(path).replace(/^\/+/, ''), this._base).href;
  }

  image(path) { return this.url(`images/${path}`); }
  icon(path) { return this.url(`icons/${path}`); }
  sticker(path) { return this.url(`stickers/${path}`); }
  sound(path) { return this.url(`sounds/${path}`); }
  pdf(path) { return this.url(`pdf/${path}`); }

  /** Preload an image; resolves with the cached HTMLImageElement. */
  preloadImage(path) {
    const src = this.url(path);
    if (this._imageCache.has(src)) return Promise.resolve(this._imageCache.get(src));
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this._imageCache.set(src, img); resolve(img); };
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /** Preload many images at once. Never rejects the whole batch. */
  preloadAll(paths = []) {
    return Promise.all(
      paths.map((p) => this.preloadImage(p).catch((e) => { console.warn(e); return null; })),
    );
  }

  /** Lazily create/cached an Audio element (used later by a sound system). */
  audio(path) {
    const src = this.url(`sounds/${path}`);
    if (!this._audioCache.has(src)) this._audioCache.set(src, new Audio(src));
    return this._audioCache.get(src);
  }
}
