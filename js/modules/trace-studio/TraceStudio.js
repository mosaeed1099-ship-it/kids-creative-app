/**
 * TraceStudio — the Trace feature controller.
 *
 * Composes the Canvas Engine (render/camera/input/history/export/import) and the
 * Content Engine (trace templates), consuming ONLY their public APIs. It REUSES
 * the frozen Coloring module's Brush/Pencil/Eraser tools, ColorManager,
 * ProgressManager and PaintCommand (imported, not modified) to avoid
 * duplicating drawing/color logic.
 *
 * Fully offline: local uploads are read with FileReader in the browser and are
 * never sent anywhere.
 */
import { CanvasEngine } from '../../engine/index.js';
import TraceSurface from './surface/TraceSurface.js';
import ReferenceObject from './surface/ReferenceObject.js';
import DrawObject from './surface/DrawObject.js';
import PaperObject from './surface/PaperObject.js';
import DividerPlugin from './surface/DividerPlugin.js';
import ReferenceController from './ReferenceController.js';
import MoveReferenceTool from './tools/MoveReferenceTool.js';
import TraceUI from './ui/TraceUI.js';
// reuse (import, do not modify) the frozen Coloring module:
import BrushTool from '../coloring/tools/BrushTool.js';
import PencilTool from '../coloring/tools/PencilTool.js';
import EraserTool from '../coloring/tools/EraserTool.js';
import PaintCommand from '../coloring/surface/PaintCommand.js';
import ColorManager from '../coloring/color/ColorManager.js';
import ProgressManager from '../coloring/progress/ProgressManager.js';

export default class TraceStudio {
  constructor({ mount, content = null, options = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.content = content;
    this.options = { maxSize: 1200, autosaveMs: 700, ...options };
    this.resolveAsset = options.resolveAsset || ((item) => item?.asset?.src);

    this.state = { compare: 'overlay' };
    this.brushSize = 22;
    this.colors = new ColorManager({ storageKey: 'kcs.trace.colors', onChange: () => this.ui?.refreshColors() });
    this.progress = new ProgressManager({ prefix: 'kcs.trace.progress' });

    this.engine = null;
    this._surface = null;
    this.current = null;
    this._before = null;
    this._saveTimer = 0;
  }

  get color() { return this.colors.getCurrent(); }
  get surface() { return this._surface; }

  // ---------- lifecycle ----------
  mount() {
    this.ui = new TraceUI(this);
    this.root = this.ui.build();
    this.mountEl.appendChild(this.root);

    this.engine = new CanvasEngine(this.ui.stage, { background: null, maxDPR: 3 }).mount();
    this.engine.events.on('history:change', (h) => this.ui.setHistory(h.canUndo, h.canRedo));

    // layers: paper (0) < reference (1) < drawing (2)
    const paperLayer = this.engine.layers.active;
    const refLayer = this.engine.layers.create({ id: 'reference', zIndex: 1 });
    const drawLayer = this.engine.layers.create({ id: 'drawing', zIndex: 2 });

    this.paper = new PaperObject();
    this.reference = new ReferenceObject(this.state);
    this.draw = new DrawObject(this.state);
    this.engine.objects.add(this.paper, paperLayer);
    this.engine.objects.add(this.reference, refLayer);
    this.engine.objects.add(this.draw, drawLayer);
    this.engine.plugins.install(new DividerPlugin(this.state));

    this.refCtl = new ReferenceController({ ref: this.reference, engine: this.engine, onChange: () => this.ui.refreshReference() });

    this.engine.tools.register(new BrushTool(this));
    this.engine.tools.register(new PencilTool(this));
    this.engine.tools.register(new EraserTool(this));
    this.engine.tools.register(new MoveReferenceTool(this));
    this.setTool('brush');

    this.ui.refreshColors();
    this.ui.setBrushSize(this.brushSize);
    this.ui.refreshReference();
    this.ui.setCompare('overlay');
    return this;
  }

  // ---------- sources ----------
  async openItem(item) {
    const url = this.resolveAsset(item);
    if (!url) throw new Error('TraceStudio: item has no asset src');
    const img = await this.engine.importer.image(url);
    await this.openImage(img, { id: item.id, title: item.getTitle ? item.getTitle('ar') : (item.title || '') });
    this.content?.open?.(item.id);
  }

  /** Parent-uploaded local image — read in the browser only, never uploaded. */
  async openFile(file) {
    const dataUrl = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(file); });
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
    await this.openImage(img, { id: `upload:${file.name}:${file.size}`, title: file.name });
  }

  async openImage(img, { id = 'image', title = '' } = {}) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const scale = Math.min(1, this.options.maxSize / Math.max(iw, ih));
    const pageW = Math.round(iw * scale), pageH = Math.round(ih * scale);

    this._surface = new TraceSurface(pageW, pageH);
    this.draw.setSurface(this._surface);
    this.paper.setSize(pageW, pageH);
    this.reference.setImage(img, pageW, pageH);
    this.reference.scale = 1; this.reference.rotation = 0; this.reference.flipH = false; this.reference.flipV = false;
    this.reference.x = 0; this.reference.y = 0;
    if (this.reference.opacity == null) this.reference.opacity = 0.5;

    this.current = { id, title };
    this.engine.history.clear();
    this.fitView();

    if (this.progress.has(id)) await this._surface.loadPaint(this.progress.load(id));

    this.ui.setTitle(title);
    this.ui.setReferenceImage(img);   // visible reference box + tap-to-eyedrop (17: "ارسم زيها")
    this.ui.refreshReference();
    this.engine.invalidate();
    return this;
  }

  // ---------- tool bridge (reused coloring tools call these) ----------
  toLocalPixel(world) { return { x: world.x - this.draw.x, y: world.y - this.draw.y }; }

  commitFrom(before, label = 'Trace') {
    const after = this._surface.snapshot();
    const onChange = () => { this.engine.invalidate(); this.requestSave(); };
    this.engine.history.record(new PaintCommand(this._surface, before, after, onChange, label));
    this.engine.invalidate();
    this.requestSave();
  }

  requestSave() {
    if (!this.current) return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.progress.save(this.current.id, this._surface.paintDataURL()), this.options.autosaveMs);
  }

  // ---------- drawing actions ----------
  setTool(id) { if (id === 'pan') this.engine.tools.deactivate(); else this.engine.tools.activate(id); this.ui.setActiveTool(id); }
  setColor(hex) { this.colors.setCurrent(hex); }
  toggleFavoriteColor() { this.colors.toggleFavorite(this.color); }
  setBrushSize(n) { this.brushSize = n; this.ui.setBrushSize(n); }
  undo() { this.engine.history.undo(); }
  redo() { this.engine.history.redo(); }
  clear() { if (!this._surface) return; const b = this._surface.snapshot(); this._surface.clearPaint(); this.commitFrom(b, 'Clear'); }

  // ---------- view ----------
  zoomIn() { this.engine.camera.setZoom(this.engine.camera.zoom * 1.25); this.engine.invalidate(); }
  zoomOut() { this.engine.camera.setZoom(this.engine.camera.zoom / 1.25); this.engine.invalidate(); }
  resetView() { this.engine.resetView(); }
  fitView() { this.engine.fit(this.paper.worldBounds(), 40); this.engine.camera.setHome(this.engine.camera.x, this.engine.camera.y, this.engine.camera.zoom); }
  fullscreen() { if (!document.fullscreenElement) this.root.requestFullscreen?.(); else document.exitFullscreen?.(); }

  // ---------- reference actions ----------
  refOpacity(v) { this.refCtl.setOpacity(v); }
  refShow(v) { this.refCtl.toggleVisible(v); this.ui.refreshReference(); }
  refLock(v) { this.refCtl.toggleLock(v); this.ui.refreshReference(); }
  refScale(f) { this.refCtl.scaleBy(f); }
  refRotate(d) { this.refCtl.rotateBy(d); }
  refFlipH() { this.refCtl.flipHorizontal(); }
  refFlipV() { this.refCtl.flipVertical(); }
  refCenter() { this.refCtl.center(); }
  refFit() { this.refCtl.fit(); }

  // ---------- comparison ----------
  setCompare(mode) { this.state.compare = mode; this.ui.setCompare(mode); this.engine.invalidate(); }

  // ---------- export / print ----------
  _download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }
  _name(ext) { return `${(this.current?.title || 'trace').replace(/\s+/g, '-')}.${ext}`; }
  exportPNG({ scale = 2 } = {}) { this._download(this._surface.compositeCanvas({ background: '#fff', scale }).toDataURL('image/png'), this._name('png')); }
  exportJPEG({ scale = 2, quality = 0.92 } = {}) { this._download(this._surface.compositeCanvas({ background: '#fff', scale }).toDataURL('image/jpeg', quality), this._name('jpg')); }
  print() {
    const url = this._surface.compositeCanvas({ background: '#fff', scale: 2 }).toDataURL('image/png');
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:-9999px;bottom:-9999px;width:0;height:0;border:0';
    document.body.appendChild(f); const d = f.contentWindow.document;
    d.open(); d.write(`<html><head><style>@page{margin:12mm}img{max-width:100%}</style></head><body><img src="${url}" onload="window.focus();window.print()"></body></html>`); d.close();
    setTimeout(() => f.remove(), 60000);
  }

  destroy() { clearTimeout(this._saveTimer); this.engine?.destroy(); this.root?.remove(); }
}
