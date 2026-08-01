/**
 * TopBar.js — title, file actions (new/open/save/PNG/JPG/print), undo/redo,
 * zoom + fit, and a library toggle on small screens.
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class TopBar {
  constructor(app, { onToggleLibrary }) { this.app = app; this.onToggleLibrary = onToggleLibrary; }

  build() {
    const a = this.app;
    const group = (c) => el('div', { class: 'ss-group' }, c);
    this.undoBtn = iconBtn({ emoji: '↶', title: 'تراجع', onClick: () => a.undo() });
    this.redoBtn = iconBtn({ emoji: '↷', title: 'إعادة', onClick: () => a.redo() });
    this.zoomLabel = el('span', { class: 'ss-zoom', text: '100%' });

    this.el = el('header', { class: 'ss-topbar' }, [
      el('a', { class: 'ss-home', attrs: { href: '#/', title: 'الرئيسية', 'aria-label': 'الرئيسية' }, text: '🏠' }),
      el('h1', { class: 'ss-title', text: 'الملصقات' }),
      el('div', { class: 'ss-spacer' }),
      group([this.undoBtn, this.redoBtn]),
      group([
        iconBtn({ emoji: '➖', title: 'تصغير', onClick: () => a.zoomBy(1 / 1.2) }),
        this.zoomLabel,
        iconBtn({ emoji: '➕', title: 'تكبير', onClick: () => a.zoomBy(1.2) }),
        iconBtn({ emoji: '🎯', title: 'ملاءمة', onClick: () => a.fitPage() }),
      ]),
      group([
        iconBtn({ emoji: '📄', title: 'جديد', onClick: () => a.newScene(true) }),
        iconBtn({ emoji: '📂', title: 'فتح', onClick: () => a.ui.openGallery() }),
        iconBtn({ emoji: '💾', title: 'حفظ', onClick: () => a.savePrompt() }),
        iconBtn({ emoji: '🖼️', title: 'تصدير PNG', onClick: () => a.exportPNG() }),
        iconBtn({ emoji: '📷', title: 'تصدير JPG', onClick: () => a.exportJPG() }),
        iconBtn({ emoji: '🖨️', title: 'طباعة', onClick: () => a.print() }),
      ]),
      iconBtn({ emoji: '⭐', title: 'الملصقات', cls: 'ss-lib-toggle', onClick: () => this.onToggleLibrary?.() }),
    ]);
    return this.el;
  }

  setHistory(u, r) { this.undoBtn.toggleAttribute('disabled', !u); this.redoBtn.toggleAttribute('disabled', !r); }
  setZoom(p) { this.zoomLabel.textContent = `${p}%`; }
}
