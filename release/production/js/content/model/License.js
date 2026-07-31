/**
 * License — legal metadata for a content item or pack. Important for a
 * commercial product: it records where an asset came from and whether it's
 * safe to sell. Public-domain and original assets are safe; proprietary is not.
 */
const TYPES = {
  'original': { safeToSell: true, attribution: false, label: 'Original' },
  'public-domain': { safeToSell: true, attribution: false, label: 'Public Domain' },
  'cc-by': { safeToSell: true, attribution: true, label: 'CC BY' },
  'cc-by-sa': { safeToSell: true, attribution: true, label: 'CC BY-SA' },
  'cc0': { safeToSell: true, attribution: false, label: 'CC0' },
  'proprietary': { safeToSell: false, attribution: true, label: 'Proprietary' },
};

export default class License {
  constructor({ type = 'original', author = '', url = '', note = '' } = {}) {
    this.type = TYPES[type] ? type : 'original';
    this.author = author;
    this.url = url;
    this.note = note;
  }

  get info() { return TYPES[this.type]; }
  get safeToSell() { return this.info.safeToSell; }
  get attributionRequired() { return this.info.attribution; }
  get label() { return this.info.label; }

  static types() { return Object.keys(TYPES); }
  static fromJSON(o) { return new License(o || {}); }
  toJSON() { return { type: this.type, author: this.author, url: this.url, note: this.note }; }
}
