/**
 * StickerStudioApp.js — the Sticker Studio controller.
 *
 * Composes the Canvas Engine (render/camera/input/export — public API only) and
 * the Content Engine (packs/categories/search/favorites/recent — public API
 * only), and owns the scene of StickerObjects, the interaction tool, unlimited
 * history, local storage and the UI. No engine/content logic is duplicated.
 */
import { CanvasEngine } from '../../engine/index.js';
import { ContentManager, Persist } from '../../content/index.js';
import { el } from '../../utils/dom.js';

import PaperObject from './scene/PaperObject.js';
import StickerObject from './scene/StickerObject.js';
import { stickerVisual } from './scene/visual.js';
import StickerTool from './interaction/StickerTool.js';
import SnapEngine from './interaction/SnapEngine.js';
import History from './history/History.js';
import { addStickerOp, deleteStickerOp, transformOp, reorderOp, snapshotTransform } from './history/commands.js';
import Storage from './io/Storage.js';
import { exportPNG, exportJPG, printScene } from './io/exportImage.js';
import StickerStudioUI from './ui/StickerStudioUI.js';

export default class StickerStudioApp {
  constructor({ mount, ctx = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.ctx = ctx;
    this.pageW = 1280;
    this.pageH = 960;
    this.pageBg = '#ffffff';
    this.stickers = [];
    this.selected = null;
    this._disposers = [];
    this._autoFit = true;
  }

  async mount() {
    this._injectCss();
    this.content = new ContentManager({
      base: new URL('./data/', import.meta.url).href,
      persist: new Persist('kcs.stickers.content'),
    });
    await this.content.init({ catalog: 'catalog.json' });
    await this.content.loadAll();

    this.history = new History({ onChange: (s) => this.ui.setHistory(s.canUndo, s.canRedo) });
    this.storage = new Storage();
    this.snap = new SnapEngine(this);

    this.ui = new StickerStudioUI(this);
    this.root = this.ui.build();
    document.body.appendChild(this.root); // full-screen overlay (route containers use transforms)

    this.engine = new CanvasEngine(this.ui.stage, { background: null, cameraControls: true, onDemand: true, maxDPR: 2 }).mount();
    this.paper = new PaperObject(this);
    this.engine.objects.add(this.paper);
    this.engine.tools.register(new StickerTool(this));
    this.engine.tools.activate('sticker');

    this._wire();
    this._bindKeys();

    const auto = this.storage.loadAuto();
    if (auto) await this.openScene(auto, { silent: true });

    requestAnimationFrame(() => this.fitPage());
    return this;
  }

  _wire() {
    this._disposers.push(this.engine.events.on('camera:change', () => {
      this.ui.setZoom(this.zoomPercent);
      if (!this._fitting) this._autoFit = false; // a genuine user pan/zoom locks auto-fit
    }));
    this._disposers.push(this.engine.events.on('resize', ({ w, h }) => { if (this._autoFit && w > 40 && h > 40) this.fitPage(); }));
    if (this._cssLink) this._cssLink.addEventListener('load', () => { if (this._autoFit) requestAnimationFrame(() => this.fitPage()); });
    // safety nets: the stylesheet loads async, so re-fit once the stage is sized
    [120, 400].forEach((ms) => setTimeout(() => { if (this._autoFit) this.fitPage(); }, ms));
  }

  _injectCss() {
    const id = 'ss-styles';
    if (document.getElementById(id)) return;
    this._cssLink = el('link', { id, attrs: { rel: 'stylesheet', href: new URL('./styles/sticker-studio.css', import.meta.url).href } });
    document.head.appendChild(this._cssLink);
  }

  destroy() {
    this._disposers.splice(0).forEach((d) => { try { d(); } catch { /* ignore */ } });
    window.removeEventListener('keydown', this._onKey);
    clearTimeout(this._saveTimer);
    this.engine?.destroy();
    if (this.root?.parentNode) this.root.remove();
    if (this._cssLink?.parentNode) this._cssLink.remove();
  }

  // ---------- view ----------
  get zoomPercent() { return Math.round(this.engine.camera.zoom * 100); }
  fitPage() {
    this._fitting = true;
    this.engine.fit({ x: 0, y: 0, w: this.pageW, h: this.pageH }, 40);
    const c = this.engine.camera; c.setHome(c.x, c.y, c.zoom);
    this.ui.setZoom(this.zoomPercent);
    this.engine.invalidate();
    this._fitting = false;
  }
  zoomBy(f) {
    this.engine.camera.zoomAt({ x: this.engine.viewport.width / 2, y: this.engine.viewport.height / 2 }, f, this.engine.coords);
    this.engine.invalidate();
    this.ui.setZoom(this.zoomPercent);
  }

  // ---------- scene refresh ----------
  refreshScene() {
    this.engine.layers.active.markDirty();
    this.engine.invalidate();
    this.ui.setSelectionActive(!!this.selected);
    this.requestSave();
  }
  refreshSceneLight() { this.engine.invalidate(); }

  addObjectToScene(obj) { if (!this.stickers.includes(obj)) this.stickers.push(obj); this.engine.objects.add(obj); }
  removeObjectFromScene(obj) {
    this.engine.objects.remove(obj);
    const i = this.stickers.indexOf(obj); if (i >= 0) this.stickers.splice(i, 1);
    if (this.selected === obj) this.deselect();
  }

  // ---------- selection ----------
  select(obj) { this.selected = obj; this.ui.setSelectionActive(true); this.engine.invalidate(); }
  deselect() { this.selected = null; this.ui.setSelectionActive(false); this.engine.invalidate(); }
  hitTopSticker(world) {
    const sorted = [...this.stickers].sort((a, b) => b.zIndex - a.zIndex);
    return sorted.find((o) => o.hitTest(world)) || null;
  }

  // ---------- adding stickers ----------
  async addSticker(item, opts = {}) {
    const visual = await stickerVisual(item);
    const n = this.stickers.length;
    const obj = new StickerObject(item, visual, {
      x: opts.x ?? (this.pageW / 2 + ((n % 6) - 2.5) * 26),
      y: opts.y ?? (this.pageH / 2 + ((n % 6) - 2.5) * 26),
      zIndex: this._topZ() + 1,
      scale: 1,
    });
    this.addObjectToScene(obj);
    this.pushHistory(addStickerOp(this, obj));
    this.content.open(item.id);          // mark recent (Content Engine)
    this.ui.refreshLibrary();
    this.select(obj);
    this.refreshScene();
    return obj;
  }

  _topZ() { return this.stickers.reduce((m, o) => Math.max(m, o.zIndex), 0); }
  _botZ() { return this.stickers.reduce((m, o) => Math.min(m, o.zIndex), 0); }
  _orderSnapshot() { return this.stickers.map((o) => ({ obj: o, z: o.zIndex })); }

  // ---------- selected-sticker actions ----------
  flipSelected(axis) {
    const o = this.selected; if (!o) return;
    const before = snapshotTransform(o);
    if (axis === 'h') o.flipH = !o.flipH; else o.flipV = !o.flipV;
    this.pushHistory(transformOp(this, o, before, snapshotTransform(o), 'قلب', axis === 'h' ? '↔️' : '↕️'));
    this.refreshScene();
  }
  reorderSelected(dir) {
    const o = this.selected; if (!o) return;
    const before = this._orderSnapshot();
    o.zIndex = dir === 'front' ? this._topZ() + 1 : this._botZ() - 1;
    this.pushHistory(reorderOp(this, before, this._orderSnapshot()));
    this.refreshScene();
  }
  async duplicateSelected() {
    const o = this.selected; if (!o) return;
    const visual = await stickerVisual(o.item);
    const copy = new StickerObject(o.item, visual, {
      x: o.x + 26, y: o.y + 26, scale: o.scaleX, rotation: o.rotation,
      flipH: o.flipH, flipV: o.flipV, zIndex: this._topZ() + 1,
    });
    this.addObjectToScene(copy);
    this.pushHistory(addStickerOp(this, copy));
    this.select(copy);
    this.refreshScene();
  }
  deleteSelected() {
    const o = this.selected; if (!o) return;
    this.removeObjectFromScene(o);
    this.pushHistory(deleteStickerOp(this, o));
    this.refreshScene();
  }

  // ---------- history ----------
  pushHistory(op) { this.history.push(op); }
  undo() { this.history.undo(); }
  redo() { this.history.redo(); }

  // ---------- file ----------
  serializeScene() {
    return {
      pageW: this.pageW, pageH: this.pageH, pageBg: this.pageBg,
      stickers: [...this.stickers].sort((a, b) => a.zIndex - b.zIndex).map((o) => o.serialize()),
    };
  }
  _clearScene() {
    for (const o of [...this.stickers]) this.engine.objects.remove(o);
    this.stickers = []; this.deselect();
  }
  async openScene(data, { silent = false } = {}) {
    if (!data || !Array.isArray(data.stickers)) return;
    this._clearScene();
    this.pageBg = data.pageBg || this.pageBg;
    for (const s of data.stickers) {
      const item = this.content.getContent(s.contentId);
      if (!item) continue;
      const visual = await stickerVisual(item); // eslint-disable-line no-await-in-loop
      this.addObjectToScene(new StickerObject(item, visual, s));
    }
    this.history.clear();
    this.refreshScene();
    if (!silent) { this.fitPage(); this.ui.toast('تم الفتح 📂'); }
  }
  newScene(confirmFirst = true) {
    if (confirmFirst && this.stickers.length && !window.confirm('بدء لوحة جديدة؟ سيُمسح ما لم يُحفظ.')) return;
    this._clearScene();
    this.history.clear();
    this.storage.clearAuto();
    this._autoFit = true;
    this.fitPage();
    this.refreshScene();
  }
  savePrompt() {
    const t = window.prompt('اسم اللوحة', 'ملصقاتي');
    if (t == null) return;
    const e = this.storage.save(this, t.trim() || 'ملصقاتي');
    this.ui.toast(e ? 'تم الحفظ ✅' : 'تعذّر الحفظ');
  }
  exportPNG() { exportPNG(this); this.ui.toast('تم تصدير PNG 🖼️'); }
  exportJPG() { exportJPG(this); this.ui.toast('تم تصدير JPG 📷'); }
  print() { printScene(this); }
  requestSave() { clearTimeout(this._saveTimer); this._saveTimer = setTimeout(() => this.storage.saveAuto(this), 700); }

  // ---------- keyboard ----------
  _bindKeys() {
    this._onKey = (e) => {
      if (/input|textarea/i.test(e.target.tagName)) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
      else if (meta && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selected) { e.preventDefault(); this.deleteSelected(); }
      else if (e.key === 'Escape') this.deselect();
    };
    window.addEventListener('keydown', this._onKey);
  }
}
