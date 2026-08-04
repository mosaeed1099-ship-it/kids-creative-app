/**
 * geometry.js — tiny math helpers for the Sticker Studio (pure functions).
 */
export const TAU = Math.PI * 2;
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

/** Rotate a point around a centre by `ang` radians. */
export function rotate(x, y, cx, cy, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}
