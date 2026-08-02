/**
 * geometry.js — tiny math helpers (pure).
 */
export const TAU = Math.PI * 2;
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const randInt = (n) => Math.floor(Math.random() * n);
