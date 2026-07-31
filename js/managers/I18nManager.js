/**
 * I18nManager.js — lightweight internationalization + text direction.
 * The product is Arabic-first (RTL) but built bilingual-ready. Dictionaries
 * are plain objects; add a language by adding a key. Sets <html lang/dir>.
 */
const DICTIONARIES = {
  ar: {
    dir: 'rtl',
    'app.title': 'استوديو إبداع الأطفال',
    'nav.home': 'الرئيسية',
    'nav.settings': 'الإعدادات',
    'dashboard.subtitle': 'اختر نشاطًا وابدأ الإبداع',
    'common.back': 'رجوع',
    'common.comingSoon': 'قريبًا',
    'settings.theme': 'المظهر',
    'settings.language': 'اللغة',
    'settings.sound': 'الصوت',
    'notfound.title': 'الصفحة غير موجودة',
  },
  en: {
    dir: 'ltr',
    'app.title': 'Kids Creative Studio',
    'nav.home': 'Home',
    'nav.settings': 'Settings',
    'dashboard.subtitle': 'Pick an activity and start creating',
    'common.back': 'Back',
    'common.comingSoon': 'Coming soon',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.sound': 'Sound',
    'notfound.title': 'Page not found',
  },
};

export default class I18nManager {
  constructor({ bus, storage, initial = 'ar' }) {
    this.bus = bus;
    this.storage = storage;
    this.dictionaries = DICTIONARIES;
    this.lang = storage?.get('language', initial) || initial;
  }

  get available() {
    return Object.keys(this.dictionaries);
  }

  get dir() {
    return this.dictionaries[this.lang]?.dir || 'ltr';
  }

  init() {
    this.apply(this.lang, { silent: true });
    return this;
  }

  /** Translate a key; falls back to the key itself if missing. */
  t(key) {
    return this.dictionaries[this.lang]?.[key] ?? this.dictionaries.en[key] ?? key;
  }

  apply(lang, { silent = false } = {}) {
    if (!this.dictionaries[lang]) return;
    this.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', this.dir);
    if (this.storage) this.storage.set('language', lang);
    if (!silent && this.bus) this.bus.emit('i18n:changed', lang);
  }
}
