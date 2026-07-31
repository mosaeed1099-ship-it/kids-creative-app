/**
 * Tag — a lightweight label used for search and filtering. Normalized to a
 * lowercase slug so "Lion", "lion" and " LION " all match.
 */
export default class Tag {
  constructor(name, { color = null, label = null } = {}) {
    this.name = String(name || '').trim();
    this.slug = Tag.slugify(this.name);
    this.label = label || this.name;
    this.color = color;
  }

  static slugify(s) {
    return String(s || '').trim().toLowerCase().replace(/\s+/g, '-');
  }

  static from(value) {
    if (value instanceof Tag) return value;
    if (typeof value === 'string') return new Tag(value);
    return new Tag(value?.name || '', value || {});
  }

  toString() { return this.slug; }
  toJSON() { return this.color || this.label !== this.name ? { name: this.name, color: this.color, label: this.label } : this.name; }
}
