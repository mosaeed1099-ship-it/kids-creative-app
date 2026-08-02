/**
 * Document.js — owns the page (size + paper colour) and the ordered stack of
 * RasterLayers, and mirrors them into the Canvas Engine as SceneObjects.
 *
 * All structural layer operations (add / delete / duplicate / merge / reorder /
 * rename / hide / lock / opacity) live here; the UI and commands call them.
 */
import RasterLayer from '../layers/RasterLayer.js';
import LayerObject from '../layers/LayerObject.js';
import PaperObject from '../layers/PaperObject.js';
import { reviveMark } from '../marks/Mark.js';

export default class Document {
  constructor(app, { w = 1600, h = 1200, paper = '#ffffff' } = {}) {
    this.app = app;
    this.w = w;
    this.h = h;
    this.paper = paper;
    /** @type {RasterLayer[]} bottom → top */
    this.layers = [];
    this._objs = new Map(); // layerId → LayerObject
    this._activeId = null;
    this.paperObj = null;
  }

  attach(engine) {
    this.engine = engine;
    this.paperObj = new PaperObject(this.app);
    engine.objects.add(this.paperObj);
    this.addLayer({ name: 'طبقة ١' });
    return this;
  }

  // ---- queries ----
  get active() { return this.layers.find((l) => l.id === this._activeId) || this.layers[this.layers.length - 1] || null; }
  layerObject(layer) { return this._objs.get(layer.id) || null; }
  indexOf(layer) { return this.layers.indexOf(layer); }

  // ---- structural ops ----
  addLayer({ name = null, id = null, activate = true, at = null } = {}) {
    const layer = new RasterLayer({ w: this.w, h: this.h, name, id });
    const index = at == null ? this.layers.length : at;
    this.layers.splice(index, 0, layer);
    const obj = new LayerObject(layer, this.app);
    this._objs.set(layer.id, obj);
    this.engine.objects.add(obj);
    if (activate) this._activeId = layer.id;
    this.syncScene();
    return layer;
  }

  removeLayer(layer) {
    const i = this.layers.indexOf(layer);
    if (i < 0 || this.layers.length <= 1) return false;
    this.layers.splice(i, 1);
    const obj = this._objs.get(layer.id);
    if (obj) { this.engine.objects.remove(obj); this._objs.delete(layer.id); }
    if (this._activeId === layer.id) this._activeId = (this.layers[i] || this.layers[i - 1]).id;
    layer.destroy();
    this.syncScene();
    return true;
  }

  /** Re-insert a previously removed layer (undo of delete). */
  reinsertLayer(layer, at, activate = true) {
    this.layers.splice(at, 0, layer);
    const obj = new LayerObject(layer, this.app);
    this._objs.set(layer.id, obj);
    this.engine.objects.add(obj);
    if (activate) this._activeId = layer.id;
    this.syncScene();
    return layer;
  }

  duplicateLayer(layer) {
    const i = this.layers.indexOf(layer);
    const copy = new RasterLayer({ w: this.w, h: this.h, name: `${layer.name} نسخة` });
    copy.marks = layer.marks.map((m) => ({ ...structuredCloneSafe(m), id: `${m.id}c` }));
    copy.opacity = layer.opacity;
    copy.ctx.drawImage(layer.canvas, 0, 0); // fast bitmap copy
    this.layers.splice(i + 1, 0, copy);
    const obj = new LayerObject(copy, this.app);
    this._objs.set(copy.id, obj);
    this.engine.objects.add(obj);
    this._activeId = copy.id;
    this.syncScene();
    return copy;
  }

  /** Merge `layer` down into the layer below it. Returns the removed layer. */
  mergeDown(layer) {
    const i = this.layers.indexOf(layer);
    if (i <= 0) return null;
    const below = this.layers[i - 1];
    below.ctx.save();
    below.ctx.globalAlpha = layer.opacity;
    below.ctx.drawImage(layer.canvas, 0, 0);
    below.ctx.restore();
    below.marks = below.marks.concat(layer.marks);
    this.removeLayer(layer);
    this._activeId = below.id;
    this.syncScene();
    return below;
  }

  reorder(from, to) {
    if (to < 0 || to >= this.layers.length || from === to) return false;
    const [l] = this.layers.splice(from, 1);
    this.layers.splice(to, 0, l);
    this.syncScene();
    return true;
  }

  /** Start a fresh blank document (single empty layer). */
  reset() {
    for (const layer of [...this.layers]) {
      const obj = this._objs.get(layer.id);
      if (obj) this.engine.objects.remove(obj);
      layer.destroy();
    }
    this.layers = []; this._objs.clear(); this._activeId = null;
    this.addLayer({ name: 'طبقة ١' });
  }

  setActive(layer) { this._activeId = layer.id; }
  rename(layer, name) { layer.name = name || layer.name; }
  setVisible(layer, v) { layer.visible = v; this.syncScene(); }
  setLocked(layer, v) { layer.locked = v; }
  setOpacity(layer, o) { layer.opacity = Math.max(0, Math.min(1, o)); this.syncScene(); }

  /** Sync every SceneObject's transform/visibility + request a redraw. */
  syncScene() {
    this.paperObj?.sync();
    for (const layer of this.layers) this._objs.get(layer.id)?.sync();
    this.engine.layers.active.markDirty();
    this.engine.invalidate();
  }

  // ---- export compositing (document resolution, camera-independent) ----
  compositeTo(ctx) {
    for (const layer of this.layers) {
      if (!layer.visible || layer.opacity <= 0) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
  }

  /** Non-empty content bounds in document space (for trimmed export), or full page. */
  isBlank() { return this.layers.every((l) => l.isEmpty()); }

  // ---- (de)serialisation ----
  serialize() {
    return {
      version: 1, w: this.w, h: this.h, paper: this.paper,
      activeId: this._activeId,
      layers: this.layers.map((l) => l.serialize()),
    };
  }

  load(data) {
    if (!data || !Array.isArray(data.layers) || !data.layers.length) return false;
    // tear down current
    for (const layer of [...this.layers]) {
      const obj = this._objs.get(layer.id);
      if (obj) this.engine.objects.remove(obj);
      layer.destroy();
    }
    this.layers = []; this._objs.clear();
    this.w = data.w || this.w; this.h = data.h || this.h; this.paper = data.paper || this.paper;

    for (const ld of data.layers) {
      const layer = new RasterLayer({ w: this.w, h: this.h, name: ld.name, id: ld.id });
      layer.visible = ld.visible !== false;
      layer.locked = !!ld.locked;
      layer.opacity = ld.opacity ?? 1;
      layer.marks = (ld.marks || []).map(reviveMark).filter(Boolean);
      if (ld.base) {
        const img = new Image();
        img.onload = () => {
          const bc = document.createElement('canvas');
          bc.width = this.w; bc.height = this.h;
          bc.getContext('2d').drawImage(img, 0, 0);
          layer.base = bc; layer.repaint(); this.syncScene();
        };
        img.src = ld.base;
      }
      layer.repaint();
      this.layers.push(layer);
      const obj = new LayerObject(layer, this.app);
      this._objs.set(layer.id, obj);
      this.engine.objects.add(obj);
    }
    this._activeId = data.activeId || this.layers[this.layers.length - 1].id;
    this.syncScene();
    return true;
  }

  destroy() {
    for (const layer of this.layers) {
      const obj = this._objs.get(layer.id);
      if (obj) this.engine.objects.remove(obj);
      layer.destroy();
    }
    if (this.paperObj) this.engine.objects.remove(this.paperObj);
    this.layers = []; this._objs.clear();
  }
}

function structuredCloneSafe(obj) {
  try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj)); }
}
