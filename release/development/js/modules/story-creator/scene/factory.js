/**
 * factory.js — (re)build live scene objects from a page's serialized objects,
 * and serialize a live object back to data. Reuses Sticker Studio's StickerObject
 * + stickerVisual for stickers (public reuse, no duplicated logic).
 */
import TextObject from './TextObject.js';
import ImageObject from './ImageObject.js';
import ShapeObject from './ShapeObject.js';
import DrawObject from './DrawObject.js';
import { StickerObject } from '../../sticker-studio/index.js';
import { stickerVisual } from '../../sticker-studio/scene/visual.js';

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/** Build one live object from serialized data (async for image/sticker). */
export async function buildObject(app, d) {
  if (d.type === 'text') return new TextObject(d);
  if (d.type === 'shape') return new ShapeObject(d);
  if (d.type === 'draw') return new DrawObject(app, d);
  if (d.type === 'image') { const img = await loadImage(d.src); return new ImageObject(d, img); }
  if (d.type === 'sticker') {
    const item = app.stickerContent.getContent(d.contentId);
    if (!item) return null;
    const v = await stickerVisual(item);
    return new StickerObject(item, v, { x: d.x, y: d.y, scale: d.scale, rotation: d.rotation, flipH: d.flipH, flipV: d.flipV, zIndex: d.z });
  }
  return null;
}

export async function buildPageObjects(app, page) {
  const out = [];
  for (const d of page.objects) {
    const obj = await buildObject(app, d); // eslint-disable-line no-await-in-loop
    if (obj) out.push(obj);
  }
  return out;
}

/** Serialize a live object back to page data (uniform `z`, `type`). */
export function serializeObject(obj) {
  if (obj instanceof StickerObject) {
    return { type: 'sticker', contentId: obj.contentId, x: Math.round(obj.x), y: Math.round(obj.y), scale: obj.scaleX, rotation: obj.rotation, flipH: obj.flipH, flipV: obj.flipV, z: obj.zIndex };
  }
  return obj.serialize();
}
