/**
 * TextObject.js — editable text with font family/size, bold/italic/underline,
 * alignment, RTL and emoji. Measures its own box for transform handles.
 */
import StoryObject from './StoryObject.js';

const M = document.createElement('canvas').getContext('2d');
const KEYS = ['text', 'family', 'size', 'color', 'bold', 'italic', 'underline', 'align', 'dir'];

export default class TextObject extends StoryObject {
  constructor(props = {}) {
    super({ ...props, type: 'text' });
    this.text = 'اكتب هنا ✏️';
    this.family = 'system-ui'; this.size = 52; this.color = '#2b2b3a';
    this.bold = false; this.italic = false; this.underline = false;
    this.align = 'center'; this.dir = 'rtl';
    this.setText(props, true);
  }

  fontStr() { return `${this.italic ? 'italic ' : ''}${this.bold ? '700 ' : '400 '}${this.size}px ${this.family}, system-ui, "Segoe UI", sans-serif`; }

  setText(p = {}, initial = false) {
    for (const k of KEYS) if (p[k] !== undefined) this[k] = p[k];
    this.remeasure();
  }

  remeasure() {
    M.font = this.fontStr();
    this._lines = String(this.text).split('\n');
    this._lh = this.size * 1.32;
    let w = 0;
    for (const ln of this._lines) w = Math.max(w, M.measureText(ln || ' ').width);
    this.width = Math.max(40, Math.ceil(w) + this.size * 0.5);
    this.height = Math.max(this.size, Math.ceil(this._lines.length * this._lh));
  }

  drawContent(ctx) {
    ctx.font = this.fontStr();
    ctx.fillStyle = this.color;
    ctx.textBaseline = 'top';
    try { ctx.direction = this.dir; } catch { /* older engines */ }
    const align = this.align === 'right' || this.align === 'end' ? 'right' : this.align === 'left' || this.align === 'start' ? 'left' : 'center';
    ctx.textAlign = align;
    const ax = align === 'center' ? this.width / 2 : align === 'right' ? this.width - this.size * 0.15 : this.size * 0.15;
    this._lines.forEach((ln, i) => {
      const y = i * this._lh + (this._lh - this.size) / 2;
      ctx.fillText(ln, ax, y);
      if (this.underline && ln) {
        const tw = M.measureText(ln).width;
        const ux = align === 'center' ? ax - tw / 2 : align === 'right' ? ax - tw : ax;
        ctx.fillRect(ux, y + this.size * 1.04, tw, Math.max(1, this.size * 0.06));
      }
    });
  }

  serialize() {
    return { ...this.baseSerialize(), text: this.text, family: this.family, size: this.size, color: this.color, bold: this.bold, italic: this.italic, underline: this.underline, align: this.align, dir: this.dir };
  }
}
