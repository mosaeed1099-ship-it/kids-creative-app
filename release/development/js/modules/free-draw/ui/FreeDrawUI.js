/**
 * FreeDrawUI.js — assembles the whole studio DOM (top bar, tool rail, canvas
 * stage, side panels, selection bar) and exposes refresh hooks the app calls.
 * Responsive: on small screens the side panels become a slide-in sheet.
 */
import { el, clear } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';
import TopBar from './TopBar.js';
import Toolbar from './Toolbar.js';
import ColorPanel from './ColorPanel.js';
import BrushPanel from './BrushPanel.js';
import ShapePanel from './ShapePanel.js';
import LayersPanel from './LayersPanel.js';
import HistoryPanel from './HistoryPanel.js';
import SelectionBar from './SelectionBar.js';

export default class FreeDrawUI {
  constructor(app) { this.app = app; }

  build() {
    const app = this.app;
    this.topbar = new TopBar(app, { onTogglePanels: () => this.togglePanels() });
    this.toolbar = new Toolbar(app);
    this.colorPanel = new ColorPanel(app);
    this.brushPanel = new BrushPanel(app);
    this.shapePanel = new ShapePanel(app);
    this.layersPanel = new LayersPanel(app);
    this.historyPanel = new HistoryPanel(app);
    this.selectionBar = new SelectionBar(app);

    this.stage = el('div', { class: 'fd-stage', attrs: { 'aria-label': 'لوحة الرسم' } });
    const stageArea = el('div', { class: 'fd-stage-area' }, [this.stage, this.selectionBar.build()]);

    this.side = el('aside', { class: 'fd-side', attrs: { 'aria-label': 'اللوحات' } }, [
      this.colorPanel.build(),
      this.brushPanel.build(),
      this.shapePanel.build(),
      this.layersPanel.build(),
      this.historyPanel.build(),
    ]);
    this.shapePanel.el.hidden = true;

    this.scrim = el('div', { class: 'fd-scrim', on: { click: () => this.togglePanels(false) } });
    this.toastHost = el('div', { class: 'fd-toasts', attrs: { 'aria-live': 'polite' } });

    const body = el('div', { class: 'fd-body' }, [this.toolbar.build(), stageArea, this.side]);
    this.root = el('div', { class: 'fd-root', attrs: { dir: 'rtl' } }, [
      this.topbar.build(), body, this.scrim, this.toastHost,
    ]);
    return this.root;
  }

  // ---- responsive panel sheet ----
  togglePanels(force) {
    const open = force === undefined ? !this.root.classList.contains('panels-open') : force;
    this.root.classList.toggle('panels-open', open);
  }

  // ---- refresh hooks ----
  refreshColors() { this.colorPanel.refresh(); this.brushPanel.drawPreview(); }
  refreshBrush() { this.brushPanel.refresh(); }
  refreshTools() { this.toolbar.refresh(); this.brushPanel.drawPreview(); }
  refreshShapes() { this.shapePanel.refresh(); }
  refreshLayers() { this.layersPanel.refresh(); }
  refreshHistory() { this.historyPanel.refresh(); }
  setHistoryState(u, r) { this.topbar.setHistoryState(u, r); this.historyPanel.setState(u, r); }
  setZoom(p) { this.topbar.setZoom(p); }
  setFps(n) { this.topbar.setFps(n); }
  setSelectionActive(on) { this.selectionBar.setActive(on); }
  setShapePanelVisible(on) { this.shapePanel.el.hidden = !on; }

  toast(msg) {
    const chip = el('div', { class: 'fd-toast', text: msg });
    this.toastHost.append(chip);
    requestAnimationFrame(() => chip.classList.add('is-in'));
    setTimeout(() => { chip.classList.remove('is-in'); setTimeout(() => chip.remove(), 300); }, 1600);
  }

  // ---- gallery (open/delete saved drawings) ----
  openGallery() {
    const items = this.app.storage.list();
    const grid = el('div', { class: 'fd-gallery' });
    const rebuild = () => {
      clear(grid);
      if (!items.length) { grid.append(el('p', { class: 'fd-gallery__empty', text: 'لا توجد رسمات محفوظة بعد.' })); return; }
      items.forEach((it) => {
        const card = el('div', { class: 'fd-gallery__card' }, [
          el('img', { class: 'fd-gallery__thumb', attrs: { src: it.thumb || '', alt: it.title } }),
          el('span', { class: 'fd-gallery__name', text: it.title }),
          el('div', { class: 'fd-gallery__actions' }, [
            iconBtn({ emoji: '📂', label: 'فتح', onClick: () => { this.app.openEntry(it.data); close(); } }),
            iconBtn({ emoji: '🗑️', title: 'حذف', onClick: () => { this.app.storage.remove(it.id); const i = items.indexOf(it); items.splice(i, 1); rebuild(); } }),
          ]),
        ]);
        grid.append(card);
      });
    };
    const overlay = el('div', { class: 'fd-modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'الرسمات المحفوظة' } }, [
      el('div', { class: 'fd-modal__box' }, [
        el('div', { class: 'fd-modal__head' }, [
          el('h2', { text: '📂 رسماتي' }),
          iconBtn({ emoji: '✖️', title: 'إغلاق', onClick: () => close() }),
        ]),
        grid,
      ]),
    ]);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    rebuild();
    this.root.append(overlay);
  }
}
