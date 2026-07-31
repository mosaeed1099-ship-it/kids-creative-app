/**
 * AppContext.js — the shared services container passed to every View,
 * Page and Module. Keeping this as one object means features get everything
 * they need through a single `ctx` argument (dependency injection), and we
 * never reach for globals.
 *
 * @typedef {Object} AppContext
 * @property {import('./EventBus.js').default} bus
 * @property {import('./Store.js').default} store
 * @property {import('../utils/storage.js').LocalStorageManager} storage
 * @property {import('../managers/ThemeManager.js').default} theme
 * @property {import('../managers/I18nManager.js').default} i18n
 * @property {import('../managers/AssetManager.js').default} assets
 * @property {import('../managers/SettingsManager.js').default} settings
 * @property {import('./ModuleLoader.js').default} modules
 * @property {import('./Router.js').default} router
 */

/** Freeze a context object so features can't accidentally reassign services. */
export function createContext(services) {
  return Object.freeze({ ...services });
}

export default createContext;
