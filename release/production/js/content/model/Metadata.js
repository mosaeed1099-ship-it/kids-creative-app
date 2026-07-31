/**
 * Metadata — descriptive, non-classifying info attached to items/packs.
 * Kept separate so classification (type/age/difficulty) stays clean.
 */
export default class Metadata {
  constructor({ author = '', source = '', version = 1, createdAt = null, updatedAt = null, extra = {} } = {}) {
    this.author = author;
    this.source = source;
    this.version = version;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.extra = extra || {};
  }

  static fromJSON(o) { return new Metadata(o || {}); }
  toJSON() {
    return {
      author: this.author, source: this.source, version: this.version,
      createdAt: this.createdAt, updatedAt: this.updatedAt, extra: this.extra,
    };
  }
}
