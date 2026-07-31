/**
 * CreativeStudio — the Creative Studio (movable characters) controller.
 *
 * Children build funny characters by dragging / rotating / scaling / flipping
 * independent SVG parts, switching data-driven expressions, and adding stickers.
 * It composes the Canvas Engine (render/camera/input/history/export/import) and
 * the Content Engine (stickers) via their public APIs only. Fully offline;
 * projects are saved in localStorage.
 */
import { CanvasEngine } from '../../engine/index.js';
import CharacterLoader from './CharacterLoader.js';
import CharacterScene from './scene/CharacterScene.js';
import SelectionPlugin from './scene/SelectionPlugin.js';
import StateCommand from './scene/StateCommand.js';
import SelectTool from './tools/SelectTool.js';
import StudioUI from './ui/StudioUI.js';
import ProgressManager from '../coloring/progress/ProgressManager.js'; // reuse (import only)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default class CreativeStudio {
  constructor({ mount, content = null, options = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.content = content;
    this.options = { autosaveMs: 700, ...options };
    this.progress = new ProgressManager({ prefix: 'kcs.studio.project' });
    this.state = { charId: null, expression: 'happy' };
    this._saveTimer = 0;
  }

  mount() {
    this.ui = new StudioUI(this);
    this.root = this.ui.build();
    this.mountEl.appendChild(this.root);

    this.engine = new CanvasEngine(this.ui.stage, { background: null, maxDPR: 3 }).mount();
    this.loader = new CharacterLoader({ engine: this.engine });
    this.scene = new CharacterScene({ engine: this.engine, loader: this.loader });
    this.engine.plugins.install(new SelectionPlugin(this.engine.selection));
    this.engine.tools.register(new SelectTool(this));
    this.setTool('select');

    this.engine.events.on('history:change', (h) => this.ui.setHistory(h.canUndo, h.canRedo));
    this.engine.events.on('selection:change', (items) => this.ui.setHasSelection(items.length > 0));
    return this;
  }

  // ---------- characters ----------
  async loadCharacter(url) {
    const def = await this.loader.loadCharacter(url);
    this.scene.build(def);
    this.state.charId = def.id;
    this.state.expression = 'happy';
    this.engine.history.clear();
    this.fitView();
    if (this.progress.has(def.id)) { const saved = this.progress.load(def.id); if (Array.isArray(saved)) this.scene.restore(saved); }
    this.ui.setTitle(def.name?.ar || def.id);
    this.ui.setExpression(this.state.expression);
    this.engine.selection.clear();
    this.engine.invalidate();
    return def;
  }

  loadStickers(items) { this.ui.setStickers(items, (emoji) => this.addSticker(emoji)); }
  setCharacters(list, onPick) { this.ui.setCharacters(list, onPick); }

  // ---------- history commit ----------
  commit(before /* snapshot */, label = 'edit') {
    const after = this.scene.snapshot();
    const onChange = () => { this.engine.selection.clear(); this.ui.setHasSelection(false); this.engine.invalidate(); this.requestSave(); };
    this.engine.history.record(new StateCommand(this.scene, before, after, onChange, label));
    this.engine.invalidate();
    this.requestSave();
  }

  requestSave() {
    if (!this.state.charId) return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.progress.save(this.state.charId, this.scene.snapshot()), this.options.autosaveMs);
  }

  _sel() { return this.engine.selection.items[0] || null; }
  _edit(fn, label = 'edit') { const s = this._sel(); if (!s) return; const before = this.scene.snapshot(); fn(s); this.commit(before, label); }

  // ---------- part actions ----------
  scaleSel(f) { this._edit((s) => { s.scale = clamp(s.scale * f, 0.2, 6); }, 'scale'); }
  rotateSel(deg) { this._edit((s) => { s.rotation += (deg * Math.PI) / 180; }, 'rotate'); }
  flipH() { this._edit((s) => { s.flipH = !s.flipH; }, 'flipH'); }
  flipV() { this._edit((s) => { s.flipV = !s.flipV; }, 'flipV'); }
  forward() { const s = this._sel(); if (!s) return; const b = this.scene.snapshot(); this.scene.bringForward(s); this.commit(b, 'forward'); }
  backward() { const s = this._sel(); if (!s) return; const b = this.scene.snapshot(); this.scene.sendBackward(s); this.commit(b, 'backward'); }
  duplicateSel() { const s = this._sel(); if (!s) return; const b = this.scene.snapshot(); const c = this.scene.duplicate(s); this.engine.selection.select(c); this.commit(b, 'duplicate'); }
  deleteSel() { const s = this._sel(); if (!s) return; const b = this.scene.snapshot(); this.scene.remove(s); this.engine.selection.clear(); this.commit(b, 'delete'); }

  // ---------- expressions / stickers ----------
  setExpression(name) { const b = this.scene.snapshot(); this.scene.applyExpression(name); this.state.expression = name; this.ui.setExpression(name); this.commit(b, 'expression'); }
  addSticker(emoji) { const b = this.scene.snapshot(); const o = this.scene.addSticker({ emoji, x: this.engine.camera.x, y: this.engine.camera.y }); this.engine.selection.select(o); this.commit(b, 'sticker'); }

  // ---------- global ----------
  resetCharacter() { if (!this.scene.def) return; const b = this.scene.snapshot(); this.scene.build(this.scene.def); this.state.expression = 'happy'; this.ui.setExpression('happy'); this.engine.selection.clear(); this.commit(b, 'reset'); }
  undo() { this.engine.history.undo(); }
  redo() { this.engine.history.redo(); }
  setTool(id) { if (id === 'pan') this.engine.tools.deactivate(); else this.engine.tools.activate(id); this.ui.setActiveTool(id); }

  // ---------- view ----------
  zoomIn() { this.engine.camera.setZoom(this.engine.camera.zoom * 1.25); this.engine.invalidate(); }
  zoomOut() { this.engine.camera.setZoom(this.engine.camera.zoom / 1.25); this.engine.invalidate(); }
  resetView() { this.engine.resetView(); }
  fitView() { this.engine.fit(this._padBounds(), 30); this.engine.camera.setHome(this.engine.camera.x, this.engine.camera.y, this.engine.camera.zoom); }
  fullscreen() { if (!document.fullscreenElement) this.root.requestFullscreen?.(); else document.exitFullscreen?.(); }
  _padBounds(pad = 40) { const b = this.scene.bounds(); return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 }; }

  // ---------- export / print ----------
  _download(url, name) { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }
  exportPNG({ scale = 2 } = {}) { this._download(this.engine.exporter.toDataURL({ region: this._padBounds(), scale, background: '#ffffff', type: 'image/png' }), `${this.state.charId || 'character'}.png`); }
  exportJPEG({ scale = 2 } = {}) { this._download(this.engine.exporter.toDataURL({ region: this._padBounds(), scale, background: '#ffffff', type: 'image/jpeg', quality: 0.92 }), `${this.state.charId || 'character'}.jpg`); }
  print() {
    const url = this.engine.exporter.toDataURL({ region: this._padBounds(), scale: 2, background: '#ffffff' });
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:-9999px;bottom:-9999px;width:0;height:0;border:0';
    document.body.appendChild(f); const d = f.contentWindow.document;
    d.open(); d.write(`<html><head><style>@page{margin:12mm}img{max-width:100%}</style></head><body><img src="${url}" onload="window.focus();window.print()"></body></html>`); d.close();
    setTimeout(() => f.remove(), 60000);
  }

  destroy() { clearTimeout(this._saveTimer); this.engine?.destroy(); this.root?.remove(); }
}
