/**
 * visual.js — turn a sticker ContentItem into something drawable:
 *   • SVG stickers → a cached, high-resolution HTMLImageElement (crisp, offline)
 *   • Emoji stickers → the raw character (drawn as canvas text)
 * and a DOM node for the library grid thumbnail.
 *
 * Everything is data-URI based — no network, works fully offline.
 */
import { el } from '../../../utils/dom.js';

const imgCache = new Map(); // item.id → HTMLImageElement

/** Build a self-contained SVG data URL at a high intrinsic size (crisp scaling). */
function svgDataUrl(svg) {
  let s = svg || '';
  if (!/<svg[^>]*\bwidth=/.test(s)) s = s.replace('<svg ', "<svg width='512' height='512' ");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
}

/** Resolve the on-canvas visual for a sticker item. */
export function stickerVisual(item) {
  const a = item.asset || {};
  if (a.type === 'emoji') return Promise.resolve({ kind: 'emoji', char: a.data || '⭐' });
  if (imgCache.has(item.id)) return Promise.resolve({ kind: 'svg', img: imgCache.get(item.id) });
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { imgCache.set(item.id, img); resolve({ kind: 'svg', img }); };
    img.onerror = () => reject(new Error(`sticker image failed: ${item.id}`));
    img.src = svgDataUrl(a.data);
  });
}

/** A DOM thumbnail node for the library grid. */
export function stickerThumb(item) {
  const a = item.asset || {};
  if (a.type === 'emoji') return el('span', { class: 'ss-thumb ss-thumb--emoji', text: a.data || '⭐' });
  return el('img', { class: 'ss-thumb', attrs: { src: svgDataUrl(a.data), alt: item.getTitle ? item.getTitle('ar') : '', draggable: 'false' } });
}
