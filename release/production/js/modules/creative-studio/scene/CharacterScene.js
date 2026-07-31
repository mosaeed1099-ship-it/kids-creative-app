/**
 * CharacterScene — owns the character's parts on a dedicated engine layer.
 * Add / remove / reorder parts, apply data-driven expressions, add stickers,
 * snapshot / restore for undo & save. Render order follows each part's zIndex
 * (the engine Layer sorts by it).
 */
import ImagePartObject from './ImagePartObject.js';
import StickerObject from './StickerObject.js';

let _seq = 0;

export default class CharacterScene {
  constructor({ engine, loader }) {
    this.engine = engine;
    this.loader = loader;
    this.layer = engine.layers.create({ id: 'character', zIndex: 1 });
    this.parts = [];
    this.def = null;
  }

  // ---------- build / clear ----------
  build(def) {
    this.clear();
    this.def = def;
    for (const p of def.parts) this._addFromJSON(p);
    this.engine.invalidate();
  }

  clear() {
    for (const o of this.parts) this.engine.objects.remove(o);
    this.parts = [];
  }

  _addFromJSON(p) {
    let obj;
    if (p.type === 'sticker' || p.emoji) {
      obj = new StickerObject({ ...p, size: p.natW || p.size });
    } else {
      const src = p._src || p.src;
      const img = this.loader.get(src);
      obj = new ImagePartObject({ ...p, image: img, src });
      if (p.natW) obj.setNatural(p.natW, p.natH);
    }
    if (p.z != null) obj.zIndex = p.z;
    this.parts.push(obj);
    this.engine.objects.add(obj, this.layer);
    return obj;
  }

  // ---------- editing ----------
  _maxZ() { return this.parts.reduce((m, o) => Math.max(m, o.zIndex), 0); }
  _minZ() { return this.parts.reduce((m, o) => Math.min(m, o.zIndex), 0); }

  bringForward(o) { o.zIndex = this._maxZ() + 1; this.layer.markDirty(); this.engine.invalidate(); }
  sendBackward(o) { o.zIndex = this._minZ() - 1; this.layer.markDirty(); this.engine.invalidate(); }

  duplicate(o) {
    const j = o.toJSON();
    j.id = `dup_${(_seq += 1)}`;
    j.x += 24; j.y += 24; j.z = this._maxZ() + 1;
    j._src = o.src;
    const copy = this._addFromJSON(j);
    this.engine.invalidate();
    return copy;
  }

  remove(o) {
    this.engine.objects.remove(o);
    this.parts = this.parts.filter((p) => p !== o);
    this.engine.invalidate();
  }

  addSticker({ emoji, x = 0, y = 0, size = 120 }) {
    const obj = new StickerObject({ id: `st_${(_seq += 1)}`, kind: 'sticker', type: 'sticker', emoji, x, y, size });
    obj.zIndex = this._maxZ() + 1;
    this.parts.push(obj);
    this.engine.objects.add(obj, this.layer);
    this.engine.invalidate();
    return obj;
  }

  applyExpression(name) {
    const map = this.def?.expressions?.[name];
    if (!map) return;
    for (const slot of Object.keys(map)) {
      const url = map[slot];
      const part = this.parts.find((p) => p.slot === slot && p.setImage);
      const img = this.loader.get(url);
      if (part && img) part.setImage(img, url);
    }
    this.engine.invalidate();
  }

  hitTest(world) {
    const sorted = [...this.parts].sort((a, b) => b.zIndex - a.zIndex);
    for (const o of sorted) if (o.hitTest(world)) return o;
    return null;
  }

  bounds() {
    if (!this.parts.length) return { x: -300, y: -300, w: 600, h: 600 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const o of this.parts) {
      const b = o.getBounds();
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  // ---------- snapshot / restore (undo + save) ----------
  snapshot() { return this.parts.slice().sort((a, b) => a.zIndex - b.zIndex).map((o) => o.toJSON()); }
  restore(json) {
    this.clear();
    for (const p of json) this._addFromJSON(p);
    this.engine.invalidate();
  }
}
