/**
 * SettingsManager.js — user preferences facade.
 * One place to read/write settings (theme, language, sound, access unlock).
 * It delegates persistence to the Store (which persists via storage) and
 * coordinates the Theme/I18n managers so a single call updates everything.
 */
export default class SettingsManager {
  /**
   * @param {object} deps
   * @param {import('../core/Store.js').default} deps.store
   * @param {import('../core/EventBus.js').default} deps.bus
   * @param {ThemeManager} deps.theme
   * @param {I18nManager} deps.i18n
   */
  constructor({ store, bus, theme, i18n }) {
    this.store = store;
    this.bus = bus;
    this.theme = theme;
    this.i18n = i18n;
  }

  get(key) {
    return this.store.get(key);
  }

  all() {
    return this.store.state;
  }

  setTheme(name) {
    this.theme.apply(name);
    this.store.set({ theme: name });
  }

  toggleTheme() {
    const next = this.theme.toggle();
    this.store.set({ theme: next });
    return next;
  }

  setLanguage(lang) {
    this.i18n.apply(lang);
    this.store.set({ language: lang });
  }

  setSound(on) {
    this.store.set({ sound: !!on });
    this.bus.emit('settings:sound', !!on);
  }

  /** Access-gate unlock flag (used by the access screen added later). */
  markUnlocked(value = true) {
    this.store.set({ unlocked: !!value });
  }

  isUnlocked() {
    return !!this.store.get('unlocked');
  }
}
