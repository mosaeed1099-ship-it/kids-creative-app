/**
 * TopBar.js — editable story title, undo/redo, zoom + fit, info panel, new/save/
 * open, and export (PNG/JPG/PDF/print).
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class TopBar {
  constructor(app) { this.app = app; }

  build() {
    const a = this.app;
    const group = (c) => el('div', { class: 'st-group' }, c);
    this.undoBtn = iconBtn({ emoji: '↶', title: 'تراجع', onClick: () => a.undo() });
    this.redoBtn = iconBtn({ emoji: '↷', title: 'إعادة', onClick: () => a.redo() });
    this.title = el('input', { class: 'st-title-input', attrs: { value: 'قصتي', 'aria-label': 'عنوان القصة', dir: 'rtl', maxlength: '40' }, on: { change: (e) => a.setMeta({ title: e.target.value }) } });
    this.zoom = el('span', { class: 'st-zoom', text: '100%' });

    this.el = el('header', { class: 'st-topbar' }, [
      el('a', { class: 'st-home', attrs: { href: '#/', title: 'الرئيسية', 'aria-label': 'الرئيسية' }, text: '🏠' }),
      this.title,
      el('div', { class: 'st-spacer' }),
      group([this.undoBtn, this.redoBtn]),
      group([iconBtn({ emoji: '➖', title: 'تصغير', onClick: () => a.zoomBy(1 / 1.2) }), this.zoom, iconBtn({ emoji: '➕', title: 'تكبير', onClick: () => a.zoomBy(1.2) }), iconBtn({ emoji: '🎯', title: 'ملاءمة', onClick: () => a.fitPage() })]),
      group([iconBtn({ emoji: 'ℹ️', title: 'معلومات القصة', onClick: () => a.ui.openInfo() }), iconBtn({ emoji: '🆕', title: 'قصة جديدة', onClick: () => a.newStory() }), iconBtn({ emoji: '💾', title: 'حفظ', onClick: () => a.saveToLibrary() }), iconBtn({ emoji: '📂', title: 'فتح', onClick: () => a.ui.openLibrary() })]),
      group([iconBtn({ emoji: '🖼️', title: 'تصدير PNG', onClick: () => a.exportPNG() }), iconBtn({ emoji: '📷', title: 'تصدير JPG', onClick: () => a.exportJPG() }), iconBtn({ emoji: '📕', title: 'تصدير PDF', onClick: () => a.exportPDF() }), iconBtn({ emoji: '🖨️', title: 'طباعة', onClick: () => a.print() })]),
    ]);
    return this.el;
  }

  setHistory(u, r) { this.undoBtn.toggleAttribute('disabled', !u); this.redoBtn.toggleAttribute('disabled', !r); }
  setZoom(p) { this.zoom.textContent = `${p}%`; }
  setTitle(t) { this.title.value = t; }
}
