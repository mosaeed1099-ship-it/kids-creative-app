/**
 * geometry.js — tiny math helpers (pure).
 */
export const TAU = Math.PI * 2;
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const uid = (p = 'o') => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
