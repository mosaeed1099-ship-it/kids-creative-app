/**
 * ColorPanel.js — the full colour system UI: HSV wheel, HEX/RGB/HSL inputs,
 * eyedropper, current swatch + favourite star, and rows for recent, favourite
 * and preset-palette colours. Reads/writes app.colors (ColorManager).
 */
import { el, clear } from '../../../utils/dom.js';
import { section, swatch, iconBtn } from './helpers.js';
import ColorWheel from './ColorWheel.js';
import { hexToRgb, rgbToHex, hexToHsl, hslToHex } from '../color/colorConvert.js';

export default class ColorPanel {
  constructor(app) { this.app = app; }

  build() {
    const colors = this.app.colors;
    this.wheel = new ColorWheel({ onPick: (hex) => this.app.colors.set(hex) });

    this.current = el('button', { class: 'fd-current', attrs: { title: 'اللون الحالي', 'aria-label': 'اللون الحالي' } });
    this.star = iconBtn({ emoji: '⭐', title: 'إضافة للمفضلة', cls: 'fd-star', onClick: () => colors.toggleFavorite(colors.get()) });
    const dropper = iconBtn({ emoji: '💧', title: 'قطّارة (التقاط لون)', onClick: () => this.app.setTool('eyedropper') });

    this.hex = el('input', { class: 'fd-input fd-input--hex', attrs: { type: 'text', spellcheck: 'false', 'aria-label': 'كود اللون HEX', maxlength: '7' } });
    this.hex.addEventListener('change', () => this.app.colors.set(this.hex.value));

    this.rgb = ['r', 'g', 'b'].map((k) => this._num(k.toUpperCase(), 0, 255, () => this._fromRgb()));
    this.hsl = [['h', 360], ['s', 100], ['l', 100]].map(([k, m]) => this._num(k.toUpperCase(), 0, m, () => this._fromHsl()));

    this.recentRow = el('div', { class: 'fd-swatches' });
    this.favRow = el('div', { class: 'fd-swatches' });
    this.paletteWrap = el('div', { class: 'fd-palettes' });

    const inputs = el('div', { class: 'fd-color-inputs' }, [
      el('label', { class: 'fd-field' }, ['HEX', this.hex]),
      el('div', { class: 'fd-field-row' }, [el('span', { text: 'RGB' }), ...this.rgb]),
      el('div', { class: 'fd-field-row' }, [el('span', { text: 'HSL' }), ...this.hsl]),
    ]);

    const root = section('الألوان', '🎨', [
      el('div', { class: 'fd-color-top' }, [this.wheel.build(), el('div', { class: 'fd-color-side' }, [this.current, this.star, dropper])]),
      inputs,
      el('div', { class: 'fd-swatch-block' }, [el('span', { class: 'fd-mini-title', text: 'الأخيرة' }), this.recentRow]),
      el('div', { class: 'fd-swatch-block' }, [el('span', { class: 'fd-mini-title', text: 'المفضلة' }), this.favRow]),
      el('div', { class: 'fd-swatch-block' }, [el('span', { class: 'fd-mini-title', text: 'مجموعات جاهزة' }), this.paletteWrap]),
    ]);
    this.el = root;
    this._buildPalettes();
    this.refresh();
    return root;
  }

  _num(label, min, max, onChange) {
    const inp = el('input', { class: 'fd-input fd-input--num', attrs: { type: 'number', min: String(min), max: String(max), 'aria-label': label } });
    inp.addEventListener('change', onChange);
    inp._label = label;
    return inp;
  }

  _fromRgb() {
    const [r, g, b] = this.rgb.map((i) => Math.max(0, Math.min(255, +i.value || 0)));
    this.app.colors.set(rgbToHex({ r, g, b }));
  }

  _fromHsl() {
    const [h, s, l] = this.hsl.map((i) => +i.value || 0);
    this.app.colors.set(hslToHex({ h, s, l }));
  }

  _buildPalettes() {
    clear(this.paletteWrap);
    for (const pal of this.app.colors.palettes) {
      const row = el('div', { class: 'fd-swatches' },
        pal.colors.map((hex) => swatch(hex, { onClick: () => this.app.colors.set(hex) })));
      this.paletteWrap.append(el('div', { class: 'fd-palette' }, [
        el('span', { class: 'fd-palette__name', text: pal.name }), row,
      ]));
    }
  }

  refresh() {
    const c = this.app.colors.get();
    this.current.style.background = c;
    this.wheel.setColor(c);
    this.hex.value = c;
    const rgb = hexToRgb(c) || { r: 0, g: 0, b: 0 };
    this.rgb[0].value = rgb.r; this.rgb[1].value = rgb.g; this.rgb[2].value = rgb.b;
    const hsl = hexToHsl(c) || { h: 0, s: 0, l: 0 };
    this.hsl[0].value = hsl.h; this.hsl[1].value = hsl.s; this.hsl[2].value = hsl.l;
    this.star.classList.toggle('is-active', this.app.colors.isFavorite(c));

    clear(this.recentRow);
    this.app.colors.recent.forEach((hex) => this.recentRow.append(swatch(hex, { active: hex === c, onClick: () => this.app.colors.set(hex) })));
    clear(this.favRow);
    this.app.colors.favorites.forEach((hex) => this.favRow.append(swatch(hex, { active: hex === c, onClick: () => this.app.colors.set(hex) })));
  }
}
