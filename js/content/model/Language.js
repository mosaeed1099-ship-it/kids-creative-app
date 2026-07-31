/**
 * Language — supported content languages + text direction. Extensible.
 */
export const Language = Object.freeze({
  AR: 'ar',
  EN: 'en',

  values() { return ['ar', 'en']; },
  isValid(v) { return this.values().includes(v); },
  dir(v) { return v === 'ar' ? 'rtl' : 'ltr'; },
  label(v) { return { ar: 'العربية', en: 'English' }[v] || v; },
});

export default Language;
