/**
 * FreeDrawApp.js — the Free Draw Studio controller.
 *
 * Composes the Canvas Engine (rendering / camera / input / render-loop / export)
 * and the module's own systems (document + raster layers, unlimited history,
 * colour, settings, navigation, selection, UI) — consuming ONLY the engine's
 * public API. It owns the live-stroke pipeline and wires every tool + panel.
 *
 * Rendering model: each layer is an offscreen bitmap blitted by a SceneObject
 * (fast, O(layers) per frame); each stroke/shape is also kept as vector data so
 * undo/redo is unlimited and cheap. The engine renders on-demand (lazy).
 */
import { CanvasEngine } from '../../engine/index.js';
import { el } from '../../utils/dom.js';
import { clamp, dist } from './util/geometry.js';

import Document from './document/Document.js';
import RasterLayer from './layers/RasterLayer.js';
import Settings from './state/Settings.js';
import ColorManager from './color/ColorManager.js';
import MarkHistory from './history/MarkHistory.js';
import { addMarkOp, addLayerOp, deleteLayerOp, reorderLayerOp, bitmapOp } from './history/commands.js';
import ViewTransform from './view/ViewTransform.js';
import NavigationController from './view/NavigationController.js';
import Storage from './io/Storage.js';
import { exportPNG, exportJPG, printArtwork } from './io/exportImage.js';
import { rgbToHex } from './color/colorConvert.js';

import { makeStrokeMark, makeShapeMark } from './marks/Mark.js';
import { paintStroke, compositeScratch } from './brushes/strokeRenderer.js';
import { getProfile, BRUSH_ORDER } from './brushes/brushProfiles.js';

import PencilTool from './tools/PencilTool.js';
import BrushTool from './tools/BrushTool.js';
import MarkerTool from './tools/MarkerTool.js';
import CrayonTool from './tools/CrayonTool.js';
import CalligraphyTool from './tools/CalligraphyTool.js';
import AirbrushTool from './tools/AirbrushTool.js';
import EraserTool from './tools/EraserTool.js';
import ShapeTool from './tools/ShapeTool.js';
import EyedropperTool from './tools/EyedropperTool.js';
import HandTool from './tools/HandTool.js';
import SelectTool from './tools/SelectTool.js';
import SelectionController from './tools/SelectionController.js';
import FreeDrawUI from './ui/FreeDrawUI.js';

const DOC_W = 1600;
const DOC_H = 1200;

export default class FreeDrawApp {
  constructor({ mount, ctx = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.ctx = ctx;
    this.activeStroke = null;
    this.previewShape = null;
    this._lastDrawTool = 'brush';
    this._disposers = [];
  }

  // ---------- lifecycle ----------
  mount() {
    this._injectCss();
    this.settings = new Settings({ onChange: () => { this.ui.refreshBrush(); this.ui.refreshShapes(); } });
    this.colors = new ColorManager({ onChange: () => this.ui.refreshColors() });
    this.history = new MarkHistory({ onChange: (s) => { this.ui.setHistoryState(s.canUndo, s.canRedo); this.ui.refreshHistory(); } });

    this.ui = new FreeDrawUI(this);
    this.root = this.ui.build();
    // The studio is a full-screen fixed overlay. App route containers use CSS
    // transforms (which trap position:fixed), so we mount on <body> to pin to
    // the viewport. It is removed again in destroy(), tied to module unmount.
    document.body.appendChild(this.root);

    this.engine = new CanvasEngine(this.ui.stage, {
      background: null, cameraControls: false, onDemand: true, maxDPR: 2,
    }).mount();

    this.view = new ViewTransform(this);
    this.doc = new Document(this, { w: DOC_W, h: DOC_H, paper: '#ffffff' });
    this.doc.attach(this.engine);

    this.nav = new NavigationController(this);
    this.selection = new SelectionController(this);
    this.storage = new Storage();

    this._registerTools();
    this._wireEngine();
    this._bindKeys();

    // restore autosave if present, else start fresh
    const auto = this.storage.loadAuto();
    if (auto) this.doc.load(auto);

    this.setTool(BRUSH_ORDER.includes(this.settings.get('tool')) ? this.settings.get('tool') : 'brush');
    this.ui.refreshColors();
    this.ui.refreshBrush();
    this.ui.refreshLayers();
    this.ui.refreshHistory();

    // fit after layout settles
    requestAnimationFrame(() => this.fitPage());
    this._fpsTimer = setInterval(() => this.ui.setFps(this.engine.perf.fps || 0), 500);
    return this;
  }

  _registerTools() {
    [PencilTool, BrushTool, MarkerTool, CrayonTool, CalligraphyTool, AirbrushTool, EraserTool,
      ShapeTool, EyedropperTool, HandTool, SelectTool].forEach((T) => this.engine.tools.register(new T(this)));
  }

  _wireEngine() {
    this._autoFit = true;
    const off1 = this.engine.events.on('camera:change', () => this.ui.setZoom(this.nav.zoomPercent));
    // Re-fit the page whenever the stage gets a real size (the stylesheet loads
    // asynchronously), until the child first draws or navigates.
    const off2 = this.engine.events.on('resize', ({ w, h }) => { if (this._autoFit && w > 40 && h > 40) this.fitPage(); });
    this._disposers.push(off1, off2);
    if (this._cssLink) this._cssLink.addEventListener('load', () => { if (this._autoFit) requestAnimationFrame(() => this.fitPage()); });
  }

  _injectCss() {
    const id = 'fd-styles';
    if (document.getElementById(id)) return;
    const href = new URL('./styles/free-draw.css', import.meta.url).href;
    this._cssLink = el('link', { id, attrs: { rel: 'stylesheet', href } });
    document.head.appendChild(this._cssLink);
  }

  destroy() {
    clearInterval(this._fpsTimer);
    this._disposers.splice(0).forEach((d) => { try { d(); } catch { /* ignore */ } });
    window.removeEventListener('keydown', this._onKey);
    this.nav?.destroy();
    this.doc?.destroy();
    this.engine?.destroy();
    if (this.root?.parentNode) this.root.remove();
    if (this._cssLink?.parentNode) this._cssLink.remove();
    this.activeStroke = null;
  }

  // ---------- view helpers ----------
  fitPage() {
    this.engine.fit({ x: 0, y: 0, w: this.doc.w, h: this.doc.h }, 48);
    const c = this.engine.camera;
    c.setHome(c.x, c.y, c.zoom);
    this.ui.setZoom(this.nav.zoomPercent);
    this.doc.syncScene();
  }

  applyDocTransform(ctx) {
    const cx = this.doc.w / 2, cy = this.doc.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(this.view.rotation);
    ctx.translate(-cx, -cy);
  }

  /** Reusable full-document scratch canvases (avoid per-frame allocation). */
  _scratch(key) {
    this._buffers = this._buffers || {};
    if (!this._buffers[key]) {
      const c = document.createElement('canvas');
      c.width = this.doc.w; c.height = this.doc.h;
      this._buffers[key] = c;
    }
    return this._buffers[key];
  }
  displayBuffer() { return this._scratch('display'); }

  // ---------- tools ----------
  setTool(id) {
    this.engine.tools.activate(id);
    if (id !== 'eyedropper' && id !== 'hand') this._lastDrawTool = id;
    if (BRUSH_ORDER.includes(id)) this.settings.set('tool', id);
    this.ui.setShapePanelVisible(id === 'shape');
    this.ui.refreshTools();
    this.ui.refreshShapes();
  }
  activeToolId() { return this.engine?.tools?.current?.id || this.settings.get('tool'); }
  restorePreviousTool() { this.setTool(this._lastDrawTool || 'brush'); }

  canDrawOnActive() { const l = this.doc.active; return !!l && l.visible && !l.locked; }
  warnLocked() { this.ui.toast('الطبقة مقفلة أو مخفية 🔒'); }

  pressureFor(p) { return this.pressureForEvent(p.native, p.pointerType); }
  pressureForEvent(ev, type) {
    if (type === 'pen') { const pr = ev.pressure; return pr > 0 ? clamp(pr, 0.06, 1) : 0.5; }
    if (type === 'touch') { const pr = ev.pressure; return (pr > 0 && pr !== 0.5) ? clamp(pr, 0.1, 1) : 0.6; }
    return 0.5; // mouse — velocity dynamics applied in extendStroke
  }

  // ---------- stroke pipeline ----------
  beginStroke(profileId, pt, pointerType) {
    this._autoFit = false;
    const layer = this.doc.active;
    const mark = makeStrokeMark({
      profileId, color: this.colors.get(),
      size: this.settings.get('size'), opacity: this.settings.get('opacity'),
      hardness: this.settings.get('hardness'), points: [pt],
    });
    const temp = this._scratch('stroke');
    const tctx = temp.getContext('2d');
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.clearRect(0, 0, this.doc.w, this.doc.h);
    tctx.globalCompositeOperation = 'source-over';
    tctx.globalAlpha = 1;
    paintStroke(tctx, mark, 0);
    this.activeStroke = {
      layer, mark, temp: { canvas: temp, ctx: tctx },
      composite: getProfile(profileId).composite, pointerType,
      lastIdx: mark.points.length, _lp: { x: pt.x, y: pt.y, t: performance.now() }, _p: null,
    };
    this.engine.invalidate();
  }

  extendStroke(points, pointerType) {
    const as = this.activeStroke;
    if (!as) return;
    const profile = getProfile(as.mark.profileId);
    for (const pt of points) {
      let pp = pt.p;
      if (pointerType !== 'pen' && profile.pressureSize) pp = this._simPressure(as, pt);
      as.mark.points.push({ x: pt.x, y: pt.y, p: pp });
    }
    paintStroke(as.temp.ctx, as.mark, as.lastIdx);
    as.lastIdx = as.mark.points.length;
    this.engine.invalidate();
  }

  _simPressure(as, pt) {
    const now = performance.now();
    const d = dist(as._lp.x, as._lp.y, pt.x, pt.y);
    const dt = Math.max(1, now - as._lp.t);
    as._lp = { x: pt.x, y: pt.y, t: now };
    const target = clamp(1 - (d / dt) * 0.09, 0.3, 1);
    as._p = as._p == null ? target : as._p * 0.5 + target * 0.5;
    return as._p;
  }

  endStroke() {
    const as = this.activeStroke;
    this.activeStroke = null;
    if (!as) return;
    if (as.mark.points.length === 0) { this.engine.invalidate(); return; }
    compositeScratch(as.layer.ctx, as.temp.canvas, as.mark);
    as.layer.marks.push(as.mark);
    this.pushHistory(addMarkOp(this, as.layer, as.mark));
    this.onSceneChanged();
  }

  cancelStroke() {
    this.engine.tools.current?.cancel?.();
    if (this.activeStroke) { this.activeStroke = null; this.engine.invalidate(); }
  }

  // ---------- shapes ----------
  beginShape(pt) {
    this._autoFit = false;
    this.previewShape = makeShapeMark({
      shape: this.settings.get('shape'), from: pt, to: pt,
      stroke: this.colors.get(), fill: this.settings.get('shapeFill') ? this.colors.get() : 'none',
      strokeWidth: this.settings.get('size'), opacity: this.settings.get('opacity'),
      sides: this.settings.get('sides'),
    });
    this.engine.invalidate();
  }
  updateShape(pt, constrain) {
    if (!this.previewShape) return;
    const m = this.previewShape;
    if (constrain && m.shape !== 'line' && m.shape !== 'arrow') {
      const s = Math.max(Math.abs(pt.x - m.from.x), Math.abs(pt.y - m.from.y));
      m.to = { x: m.from.x + Math.sign(pt.x - m.from.x || 1) * s, y: m.from.y + Math.sign(pt.y - m.from.y || 1) * s };
    } else { m.to = pt; }
    this.engine.invalidate();
  }
  commitShape() {
    const m = this.previewShape;
    this.previewShape = null;
    if (!m) return;
    if (dist(m.from.x, m.from.y, m.to.x, m.to.y) < 2) { this.engine.invalidate(); return; }
    const layer = this.doc.active;
    layer.addMark(m);
    this.pushHistory(addMarkOp(this, layer, m));
    this.onSceneChanged();
  }
  cancelShape() { this.previewShape = null; this.engine.invalidate(); }

  // ---------- eyedropper ----------
  sampleColorAt(pt) {
    const x = Math.floor(pt.x), y = Math.floor(pt.y);
    if (x < 0 || y < 0 || x >= this.doc.w || y >= this.doc.h) return null;
    for (let i = this.doc.layers.length - 1; i >= 0; i--) {
      const layer = this.doc.layers[i];
      if (!layer.visible) continue;
      const d = layer.ctx.getImageData(x, y, 1, 1).data;
      if (d[3] > 8) return rgbToHex({ r: d[0], g: d[1], b: d[2] });
    }
    return this.doc.paper;
  }

  // ---------- history ----------
  pushHistory(op) { this.history.push(op); }
  undo() { this.selection.commitIfFloating(); this.history.undo(); }
  redo() { this.selection.commitIfFloating(); this.history.redo(); }
  gotoHistory(i) { this.selection.commitIfFloating(); this.history.goto(i); }

  onSceneChanged() {
    this.doc.syncScene();
    this.requestSave();
    this._scheduleUi();
  }
  _scheduleUi() {
    if (this._uiTimer) return;
    this._uiTimer = setTimeout(() => {
      this._uiTimer = 0;
      this.ui.refreshLayers();
      this.ui.refreshHistory();
    }, 120);
  }
  requestSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.storage.saveAuto(this.doc), 800);
  }

  // ---------- layers ----------
  addLayer() {
    const at = this.doc.layers.length;
    const l = this.doc.addLayer({ name: `طبقة ${this.doc.layers.length + 1}` });
    this.pushHistory(addLayerOp(this, l, at));
    this.onSceneChanged();
  }
  duplicateActiveLayer() {
    const src = this.doc.active;
    const at = this.doc.indexOf(src) + 1;
    const copy = this.doc.duplicateLayer(src);
    this.pushHistory(addLayerOp(this, copy, at));
    this.onSceneChanged();
  }
  deleteActiveLayer() {
    if (this.doc.layers.length <= 1) { this.ui.toast('لا يمكن حذف الطبقة الوحيدة'); return; }
    const l = this.doc.active;
    const at = this.doc.indexOf(l);
    if (this.doc.removeLayer(l)) { this.pushHistory(deleteLayerOp(this, l, at)); this.onSceneChanged(); }
  }
  mergeActiveDown() {
    const l = this.doc.active;
    const i = this.doc.indexOf(l);
    if (i <= 0) { this.ui.toast('لا توجد طبقة بالأسفل'); return; }
    const below = this.doc.layers[i - 1];
    const beforeBelow = below.snapshot();
    const meta = { id: l.id, name: l.name, opacity: l.opacity, visible: l.visible, locked: l.locked };
    const lSnap = l.snapshot();
    this.doc.mergeDown(l);
    const afterBelow = below.snapshot();
    const rebuild = () => { const nl = new RasterLayer({ w: this.doc.w, h: this.doc.h, name: meta.name, id: meta.id }); Object.assign(nl, { opacity: meta.opacity, visible: meta.visible, locked: meta.locked }); nl.restore(lSnap); return nl; };
    this.pushHistory({
      label: 'دمج الطبقات', emoji: '⬇️',
      undo: () => { below.restore(beforeBelow); this.doc.reinsertLayer(rebuild(), i, false); this.onSceneChanged(); },
      redo: () => { const rl = this.doc.layers.find((x) => x.id === meta.id); if (rl) this.doc.removeLayer(rl); below.restore(afterBelow); this.onSceneChanged(); },
    });
    this.onSceneChanged();
  }
  clearActiveLayer() {
    const l = this.doc.active;
    if (l.isEmpty() && !l.base) return;
    const before = l.snapshot();
    l.clearMarks();
    this.pushHistory(bitmapOp(this, l, before, l.snapshot(), 'مسح الطبقة', '🧹'));
    this.onSceneChanged();
  }
  moveLayer(layer, dir) {
    const from = this.doc.indexOf(layer);
    const to = from + dir;
    if (to < 0 || to >= this.doc.layers.length) return;
    this.doc.reorder(from, to);
    this.pushHistory(reorderLayerOp(this, from, to));
    this.onSceneChanged();
  }
  renameLayer(layer, name) { this.doc.rename(layer, name); this.ui.refreshLayers(); this.requestSave(); }
  toggleLayerVisible(layer) { this.doc.setVisible(layer, !layer.visible); this.ui.refreshLayers(); this.requestSave(); }
  toggleLayerLock(layer) { this.doc.setLocked(layer, !layer.locked); this.ui.refreshLayers(); }
  setLayerOpacity(layer, o) { this.doc.setOpacity(layer, o); this.requestSave(); }
  setActiveLayer(layer) { this.doc.setActive(layer); this.ui.refreshLayers(); }

  // ---------- file ----------
  newDoc(confirmFirst = true) {
    if (confirmFirst && !this.doc.isBlank() && !window.confirm('بدء رسمة جديدة؟ سيُمسح ما لم يُحفظ.')) return;
    this.doc.reset();
    this.history.clear();
    this.view.rotation = 0;
    this.selection.cancel();
    this.storage.clearAuto();
    this.fitPage();
    this.onSceneChanged();
    this.ui.refreshLayers(); this.ui.refreshHistory();
  }
  openEntry(data) {
    if (!data) return;
    this.doc.load(data);
    this.history.clear();
    this.view.rotation = 0;
    this.fitPage();
    this.onSceneChanged();
    this.ui.refreshLayers(); this.ui.refreshHistory();
    this.ui.toast('تم الفتح 📂');
  }
  savePrompt() {
    const t = window.prompt('اسم الرسمة', 'رسمتي');
    if (t == null) return;
    const e = this.storage.save(this, t.trim() || 'رسمتي');
    this.ui.toast(e ? 'تم الحفظ ✅' : 'تعذّر الحفظ (المساحة ممتلئة)');
  }
  exportPNG() { exportPNG(this); this.ui.toast('تم تصدير PNG 🖼️'); }
  exportJPG() { exportJPG(this); this.ui.toast('تم تصدير JPG 📷'); }
  print() { printArtwork(this); }

  // ---------- keyboard ----------
  _bindKeys() {
    this._onKey = (e) => {
      if (/input|textarea/i.test(e.target.tagName)) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
      else if (meta && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (this.selection.hasFloating) { e.preventDefault(); this.selection.deleteSelection(); } }
      else if (e.key === 'Escape') { this.selection.cancel(); }
      else if (e.key === '[') { this.settings.set('size', Math.max(1, this.settings.get('size') - 2)); this.ui.refreshBrush(); }
      else if (e.key === ']') { this.settings.set('size', Math.min(160, this.settings.get('size') + 2)); this.ui.refreshBrush(); }
      else if (e.key.toLowerCase() === 'b') this.setTool('brush');
      else if (e.key.toLowerCase() === 'e') this.setTool('eraser');
      else if (e.key.toLowerCase() === 'v') this.setTool('select');
    };
    window.addEventListener('keydown', this._onKey);
  }
}
