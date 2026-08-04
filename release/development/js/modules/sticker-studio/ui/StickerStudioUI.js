/**
 * StickerStudioUI.js — assembles the studio DOM (top bar, canvas stage, library
 * side panel, context bar) and exposes refresh hooks + a gallery modal + toasts.
 * Responsive: the library becomes a slide-in sheet on small screens.
 */
import { el, clear } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';
import TopBar from './TopBar.js';
import LibraryPanel from './LibraryPanel.js';
import ContextBar from './ContextBar.js';

export default class StickerStudioUI {
  constructor(app) { this.app = app; }

  build() {
    const app = this.app;
    this.topbar = new TopBar(app, { onToggleLibrary: () => this.toggleLibrary() });
    this.library = new LibraryPanel(app);
    this.contextbar = new ContextBar(app);

    this.stage = el('div', { class: 'ss-stage', attrs: { 'aria-label': 'لوحة الملصقات' } });
    const stageArea = el('div', { class: 'ss-stage-area' }, [this.stage, this.contextbar.build()]);

    this.scrim = el('div', { class: 'ss-scrim', on: { click: () => this.toggleLibrary(false) } });
    this.toastHost = el('div', { class: 'ss-toasts', attrs: { 'aria-live': 'polite' } });

    const body = el('div', { class: 'ss-body' }, [this.library.build().el, stageArea]);
    this.root = el('div', { class: 'ss-root', attrs: { dir: 'rtl' } }, [
      this.topbar.build(), body, this.scrim, this.toastHost,
    ]);
    return this.root;
  }

  toggleLibrary(force) {
    const open = force === undefined ? !this.root.classList.contains('lib-open') : force;
    this.root.classList.toggle('lib-open', open);
  }

  refreshLibrary() { this.library.refresh(); }
  setHistory(u, r) { this.topbar.setHistory(u, r); }
  setZoom(p) { this.topbar.setZoom(p); }
  setSelectionActive(on) { this.contextbar.setActive(on); }

  toast(msg) {
    const chip = el('div', { class: 'ss-toast', text: msg });
    this.toastHost.append(chip);
    requestAnimationFrame(() => chip.classList.add('is-in'));
    setTimeout(() => { chip.classList.remove('is-in'); setTimeout(() => chip.remove(), 300); }, 1600);
  }

  openGallery() {
    const items = this.app.storage.list();
    const grid = el('div', { class: 'ss-gallery' });
    const close = () => overlay.remove();
    const rebuild = () => {
      clear(grid);
      if (!items.length) { grid.append(el('p', { class: 'ss-empty', text: 'لا توجد لوحات محفوظة بعد.' })); return; }
      items.forEach((it) => grid.append(el('div', { class: 'ss-gcard' }, [
        el('img', { class: 'ss-gthumb', attrs: { src: it.thumb || '', alt: it.title } }),
        el('span', { class: 'ss-gname', text: it.title }),
        el('div', { class: 'ss-gactions' }, [
          iconBtn({ emoji: '📂', label: 'فتح', onClick: () => { this.app.openScene(it.data); close(); } }),
          iconBtn({ emoji: '🗑️', title: 'حذف', onClick: () => { this.app.storage.remove(it.id); items.splice(items.indexOf(it), 1); rebuild(); } }),
        ]),
      ])));
    };
    const overlay = el('div', { class: 'ss-modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'اللوحات المحفوظة' } }, [
      el('div', { class: 'ss-modal__box' }, [
        el('div', { class: 'ss-modal__head' }, [el('h2', { text: '📂 لوحاتي' }), iconBtn({ emoji: '✖️', title: 'إغلاق', onClick: close })]),
        grid,
      ]),
    ]);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    rebuild();
    this.root.append(overlay);
  }
}
