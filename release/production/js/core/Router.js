/**
 * Router.js — hash-based client-side router.
 *
 * Hash routing (#/coloring) is deliberate: it needs ZERO server config and
 * works identically on Cloudflare Pages, GitHub Pages and Netlify with no
 * redirect rules. Deep links and the back button just work.
 *
 * The router is intentionally dumb about *what* a route renders. It calls
 * a `resolve(path)` function (provided by App) that returns a View instance
 * with mount(outlet)/unmount(). This keeps routing decoupled from the
 * page/module system.
 */
import { logger } from '../utils/logger.js';

export default class Router {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.outlet - where views mount
   * @param {(path:string) => Promise<object>} opts.resolve - path -> View instance
   * @param {(info:object) => void} [opts.onNavigate] - called after each navigation
   * @param {string} [opts.defaultPath]
   */
  constructor({ outlet, resolve, onNavigate = null, defaultPath = '/' }) {
    this.outlet = outlet;
    this.resolve = resolve;
    this.onNavigate = onNavigate;
    this.defaultPath = defaultPath;
    this.current = null;
    this._navToken = 0;
    this._onHashChange = () => this._run();
  }

  start() {
    window.addEventListener('hashchange', this._onHashChange);
    if (!location.hash) {
      this.navigate(this.defaultPath, { replace: true });
    } else {
      this._run();
    }
  }

  stop() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  /** Current path from the hash, without the leading '#'. */
  get path() {
    return location.hash.slice(1) || this.defaultPath;
  }

  /** Programmatic navigation. */
  navigate(path, { replace = false } = {}) {
    const target = `#${path}`;
    if (location.hash === target) {
      this._run();
      return;
    }
    if (replace) location.replace(target);
    else location.hash = target;
  }

  async _run() {
    const token = ++this._navToken;
    const path = this.path;

    let view;
    try {
      view = await this.resolve(path);
    } catch (err) {
      logger.error('route resolve failed:', err);
      return;
    }

    // A newer navigation started while we were resolving — abort this one.
    if (token !== this._navToken) {
      if (view && view.unmount) { try { await view.unmount(); } catch (_) {} }
      return;
    }

    if (this.current) {
      try { await this.current.unmount(); } catch (err) { logger.error(err); }
    }

    this.current = view;
    this.outlet.scrollTop = 0;
    await view.mount(this.outlet);

    logger.info('navigated →', path);
    if (this.onNavigate) this.onNavigate({ path, view });
  }
}
