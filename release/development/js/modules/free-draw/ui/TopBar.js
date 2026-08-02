/**
 * TopBar.js — title, file actions (new/open/save/PNG/JPG/print), undo/redo,
 * zoom + rotate controls, an FPS badge, and (on small screens) a panels toggle.
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class TopBar {
  constructor(app, { onTogglePanels }) { this.app = app; this.onTogglePanels = onTogglePanels; }

  build() {
    const a = this.app;
    const group = (children) => el('div', { class: 'fd-group' }, children);

    this.undoBtn = iconBtn({ emoji: '↶', title: 'تراجع', onClick: () => a.undo() });
    this.redoBtn = iconBtn({ emoji: '↷', title: 'إعادة', onClick: () => a.redo() });

    this.zoomLabel = el('span', { class: 'fd-zoom', text: '100%' });
    const zoomOut = iconBtn({ emoji: '➖', title: 'تصغير', onClick: () => a.nav.zoomOut() });
    const zoomIn = iconBtn({ emoji: '➕', title: 'تكبير', onClick: () => a.nav.zoomIn() });
    const rotL = iconBtn({ emoji: '↺', title: 'تدوير لليسار', onClick: () => a.nav.rotateLeft() });
    const rotR = iconBtn({ emoji: '↻', title: 'تدوير لليمين', onClick: () => a.nav.rotateRight() });
    const reset = iconBtn({ emoji: '🎯', title: 'إعادة ضبط العرض', onClick: () => a.nav.resetView() });

    this.fps = el('span', { class: 'fd-fps', title: 'الأداء (إطار/ثانية)', text: '—' });

    const actions = group([
      iconBtn({ emoji: '📄', title: 'رسمة جديدة', onClick: () => a.newDoc(true) }),
      iconBtn({ emoji: '📂', title: 'فتح', onClick: () => a.ui.openGallery() }),
      iconBtn({ emoji: '💾', title: 'حفظ', onClick: () => a.savePrompt() }),
      iconBtn({ emoji: '🖼️', title: 'تصدير PNG', onClick: () => a.exportPNG() }),
      iconBtn({ emoji: '📷', title: 'تصدير JPG', onClick: () => a.exportJPG() }),
      iconBtn({ emoji: '🖨️', title: 'طباعة', onClick: () => a.print() }),
    ]);

    const panelsToggle = iconBtn({ emoji: '🎛️', title: 'اللوحات', cls: 'fd-panels-toggle', onClick: () => this.onTogglePanels?.() });

    this.el = el('header', { class: 'fd-topbar' }, [
      el('a', { class: 'fd-home', attrs: { href: '#/', title: 'الرئيسية', 'aria-label': 'الرئيسية' } }, ['🏠']),
      el('h1', { class: 'fd-title', text: 'الرسم الحر' }),
      el('div', { class: 'fd-topbar__spacer' }),
      group([this.undoBtn, this.redoBtn]),
      group([zoomOut, this.zoomLabel, zoomIn, rotL, rotR, reset]),
      actions,
      this.fps,
      panelsToggle,
    ]);
    return this.el;
  }

  setHistoryState(canUndo, canRedo) {
    this.undoBtn.toggleAttribute('disabled', !canUndo);
    this.redoBtn.toggleAttribute('disabled', !canRedo);
  }
  setZoom(pct) { this.zoomLabel.textContent = `${pct}%`; }
  setFps(n) { this.fps.textContent = `${n} FPS`; }
}
