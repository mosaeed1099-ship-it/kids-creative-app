/**
 * app.config.js — global, build-free configuration.
 * Edit values here to rebrand or reconfigure the whole product.
 */
export const APP_CONFIG = {
  name: 'Kids Creative Studio',
  shortName: 'KCS',
  version: '1.0.0',

  /** Turn console logging on/off (set false for production). */
  debug: true,

  /** Storage namespace — keeps this product's data isolated. */
  storageNamespace: 'kcs',

  /**
   * Access gate. The real access screen is a UI concern added later;
   * this only holds the default password so it lives in one place.
   */
  access: {
    enabled: true,
    defaultPassword: '12345',
  },

  /** Branding placeholders — swapped per customer. */
  brand: {
    studioName: '[ اسم صفحتك / مركزك ]',
    contact: '01xxxxxxxxx',
    logoAsset: 'images/logo.svg', // resolved via AssetManager (optional)
  },

  /** Default UX preferences (overridable by SettingsManager). */
  defaults: {
    theme: 'light', // 'light' | 'dark'
    language: 'ar', // 'ar' | 'en'
    sound: true,
  },
};

export default APP_CONFIG;
