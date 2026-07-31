/**
 * App.js — application bootstrap and composition root.
 *
 * Responsibilities:
 *  - construct every core service and manager (dependency wiring)
 *  - build the persistent layout shell (navbar + sidebar + outlet)
 *  - define how a route path resolves to a Page or a lazy-loaded Module
 *  - start the router
 *
 * Everything downstream receives services through the frozen AppContext,
 * so features stay decoupled and new ones slot in via the registry alone.
 */
import { APP_CONFIG } from '../config/app.config.js';
import { STATIC_ROUTES } from '../config/routes.config.js';
import { FEATURES } from '../data/features.registry.js';

import EventBus from './EventBus.js';
import Store from './Store.js';
import Router from './Router.js';
import ModuleLoader from './ModuleLoader.js';
import { createContext } from './AppContext.js';

import { LocalStorageManager } from '../utils/storage.js';
import { el, qs } from '../utils/dom.js';
import { logger } from '../utils/logger.js';

import ThemeManager from '../managers/ThemeManager.js';
import I18nManager from '../managers/I18nManager.js';
import AssetManager from '../managers/AssetManager.js';
import SettingsManager from '../managers/SettingsManager.js';

import Navbar from '../ui/Navbar.js';
import Sidebar from '../ui/Sidebar.js';

import DashboardPage from '../pages/DashboardPage.js';
import SettingsPage from '../pages/SettingsPage.js';
import NotFoundPage from '../pages/NotFoundPage.js';

/** Static pages keyed by pageId (referenced from routes.config.js). */
const PAGES = {
  dashboard: DashboardPage,
  settings: SettingsPage,
  notFound: NotFoundPage,
};

export default class App {
  /** @param {HTMLElement} root - the mount element (#app). */
  constructor(root) {
    this.root = root;
  }

  /** Wire services, build layout, and start routing. */
  async start() {
    // --- 1. core services ---
    const bus = new EventBus();
    const storage = new LocalStorageManager(APP_CONFIG.storageNamespace);
    const store = new Store(
      { ...APP_CONFIG.defaults, unlocked: false },
      { persistKey: 'settings', storage },
    );

    // --- 2. managers ---
    const theme = new ThemeManager({ bus, storage, initial: store.get('theme') }).init();
    const i18n = new I18nManager({ bus, storage, initial: store.get('language') }).init();
    const assets = new AssetManager();
    const settings = new SettingsManager({ store, bus, theme, i18n });

    // --- 3. module loader + context ---
    // Build a mutable services object first; router is filled in below because
    // Router needs ctx (to resolve routes) and ctx needs router (circular).
    const modules = new ModuleLoader({ registry: FEATURES, ctx: null });
    const services = { bus, store, storage, theme, i18n, assets, settings, modules, router: null };
    modules.ctx = services;

    // --- 4. layout shell ---
    const outlet = this._buildLayout(services);

    // --- 5. router ---
    const router = new Router({
      outlet,
      defaultPath: '/',
      resolve: (path) => this._resolve(path, services),
      onNavigate: ({ path }) => bus.emit('router:navigate', { path }),
    });
    services.router = router;

    // Freeze the finished context so features can't reassign shared services.
    const ctx = createContext(services);
    modules.ctx = ctx;
    this.ctx = ctx;
    router.start();

    logger.info(`${APP_CONFIG.name} v${APP_CONFIG.version} started`);
    bus.emit('app:ready', { ctx });
    return this;
  }

  /**
   * Build the persistent shell (navbar, sidebar, content outlet) once.
   * Only the outlet's contents change between routes.
   */
  _buildLayout(ctx) {
    this.root.innerHTML = '';

    const navbar = new Navbar({ ctx });
    const sidebar = new Sidebar({ ctx });
    const outlet = el('main', { class: 'app-outlet', id: 'outlet' });

    const layout = el('div', { class: 'app-shell' }, [
      el('div', { class: 'app-body' }, [
        sidebar.render(),
        outlet,
      ]),
    ]);

    navbar.mount(this.root);
    this.root.appendChild(layout);
    return outlet;
  }

  /**
   * Resolve a path to a mountable View instance.
   * Order: feature route (lazy module) → static page → 404.
   * @returns {Promise<import('./View.js').default>}
   */
  async _resolve(path, ctx) {
    // Feature module?
    const feature = ctx.modules.findByRoute(path);
    if (feature) {
      try {
        return await ctx.modules.instantiate(feature.id);
      } catch (err) {
        logger.error('module load failed:', err);
        return new PAGES.notFound(ctx);
      }
    }

    // Static page?
    const staticRoute = STATIC_ROUTES.find((r) => r.path === path);
    const PageClass = staticRoute ? PAGES[staticRoute.pageId] : null;
    if (PageClass) return new PageClass(ctx);

    // Fallback.
    return new PAGES.notFound(ctx);
  }
}
