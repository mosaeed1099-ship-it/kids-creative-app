/**
 * strokeRenderer.js — THE single place that turns a stroke `mark` into pixels.
 *
 * Used identically for (a) the live preview while drawing, (b) committing a
 * finished stroke onto its layer, and (c) repainting a layer during undo/redo.
 * One module → no duplicated drawing logic anywhere in the studio.
 *
 * A stroke is stamped along its polyline into a transparent SCRATCH canvas with
 * `source-over`, then the scratch is blended onto the layer once using the
 * mark's `composite` + `opacity`. This yields a uniform, correctly-opaque
 * stroke (no internal build-up banding) and makes marker(multiply) /
 * eraser(destination-out) behave the same live and after undo.
 *
 * Performance: each stroke caches ONE stamp sprite and blits it with drawImage
 * (no per-stamp gradients), and all texture noise is a pure function of the
 * stamp index — so incremental live drawing and full repaint are pixel-equal.
 */
import { getProfile } from './brushProfiles.js';
import { clamp, dist, lerp, TAU } from '../util/geometry.js';

/** Deterministic hash → [0,1) from integer coordinates. */
function noise(seed, a, b = 0) {
  let h = (seed ^ (a * 374761393) ^ (b * 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function effRadius(profile, size, pressure) {
  const base = size / 2;
  const t = profile.pressureSize ? pressure : 1;
  return Math.max(0.35, base * lerp(profile.minW, profile.maxW, t));
}

const spriteCache = new WeakMap(); // mark → {canvas, r}

/** Build (once per mark) a soft/hard round stamp sprite in the mark's colour. */
function getSprite(mark, profile, maxR) {
  const hardness = mark.hardness ?? profile.hardness;
  let entry = spriteCache.get(mark);
  const r = Math.ceil(maxR) + 2;
  if (entry && entry.r === r) return entry.canvas;
  const size = r * 2;
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const c = cv.getContext('2d');
  const cx = r, cy = r;
  if (hardness >= 0.98) {
    c.fillStyle = mark.color;
    c.beginPath(); c.arc(cx, cy, maxR, 0, TAU); c.fill();
  } else {
    const inner = clamp(hardness, 0, 1) * maxR;
    const g = c.createRadialGradient(cx, cy, Math.min(inner, maxR - 0.5), cx, cy, maxR);
    g.addColorStop(0, mark.color);
    g.addColorStop(1, mark.color + '00');
    c.fillStyle = g;
    c.beginPath(); c.arc(cx, cy, maxR, 0, TAU); c.fill();
  }
  entry = { canvas: cv, r };
  spriteCache.set(mark, entry);
  return cv;
}

/**
 * Paint an entire stroke `mark` into a transparent scratch context.
 * Caller clears the scratch before the first call for a mark. `fromIndex` lets
 * the live tool stamp only the newly-added tail; results are identical to a
 * full paint because the noise is index-based.
 */
export function paintStroke(ctx, mark, fromIndex = 0) {
  const profile = getProfile(mark.profileId);
  const pts = mark.points;
  if (!pts.length) return;

  ctx.fillStyle = mark.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const maxR = effRadius(profile, mark.size, 1);
  const sprite = (!profile.spray && !profile.nib) ? getSprite(mark, profile, maxR) : null;

  if (pts.length === 1 && fromIndex === 0) {
    stampAt(ctx, profile, mark, sprite, pts[0], 0, 0);
    ctx.globalAlpha = 1;
    return;
  }

  const start = Math.max(1, fromIndex);
  for (let i = start; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = dist(a.x, a.y, b.x, b.y);
    const rB = effRadius(profile, mark.size, b.p ?? 1);
    const step = Math.max(0.75, rB * 2 * profile.spacing);
    const n = Math.max(1, Math.ceil(d / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const p = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), p: lerp(a.p ?? 1, b.p ?? 1, t) };
      stampAt(ctx, profile, mark, sprite, p, i, k);
    }
  }
  ctx.globalAlpha = 1;
}

function stampAt(ctx, profile, mark, sprite, p, i, k) {
  const r = effRadius(profile, mark.size, p.p ?? 1);
  let alpha = profile.flow * (profile.pressureFlow ? (0.35 + 0.65 * (p.p ?? 1)) : 1);
  let x = p.x, y = p.y;

  if (profile.grain > 0) {
    alpha *= 1 - profile.grain * noise(mark.seed, i * 131 + k, 7);
    const j = r * profile.grain * 0.5;
    x += (noise(mark.seed, i * 131 + k, 11) - 0.5) * j;
    y += (noise(mark.seed, i * 131 + k, 13) - 0.5) * j;
  }

  ctx.globalAlpha = clamp(alpha, 0, 1);

  if (profile.spray) {
    const density = profile.spray.density;
    for (let d = 0; d < density; d++) {
      const ang = noise(mark.seed, i * 977 + k * 31 + d, 3) * TAU;
      const rr = Math.sqrt(noise(mark.seed, i * 977 + k * 31 + d, 5)) * r;
      const dot = Math.max(0.5, r * 0.06);
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, dot, 0, TAU);
      ctx.fill();
    }
  } else if (profile.nib) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(profile.nib.angle);
    ctx.scale(1, profile.nib.ratio);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
  }
}

/**
 * Blend a fully-painted stroke scratch onto a layer context using the mark's
 * composite mode + opacity. Isolated to the given layer context.
 */
export function compositeScratch(layerCtx, scratchCanvas, mark) {
  const profile = getProfile(mark.profileId);
  layerCtx.save();
  layerCtx.globalAlpha = clamp(mark.opacity, 0, 1);
  layerCtx.globalCompositeOperation = profile.composite;
  layerCtx.drawImage(scratchCanvas, 0, 0);
  layerCtx.restore();
}

/** Drop a mark's cached sprite (call when discarding a stroke). */
export function releaseSprite(mark) { spriteCache.delete(mark); }

export default { paintStroke, compositeScratch, releaseSprite };
