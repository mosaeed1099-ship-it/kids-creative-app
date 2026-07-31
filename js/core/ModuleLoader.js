/**
 * ModuleLoader.js — lazy-loads feature modules on demand using native
 * dynamic import(). This gives real code-splitting with NO bundler:
 * a feature's JS is only fetched the first time the user opens it.
 *
 * Paths in the registry are resolved relative to THIS file via
 * import.meta.url, so the app works whether it's hosted at a domain root
 * (Cloudflare/Netlify) or a sub-path (GitHub Pages project sites).
 */
import { logger } from '../utils/logger.js';

export default class ModuleLoader {
  /**
   * @param {object} opts
   * @param {Array} opts.registry - feature registry entries { id, path, ... }
   * @param {object} opts.ctx - AppContext passed to every module instance
   */
  constructor({ registry, ctx }) {
    this.registry = registry;
    this.ctx = ctx;
    /** cache of resolved classes by feature id */
    this._classes = new Map();
  }

  find(id) {
    return this.registry.find((entry) => entry.id === id) || null;
  }

  findByRoute(route) {
    return this.registry.find((entry) => entry.route === route) || null;
  }

  /** Load (and cache) a feature module class by id. */
  async loadClass(id) {
    if (this._classes.has(id)) return this._classes.get(id);

    const entry = this.find(id);
    if (!entry) throw new Error(`[ModuleLoader] unknown module id: "${id}"`);

    const url = new URL(`../modules/${entry.path}`, import.meta.url);
    logger.info('loading module', id, '→', entry.path);

    const mod = await import(/* @vite-ignore */ url.href);
    const ModuleClass = mod.default;
    if (!ModuleClass) throw new Error(`[ModuleLoader] "${id}" has no default export`);

    this._classes.set(id, ModuleClass);
    return ModuleClass;
  }

  /** Load the class and return a ready-to-mount instance. */
  async instantiate(id) {
    const ModuleClass = await this.loadClass(id);
    return new ModuleClass(this.ctx);
  }
}
