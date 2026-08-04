/**
 * image.js — rasterise a puzzle source SVG to an offscreen canvas at board
 * resolution (crisp, offline) and build a small thumbnail node for the setup UI.
 */
import { el } from '../../../utils/dom.js';

function svgUrl(svg, w, h) {
  let s = svg || '';
  if (!/<svg[^>]*\bwidth=/.test(s)) s = s.replace('<svg ', `<svg width='${w}' height='${h}' `);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
}

export function rasterizeSvg(svg, w, h) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c);
    };
    img.onerror = () => reject(new Error('puzzle image raster failed'));
    img.src = svgUrl(svg, w, h);
  });
}

export function imageThumb(item) {
  return el('img', { class: 'pz-thumb', attrs: { src: svgUrl(item.asset.data, 240, 180), alt: item.getTitle ? item.getTitle('ar') : '', draggable: 'false' } });
}
