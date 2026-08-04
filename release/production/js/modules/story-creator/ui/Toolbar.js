/**
 * Toolbar.js — the left tool rail: select vs draw mode, add text/sticker/image/
 * shape, and page background colour/image. Uses hidden file inputs for imports.
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class Toolbar {
  constructor(app) { this.app = app; }

  build() {
    const a = this.app;
    this.imgInput = el('input', { attrs: { type: 'file', accept: 'image/*', hidden: 'true' }, on: { change: (e) => { const f = e.target.files[0]; if (f) a.addImageFile(f); e.target.value = ''; } } });
    this.bgInput = el('input', { attrs: { type: 'file', accept: 'image/*', hidden: 'true' }, on: { change: (e) => { const f = e.target.files[0]; if (f) a.setBgImageFile(f); e.target.value = ''; } } });
    this.bgColor = el('input', { attrs: { type: 'color', value: '#eaf4ff', hidden: 'true' }, on: { input: (e) => a.setBgColor(e.target.value) } });

    this.selectBtn = iconBtn({ emoji: '👆', label: 'تحديد', onClick: () => a.setMode('object') });
    this.drawBtn = iconBtn({ emoji: '✏️', label: 'رسم', onClick: () => a.setMode('draw') });

    this.el = el('div', { class: 'st-rail', attrs: { role: 'toolbar', 'aria-label': 'الأدوات' } }, [
      this.selectBtn, this.drawBtn,
      el('div', { class: 'st-rail__sep' }),
      iconBtn({ emoji: '🔤', label: 'نص', onClick: () => a.addText() }),
      iconBtn({ emoji: '⭐', label: 'ملصق', onClick: () => a.ui.openStickerPicker() }),
      iconBtn({ emoji: '🖼️', label: 'صورة', onClick: () => this.imgInput.click() }),
      iconBtn({ emoji: '⬛', label: 'شكل', onClick: () => a.ui.openShapePicker() }),
      el('div', { class: 'st-rail__sep' }),
      iconBtn({ emoji: '🎨', label: 'لون', title: 'لون الخلفية', onClick: () => { this.bgColor.value = a.page.bgColor || '#ffffff'; this.bgColor.click(); } }),
      iconBtn({ emoji: '🌄', label: 'خلفية', title: 'صورة خلفية', onClick: () => this.bgInput.click() }),
      iconBtn({ emoji: '🚫', label: 'بلا', title: 'إزالة الخلفية', onClick: () => a.clearBgImage() }),
      this.imgInput, this.bgInput, this.bgColor,
    ]);
    this.refresh();
    return this.el;
  }

  refresh() {
    const draw = this.app.mode === 'draw';
    this.selectBtn.classList.toggle('is-active', !draw);
    this.drawBtn.classList.toggle('is-active', draw);
  }
}
