/**
 * geometry.js — small, dependency-free math helpers used across the module.
 * Pure functions only; no engine or DOM access.
 */

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

/** Rotate point (x,y) around centre (cx,cy) by `ang` radians. */
export function rotatePoint(x, y, cx, cy, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

/** Axis-aligned bounds of a list of {x,y} points, padded by `pad`. */
export function boundsOfPoints(points, pad = 0) {
  if (!points || !points.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
}

/** Normalised rectangle {x,y,w,h} from two corner points. */
export function rectFromPoints(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

export const rectContains = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

export function rectsIntersect(a, b) {
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

/** Even-odd point-in-polygon test. `poly` = [{x,y}, …]. */
export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Bounds of a polygon (array of {x,y}). */
export function polygonBounds(poly, pad = 0) {
  return boundsOfPoints(poly, pad);
}

/** Angle (radians) of the vector from a to b. */
export const angleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
