/**
 * StoryCreatorApp.js — the Story Creator controller.
 *
 * Composes the Canvas Engine (render/camera/input/export — public API only) and
 * the Content Engine (sticker library — public API), and REUSES Sticker Studio
 * (StickerObject/stickerVisual) and Free Draw Studio (RasterLayer/strokeRenderer/
 * paintShape) for stickers/drawing/shapes. Owns the Story model, per-page live
 * scene, object CRUD, unlimited history, storage and the UI. No engine/content/
 * reused-module logic is duplicated.
 */
import { CanvasEngine } from '../../engine/index.js';
import { ContentManager, Persist } from '../../content/index.js';
import { el } from '../../utils/dom.js';

import Story from './model/Story.js';
import BackgroundObject from './scene/BackgroundObject.js';
import CoverObject from './scene/CoverObject.js';
import DrawObject from './scene/DrawObject.js';
import TextObject from './scene/TextObject.js';
import ShapeObject from './scene/ShapeObject.js';
import { StickerObject } from '../sticker-studio/index.js';
import { stickerVisual } from '../sticker-studio/scene/visual.js';
import { buildObject, serializeObject, loadImage } from './scene/factory.js';
import ObjectTool from './interaction/ObjectTool.js';
import DrawTool from './interaction/DrawTool.js';
import History from './history/History.js';
import { addObjOp, deleteObjOp, reorderOp, objChangeOp } from './history/commands.js';
import Storage from './io/Storage.js';
import { importImageFile } from './io/imageImport.js';
import * as ExportIO from './io/exportImage.js';
import StoryUI from './ui/StoryUI.js';

export default class StoryCreatorApp {
  constructor({ mount, ctx = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.ctx = ctx;
    this.PAGE_W = 1200;
    this.PAGE_H = 900;
    this.pageIndex = 0;
    this.objects = [];       // transformable objects on the current page
    this._pageExtras = [];   // page-specific non-transformable (drawObject)
    this.selected = null;
    this.activeStroke = null;
    this.brush = { profileId: 'brush', color: '#5b6bff', size: 26, opacity: 1 };
    this._disposers = [];
    this._autoFit = true;
  }

  get page() { return this.story.page(this.pageIndex); }

  async mount() {
    this._injectCss();
    this.stickerContent = new ContentManager({
      base: new URL('../sticker-studio/data/', import.meta.url).href,
      persist: new Persist('kcs.stickers.content'),
    });
    await this.stickerContent.init({ catalog: 'catalog.json' });
    await this.stickerContent.loadAll();

    this.history = new History({ onChange: (s) => this.ui.setHistory(s.canUndo, s.canRedo) });
    this.storage = new Storage();

    this.ui = new StoryUI(this);
    this.root = this.ui.build();
    document.body.appendChild(this.root);

    this.engine = new CanvasEngine(this.ui.stage, { background: null, cameraControls: true, onDemand: true, maxDPR: 2 }).mount();
    this.engine.tools.register(new ObjectTool(this));
    this.engine.tools.register(new DrawTool(this));
    this.bgObject = new BackgroundObject(this);
    this.coverObject = new CoverObject(this);
    this.engine.objects.add(this.bgObject);
    this._wire();
    this._bindKeys();

    const saved = this.storage.loadCurrent();
    this.story = new Story(saved);
    this.setMode('object');
    await this.loadPage(0, { fresh: true });
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('e2e')) window.__story = this;
    return this;
  }

  _wire() {
    this._disposers.push(this.engine.events.on('camera:change', () => { this.ui.setZoom(this.zoomPercent); if (!this._fitting) this._autoFit = false; }));
    this._disposers.push(this.engine.events.on('resize', ({ w, h }) => { if (this._autoFit && !this._fitting && w > 40 && h > 40) this.fitPage(); }));
    if (this._cssLink) this._cssLink.addEventListener('load', () => { if (this._autoFit) requestAnimationFrame(() => this.fitPage()); });
    [120, 420].forEach((ms) => setTimeout(() => { if (this._autoFit) this.fitPage(); }, ms));
  }
  _injectCss() {
    const id = 'st-styles'; if (document.getElementById(id)) return;
    this._cssLink = el('link', { id, attrs: { rel: 'stylesheet', href: new URL('./styles/story-creator.css', import.meta.url).href } });
    document.head.appendChild(this._cssLink);
  }
  destroy() {
    this._disposers.splice(0).forEach((d) => { try { d(); } catch { /* ignore */ } });
    window.removeEventListener('keydown', this._onKey);
    clearTimeout(this._saveTimer); clearTimeout(this._syncTimer);
    this.engine?.destroy();
    if (this.root?.parentNode) this.root.remove();
    if (this._cssLink?.parentNode) this._cssLink.remove();
  }

  // ---------- pages ----------
  async loadPage(i, { fresh = false } = {}) {
    if (!fresh) this.syncActivePage();
    this.pageIndex = Math.max(0, Math.min(this.story.length - 1, i));
    // tear down page-specific objects
    for (const o of this._pageExtras) this.engine.objects.remove(o);
    for (const o of this.objects) this.engine.objects.remove(o);
    this.objects = []; this._pageExtras = []; this.selected = null;
    this.engine.objects.remove(this.coverObject);

    // background image
    this.bgObject.img = null;
    if (this.page.bgImage) loadImage(this.page.bgImage).then((im) => { this.bgObject.img = im; this.engine.invalidate(); }).catch(() => {});
    // cover header
    if (this.story.isCover(this.pageIndex)) this.engine.objects.add(this.coverObject);

    // draw layer + objects
    const drawData = this.page.objects.find((o) => o.type === 'draw');
    this._drawObj = new DrawObject(this, drawData || {});
    this.engine.objects.add(this._drawObj); this._pageExtras.push(this._drawObj);
    for (const d of this.page.objects) {
      if (d.type === 'draw') continue;
      const obj = await buildObject(this, d); // eslint-disable-line no-await-in-loop
      if (obj) { this.engine.objects.add(obj); this.objects.push(obj); }
    }
    this._autoFit = true;
    this.deselect();
    this.ui.setPageActive(true);
    this.ui.refreshFilmstrip();
    this.ui.updatePageLabel();
    this.fitPage();
    this.updateActiveThumb();
  }
  get drawObject() { return this._drawObj; }

  syncActivePage() {
    if (!this.page) return;
    const data = this.objects.map(serializeObject);
    if (this._drawObj && this._drawObj.layer.marks.length) data.push(this._drawObj.serialize());
    this.page.objects = data;
  }
  updateActiveThumb() {
    try {
      this.page.thumb = this.engine.exporter.toDataURL({ type: 'image/jpeg', quality: 0.6, region: { x: 0, y: 0, w: this.PAGE_W, h: this.PAGE_H }, scale: 220 / this.PAGE_W });
    } catch { /* not ready */ }
  }

  addPage() { this.syncActivePage(); const { index } = this.story.addPage(this.pageIndex); this.loadPage(index); }
  deletePage() { if (!this.story.deletePage(this.pageIndex)) { this.ui.toast('لا يمكن حذف الصفحة الوحيدة'); return; } this.loadPage(Math.max(0, this.pageIndex - 1)); }
  duplicatePage() { this.syncActivePage(); const { index } = this.story.duplicatePage(this.pageIndex); this.loadPage(index); }
  movePage(dir) { const to = this.pageIndex + dir; if (this.story.movePage(this.pageIndex, to)) this.loadPage(to); }
  gotoPage(i) { this.loadPage(i); }

  // ---------- object CRUD ----------
  topZ() { return this.objects.reduce((m, o) => Math.max(m, o.zIndex), 0); }
  botZ() { return this.objects.reduce((m, o) => Math.min(m, o.zIndex), 1); }
  addObject(obj) { if (!this.objects.includes(obj)) this.objects.push(obj); this.engine.objects.add(obj); }
  removeObject(obj) { this.engine.objects.remove(obj); const i = this.objects.indexOf(obj); if (i >= 0) this.objects.splice(i, 1); if (this.selected === obj) this.deselect(); }
  hitTopObject(world) { return [...this.objects].sort((a, b) => b.zIndex - a.zIndex).find((o) => o.hitTest(world)) || null; }

  addText() { const t = new TextObject({ x: this.PAGE_W / 2, y: this.PAGE_H / 2, z: this.topZ() + 1 }); this.addObject(t); this.pushHistory(addObjOp(this, t)); this.select(t); this.afterEdit(t); this.ui.openTextEditor(t); }
  addShape(shape) { const s = new ShapeObject({ shape, x: this.PAGE_W / 2, y: this.PAGE_H / 2, z: this.topZ() + 1 }); this.addObject(s); this.pushHistory(addObjOp(this, s)); this.select(s); this.afterEdit(s); }
  async addSticker(item) {
    const v = await stickerVisual(item);
    const o = new StickerObject(item, v, { x: this.PAGE_W / 2 + (this.objects.length % 5) * 20, y: this.PAGE_H / 2, zIndex: this.topZ() + 1 });
    this.addObject(o); this.pushHistory(addObjOp(this, o)); this.stickerContent.open(item.id); this.select(o); this.afterEdit(o);
  }
  async addImageFile(file) { try { const o = await importImageFile(this, file); this.addObject(o); this.pushHistory(addObjOp(this, o)); this.select(o); this.afterEdit(o); } catch { this.ui.toast('تعذّر استيراد الصورة'); } }
  duplicateSelected() {
    const o = this.selected; if (!o) return;
    const data = { ...serializeObject(o), x: o.x + 24, y: o.y + 24, z: this.topZ() + 1 };
    buildObject(this, data).then((copy) => { if (!copy) return; this.addObject(copy); this.pushHistory(addObjOp(this, copy)); this.select(copy); this.afterEdit(copy); });
  }
  deleteSelected() { const o = this.selected; if (!o) return; this.removeObject(o); this.pushHistory(deleteObjOp(this, o)); this.afterEdit(); }
  flipSelected(axis) { const o = this.selected; if (!o || o.flipH === undefined) return; const b = this.objState(o); if (axis === 'h') o.flipH = !o.flipH; else o.flipV = !o.flipV; this.pushHistory(objChangeOp(this, o, b, this.objState(o))); this.afterEdit(o); }
  reorderSelected(dir) { const o = this.selected; if (!o) return; const before = this.objects.map((x) => ({ obj: x, z: x.zIndex })); o.zIndex = dir === 'front' ? this.topZ() + 1 : this.botZ() - 1; this.pushHistory(reorderOp(this, before, this.objects.map((x) => ({ obj: x, z: x.zIndex })))); this.afterEdit(o); }

  // ---------- selection ----------
  select(o) { this.selected = o; this.engine.invalidate(); this.ui.showInspector(o); }
  deselect() { this.selected = null; this.engine.invalidate(); this.ui.showInspector(null); }

  // ---------- object state (for undo) ----------
  objState(o) {
    const s = { x: o.x, y: o.y, sx: o.scaleX, sy: o.scaleY, rot: o.rotation, fh: o.flipH, fv: o.flipV, z: o.zIndex };
    if (o.type === 'text') Object.assign(s, { text: o.text, family: o.family, size: o.size, color: o.color, bold: o.bold, italic: o.italic, underline: o.underline, align: o.align, dir: o.dir });
    if (o.type === 'shape') Object.assign(s, { fill: o.fill, stroke: o.stroke, strokeWidth: o.strokeWidth, sides: o.sides, w: o.width, h: o.height });
    if (o.type === 'image') Object.assign(s, { crop: o.crop ? { ...o.crop } : null, w: o.width, h: o.height });
    return s;
  }
  applyObjState(o, s) {
    o.x = s.x; o.y = s.y; o.scaleX = s.sx; o.scaleY = s.sy; o.rotation = s.rot; o.flipH = s.fh; o.flipV = s.fv; o.zIndex = s.z;
    if (o.type === 'text') o.setText({ text: s.text, family: s.family, size: s.size, color: s.color, bold: s.bold, italic: s.italic, underline: s.underline, align: s.align, dir: s.dir });
    if (o.type === 'shape') { o.fill = s.fill; o.stroke = s.stroke; o.strokeWidth = s.strokeWidth; o.sides = s.sides; o.width = s.w; o.height = s.h; }
    if (o.type === 'image') { o.crop = s.crop; o.width = s.w; o.height = s.h; }
  }
  /** Commit an already-applied edit to the selected object as one undo step. */
  commitObjectChange(before) { const o = this.selected; if (!o) return; this.pushHistory(objChangeOp(this, o, before, this.objState(o))); this.afterEdit(o); }

  /** Apply text/style props to a text object as one undo step. */
  applyText(obj, props) { const b = this.objState(obj); obj.setText(props); this.pushHistory(objChangeOp(this, obj, b, this.objState(obj))); this.afterEdit(obj); }

  /** Apply a crop rectangle (natural pixels) to an image object. */
  applyCrop(obj, crop) {
    const b = this.objState(obj);
    obj.crop = crop;
    obj.height = obj.width * (crop.h / crop.w);
    this.pushHistory(objChangeOp(this, obj, b, this.objState(obj)));
    this.afterEdit(obj);
  }

  // ---------- background / meta ----------
  setBgColor(hex) { this.page.bgColor = hex; this.engine.invalidate(); this.afterEdit(); }
  async setBgImageFile(file) {
    try {
      const { fileToStoredDataUrl } = await import('./io/bgImage.js');
      const src = await fileToStoredDataUrl(file);
      this.page.bgImage = src; this.bgObject.img = await loadImage(src);
      this.engine.invalidate(); this.afterEdit();
    } catch { this.ui.toast('تعذّر تعيين الخلفية'); }
  }
  clearBgImage() { this.page.bgImage = null; this.bgObject.img = null; this.engine.invalidate(); this.afterEdit(); }
  setMeta(patch) { Object.assign(this.story.meta, patch); this.ui.setTitle(this.story.meta.title); this.engine.invalidate(); this.requestSave(); }

  // ---------- history / lifecycle ----------
  pushHistory(op) { this.history.push(op); }
  undo() { this.history.undo(); }
  redo() { this.history.redo(); }
  afterEdit(o) {
    this.engine.layers.active.markDirty(); this.engine.invalidate();
    if (o) this.ui.refreshInspector();
    this.requestSave();
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => { this.syncActivePage(); this.updateActiveThumb(); this.ui.refreshFilmstrip(); }, 180);
  }
  requestSave() { clearTimeout(this._saveTimer); this._saveTimer = setTimeout(() => { this.syncActivePage(); this.updateActiveThumb(); this.storage.saveAuto(this); }, 600); }

  // ---------- modes / brush ----------
  setMode(mode) { this.mode = mode; this.engine.tools.activate(mode === 'draw' ? 'draw' : 'object'); if (mode === 'draw') this.deselect(); this.ui.setMode(mode); }
  drawTemp() { if (!this._drawTempCv) { const c = document.createElement('canvas'); c.width = this.PAGE_W; c.height = this.PAGE_H; this._drawTempCv = c; } return this._drawTempCv; }

  // ---------- view ----------
  get zoomPercent() { return Math.round(this.engine.camera.zoom * 100); }
  fitPage() {
    this._fitting = true;
    this.engine.viewport.resize();
    this.engine.fit({ x: 0, y: 0, w: this.PAGE_W, h: this.PAGE_H }, 40);
    const c = this.engine.camera; c.setHome(c.x, c.y, c.zoom);
    this.ui.setZoom(this.zoomPercent); this.engine.invalidate();
    this._fitting = false;
  }
  zoomBy(f) { this.engine.camera.zoomAt({ x: this.engine.viewport.width / 2, y: this.engine.viewport.height / 2 }, f, this.engine.coords); this.engine.invalidate(); this.ui.setZoom(this.zoomPercent); }

  // ---------- file ----------
  newStory(confirmFirst = true) {
    if (confirmFirst && !window.confirm('بدء قصة جديدة؟ سيُحفظ ما تعمل عليه في مكتبتك أولاً إن أردت.')) return;
    this.story = new Story(null); this.history.clear(); this.storage.clearCurrent();
    this.loadPage(0, { fresh: true }); this.ui.setTitle(this.story.meta.title); this.ui.toast('قصة جديدة 📖');
  }
  async saveToLibrary() {
    this.syncActivePage();
    const thumb = await ExportIO.pageThumb(this, this.story.page(this.story.coverIndex), this.story.coverIndex, 260).catch(() => null);
    const e = this.storage.saveToLibrary(this, thumb);
    this.ui.toast(e ? 'تم الحفظ في المكتبة ✅' : 'تعذّر الحفظ');
  }
  openStory(data) { if (!data) return; this.story = new Story(data); this.history.clear(); this.loadPage(0, { fresh: true }); this.ui.setTitle(this.story.meta.title); this.ui.toast('تم الفتح 📂'); }
  exportPNG() { ExportIO.exportPNG(this).then(() => this.ui.toast('تم تصدير PNG 🖼️')); }
  exportJPG() { ExportIO.exportJPG(this).then(() => this.ui.toast('تم تصدير JPG 📷')); }
  exportPDF() { this.ui.toast('جارٍ إنشاء PDF…'); ExportIO.exportPDF(this).then(() => this.ui.toast('تم تصدير PDF 📄')); }
  print() { ExportIO.printStory(this); }

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
