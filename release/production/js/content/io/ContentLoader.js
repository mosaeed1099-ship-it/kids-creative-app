/**
 * ContentLoader — fetches content JSON and hydrates it into model instances.
 *
 * Responsibilities:
 *   - resolve URLs against a configurable base
 *   - fetch + parse JSON (cached via ContentCache for lazy loading)
 *   - hydrate a catalog (list of pack descriptors) and full Packs
 *   - basic shape validation with helpful errors
 *
 * It performs NO rendering and knows nothing about features.
 */
import Pack from '../model/Pack.js';

export default class ContentLoader {
  /**
   * @param {object} opts
   * @param {string} opts.base - base URL for relative content paths
   * @param {ContentCache} opts.cache
   */
  constructor({ base = '', cache = null } = {}) {
    this.base = base;
    this.cache = cache;
  }

  url(path) {
    try { return new URL(path, this.base || undefined).href; } catch (_) { return path; }
  }

  /** Fetch + parse JSON, using the cache when available. */
  async json(path, { useCache = true } = {}) {
    const url = this.url(path);
    if (useCache && this.cache?.has(url)) return this.cache.get(url);
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`ContentLoader: ${res.status} for ${url}`);
    const data = await res.json();
    if (useCache && this.cache) this.cache.set(url, data);
    return data;
  }

  /**
   * Load the catalog: { version, packs: [ { id, title, url, thumbnail, ... } ] }
   * Returns the raw descriptors (packs are loaded lazily on demand).
   */
  async loadCatalog(path = 'catalog.json') {
    const data = await this.json(path);
    if (!data || !Array.isArray(data.packs)) throw new Error('ContentLoader: invalid catalog (missing packs[])');
    return data;
  }

  /** Load a full pack JSON (by descriptor or direct path) → Pack instance. */
  async loadPack(descriptorOrPath) {
    const path = typeof descriptorOrPath === 'string' ? descriptorOrPath : descriptorOrPath.url;
    if (!path) throw new Error('ContentLoader: pack descriptor has no url');
    const data = await this.json(path);
    this._validatePack(data);
    const pack = Pack.fromJSON(data);
    pack.loaded = true;
    return pack;
  }

  _validatePack(data) {
    if (!data || !data.id) throw new Error('ContentLoader: pack JSON missing "id"');
    if (data.items && !Array.isArray(data.items)) throw new Error(`ContentLoader: pack "${data.id}" items must be an array`);
    return true;
  }
}
