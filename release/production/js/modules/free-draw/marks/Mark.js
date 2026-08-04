/**
 * Mark.js — the immutable data unit of a drawing. Two kinds:
 *   stroke  freehand brush/eraser stroke (points + brush style)
 *   shape   geometric shape (from/to + fill/stroke style)
 *
 * Marks are plain, JSON-serialisable objects (no methods), so saving is just
 * JSON.stringify. Rendering is done by strokeRenderer / shapeGeometry.
 */

let _seq = 0;
const uid = () => `m${Date.now().toString(36)}${(_seq++).toString(36)}`;

export function makeStrokeMark({ profileId, color, size, opacity = 1, hardness = null, seed = null, points = [] }) {
  return {
    id: uid(),
    kind: 'stroke',
    profileId,
    color,
    size,
    opacity,
    hardness,
    seed: seed == null ? (Math.floor(Math.random() * 1e9) >>> 0) : seed,
    points: points.map((p) => ({ x: p.x, y: p.y, p: p.p ?? 1 })),
  };
}

export function makeShapeMark({ shape, from, to, stroke = '#000000', fill = 'none',
  strokeWidth = 8, opacity = 1, sides = 6, spikes = 5 }) {
  return {
    id: uid(),
    kind: 'shape',
    shape,
    from: { x: from.x, y: from.y },
    to: { x: to.x, y: to.y },
    stroke, fill, strokeWidth, opacity, sides, spikes,
  };
}

/** Restore marks from parsed JSON, dropping anything malformed. */
export function reviveMark(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.kind === 'stroke' && Array.isArray(data.points)) {
    return {
      id: data.id || uid(), kind: 'stroke',
      profileId: data.profileId || 'brush',
      color: data.color || '#000000',
      size: +data.size || 20,
      opacity: data.opacity ?? 1,
      hardness: data.hardness ?? null,
      seed: (data.seed >>> 0) || 1,
      points: data.points.map((p) => ({ x: +p.x, y: +p.y, p: p.p ?? 1 })),
    };
  }
  if (data.kind === 'shape' && data.from && data.to) {
    return {
      id: data.id || uid(), kind: 'shape',
      shape: data.shape || 'rectangle',
      from: { x: +data.from.x, y: +data.from.y },
      to: { x: +data.to.x, y: +data.to.y },
      stroke: data.stroke || '#000000',
      fill: data.fill || 'none',
      strokeWidth: +data.strokeWidth || 8,
      opacity: data.opacity ?? 1,
      sides: data.sides || 6,
      spikes: data.spikes || 5,
    };
  }
  return null;
}

export default { makeStrokeMark, makeShapeMark, reviveMark };
