/**
 * Thumbnail — a preview for an item/pack. Can be an image path, an emoji, an
 * inline SVG string, or just a colored placeholder. `resolve(base)` turns a
 * relative image path into an absolute URL against a base.
 */
export default class Thumbnail {
  /** @param {object} o - { type:'image'|'emoji'|'svg'|'color', value/src, color } */
  constructor(o = {}) {
    this.type = o.type || (o.src ? 'image' : o.value ? 'emoji' : 'color');
    this.src = o.src || null;         // for type 'image'
    this.value = o.value || null;     // emoji char or svg string
    this.color = o.color || '#e6e6ef';
    this.width = o.width || null;
    this.height = o.height || null;
  }

  isImage() { return this.type === 'image'; }
  isEmoji() { return this.type === 'emoji'; }
  isSvg() { return this.type === 'svg'; }

  /** Absolute URL for image thumbnails (no-op for other types). */
  resolve(base = '') {
    if (this.type === 'image' && this.src && base) {
      try { return new URL(this.src, base).href; } catch (_) { return this.src; }
    }
    return this.src;
  }

  static fromJSON(o) { return new Thumbnail(o || {}); }
  toJSON() {
    return { type: this.type, src: this.src, value: this.value, color: this.color, width: this.width, height: this.height };
  }
}
