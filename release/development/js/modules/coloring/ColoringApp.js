/**
 * ColoringApp — the Coloring feature controller.
 *
 * Composes the Canvas Engine (rendering/camera/input/history/export) and the
 * Content Engine (open a coloring page, mark recent) — consuming ONLY their
 * public APIs. It owns the PaintSurface, tools, color system and progress
 * saving, and drives the ColoringUI.
 *
 *   const app = new ColoringApp({ mount: el, content: contentManager });
 *   app.mount();
 *   await app.openItem(contentItem);   // or app.openImage(url, { id, title })
 */
import { CanvasEngine } from '../../engine/index.js';
import PaintSurface from './surface/PaintSurface.js';
import ArtworkObject from './surface/ArtworkObject.js';
import PaintCommand from './surface/PaintCommand.js';
import BucketFillTool from './tools/BucketFillTool.js';
import BrushTool from './tools/BrushTool.js';
import PencilTool from './tools/PencilTool.js';
import EraserTool from './tools/EraserTool.js';
import ColorManager from './color/ColorManager.js';
import ProgressManager from './progress/ProgressManager.js';
import ColoringUI from './ui/ColoringUI.js';

export default class ColoringApp {
  constructor({ mount, content = null, options = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.content = content;
    this.options = { maxSize: 1400, autosaveMs: 700, ...options };
    this.resolveAsset = options.resolveAsset || ((item) => item?.asset?.src);

    this.brushSize = 26;
    this.colors = new ColorManager({ onChange: () => this.ui?.refreshColors() });
    this.progress = new ProgressManager();

    this.engine = null;
    this.surface = null;
    this.artwork = null;
    this.current = null;      // { id, title }
    this._before = null;
    this._saveTimer = 0;
    this._toolsReady = false;
  }

  get color() { return this.colors.getCurrent(); }

  // ---------- lifecycle ----------
  mount() {
    this.ui = new ColoringUI(this);
    this.root = this.ui.build();
    this.mountEl.appendChild(this.root);

    this.engine = new CanvasEngine(this.ui.stage, { background: null, maxDPR: 3 }).mount();
    this.engine.events.on('history:change', (h) => this.ui.setHistory(h.canUndo, h.canRedo));

    this._registerTools();
    this.setTool('bucket');
    this.ui.refreshColors();
    this.ui.setBrushSize(this.brushSize);
    return this;
  }

  _registerTools() {
    if (this._toolsReady) return;
    this.engine.tools.register(new BucketFillTool(this));
    this.engine.tools.register(new BrushTool(this));
    this.engine.tools.register(new PencilTool(this));
    this.engine.tools.register(new EraserTool(this));
    this._toolsReady = true;
  }

  // ---------- opening content ----------
  /** Open a Content-Engine item of assetType 'coloring'. */
  async openItem(item) {
    const url = this.resolveAsset(item);
    if (!url) throw new Error('ColoringApp: item has no asset src');
    await this.openImage(url, { id: item.id, title: item.getTitle ? item.getTitle('ar') : (item.title || '') });
    // Mark as recently opened in the Content Engine (public API).
    this.content?.open?.(item.id);
  }

  /** Open any line-art image URL directly. */
  async openImage(url, { id = url, title = '' } = {}) {
    const img = await this.engine.importer.image(url);   // engine public API
    this.surface = new PaintSurface(img, { maxSize: this.options.maxSize });
    this.artwork = new ArtworkObject(this.surface);
    this.current = { id, title };

    this.engine.objects.clear();
    this.engine.objects.add(this.artwork);
    this.engine.history.clear();
    this.fitView();

    // Restore unfinished progress, if any.
    if (this.progress.has(id)) {
      await this.surface.loadPaint(this.progress.load(id));
    }
    this.ui.setTitle(title);
    this.ui.setHasProgress(this.progress.has(id));
    this.engine.invalidate();
    return this;
  }

  // ---------- tool helpers (used by tools) ----------
  toLocalPixel(world) {
    return { x: world.x - this.artwork.x, y: world.y - this.artwork.y };
  }

  /** Record an undo step from a captured "before" snapshot to now. */
  commitFrom(before, label = 'Paint') {
    const after = this.surface.snapshot();
    const onChange = () => { this.engine.invalidate(); this.requestSave(); };
    this.engine.history.record(new PaintCommand(this.surface, before, after, onChange, label));
    this.engine.invalidate();
    this.requestSave();
  }

  requestSave() {
    if (!this.current) return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this.progress.save(this.current.id, this.surface.paintDataURL());
      this.ui.setHasProgress(true);
    }, this.options.autosaveMs);
  }

  // ---------- public actions (wired to UI) ----------
  setTool(id) {
    if (id === 'pan') this.engine.tools.deactivate();      // engine built-in pan
    else this.engine.tools.activate(id);
    this.ui.setActiveTool(id);
  }

  setColor(hex) { this.colors.setCurrent(hex); }
  toggleFavoriteColor(hex) { this.colors.toggleFavorite(hex || this.color); }
  setBrushSize(n) { this.brushSize = n; this.ui.setBrushSize(n); }

  undo() { this.engine.history.undo(); }
  redo() { this.engine.history.redo(); }

  zoomIn() { this.engine.camera.setZoom(this.engine.camera.zoom * 1.25); this.engine.invalidate(); }
  zoomOut() { this.engine.camera.setZoom(this.engine.camera.zoom / 1.25); this.engine.invalidate(); }
  resetView() { this.engine.resetView(); }
  fitView() {
    if (!this.artwork) return;
    this.engine.fit(this.artwork.worldBounds(), 48);
    this.engine.camera.setHome(this.engine.camera.x, this.engine.camera.y, this.engine.camera.zoom);
  }

  fullscreen() {
    const el = this.root;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  clear() {
    if (!this.surface) return;
    const before = this.surface.snapshot();
    this.surface.clearPaint();
    this.commitFrom(before, 'Clear');
  }

  // ---------- export / print ----------
  _download(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename; a.click();
  }
  _safeName(ext) {
    const base = (this.current?.title || 'coloring').replace(/\s+/g, '-');
    return `${base}.${ext}`;
  }

  exportPNG({ scale = 2 } = {}) {
    const c = this.surface.compositeCanvas({ background: '#ffffff', scale });
    this._download(c.toDataURL('image/png'), this._safeName('png'));
  }
  exportJPEG({ scale = 2, quality = 0.92 } = {}) {
    const c = this.surface.compositeCanvas({ background: '#ffffff', scale });
    this._download(c.toDataURL('image/jpeg', quality), this._safeName('jpg'));
  }

  print() {
    const dataUrl = this.surface.compositeCanvas({ background: '#ffffff', scale: 2 }).toDataURL('image/png');
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:-9999px;bottom:-9999px;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(`<html><head><style>@media print{@page{margin:12mm}} img{max-width:100%}</style></head><body><img src="${dataUrl}" onload="window.focus();window.print();"></body></html>`);
    doc.close();
    setTimeout(() => frame.remove(), 60000);
  }

  destroy() {
    clearTimeout(this._saveTimer);
    this.engine?.destroy();
    this.root?.remove();
  }
}
