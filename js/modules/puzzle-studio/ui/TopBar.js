/**
 * TopBar.js — home, title, undo/redo, zoom + fit, new puzzle, export PNG/JPG,
 * print, and a timer on/off toggle.
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class TopBar {
  constructor(app) { this.app = app; }

  build() {
    const a = this.app;
    const group = (c) => el('div', { class: 'pz-group' }, c);
    this.undoBtn = iconBtn({ emoji: '↶', title: 'تراجع', onClick: () => a.undo() });
    this.redoBtn = iconBtn({ emoji: '↷', title: 'إعادة', onClick: () => a.redo() });
    this.zoomLabel = el('span', { class: 'pz-zoom', text: '100%' });
    this.timerBtn = iconBtn({ emoji: '⏱️', title: 'المؤقّت', active: a.timerEnabled, onClick: () => a.toggleTimer() });

    this.el = el('header', { class: 'pz-topbar' }, [
      el('a', { class: 'pz-home', attrs: { href: '#/', title: 'الرئيسية', 'aria-label': 'الرئيسية' }, text: '🏠' }),
      el('h1', { class: 'pz-title', text: 'الألغاز' }),
      el('div', { class: 'pz-spacer' }),
      group([this.undoBtn, this.redoBtn]),
      group([
        iconBtn({ emoji: '➖', title: 'تصغير', onClick: () => a.zoomBy(1 / 1.2) }),
        this.zoomLabel,
        iconBtn({ emoji: '➕', title: 'تكبير', onClick: () => a.zoomBy(1.2) }),
        iconBtn({ emoji: '🎯', title: 'ملاءمة', onClick: () => a.fitPage() }),
      ]),
      group([
        iconBtn({ emoji: '🧩', title: 'لغز جديد', onClick: () => a.newPuzzle() }),
        iconBtn({ emoji: '🖼️', title: 'تصدير PNG', onClick: () => a.exportPNG() }),
        iconBtn({ emoji: '📷', title: 'تصدير JPG', onClick: () => a.exportJPG() }),
        iconBtn({ emoji: '🖨️', title: 'طباعة', onClick: () => a.print() }),
      ]),
      this.timerBtn,
    ]);
    return this.el;
  }

  setHistory(u, r) { this.undoBtn.toggleAttribute('disabled', !u); this.redoBtn.toggleAttribute('disabled', !r); }
  setZoom(p) { this.zoomLabel.textContent = `${p}%`; }
  setTimerEnabled(on) { this.timerBtn.classList.toggle('is-active', on); }
}
