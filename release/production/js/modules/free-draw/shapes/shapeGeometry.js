/**
 * shapeGeometry.js — path builders for every shape tool, plus a single
 * `paintShape` that fills/strokes a shape `mark`. Shared by the live preview
 * and the committed render, so shapes never duplicate drawing code.
 *
 * A shape mark stores `from`/`to` (the drag start/end in document space),
 * `shape`, style (stroke/fill/strokeWidth) and, for polygons, `sides`.
 */
import { TAU, rectFromPoints } from '../util/geometry.js';

/** Regular star with `spikes` points inside the given rect. */
function traceStar(ctx, rect, spikes = 5) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const outerX = rect.w / 2;
  const outerY = rect.h / 2;
  const inner = 0.42;
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.moveTo(cx + Math.cos(rot) * outerX, cy + Math.sin(rot) * outerY);
  for (let i = 0; i < spikes; i++) {
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * outerX * inner, cy + Math.sin(rot) * outerY * inner);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * outerX, cy + Math.sin(rot) * outerY);
  }
  ctx.closePath();
}

/** Regular polygon with `sides` sides inside the rect. */
function tracePolygon(ctx, rect, sides = 6) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const rx = rect.w / 2;
  const ry = rect.h / 2;
  const start = -Math.PI / 2;
  for (let i = 0; i <= sides; i++) {
    const a = start + (i / sides) * TAU;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function traceTriangle(ctx, rect) {
  ctx.moveTo(rect.x + rect.w / 2, rect.y);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
  ctx.lineTo(rect.x, rect.y + rect.h);
  ctx.closePath();
}

function traceHeart(ctx, rect) {
  const { x, y, w, h } = rect;
  const topY = y + h * 0.3;
  ctx.moveTo(x + w / 2, y + h);
  ctx.bezierCurveTo(x - w * 0.05, y + h * 0.55, x + w * 0.1, y, x + w / 2, topY);
  ctx.bezierCurveTo(x + w * 0.9, y, x + w * 1.05, y + h * 0.55, x + w / 2, y + h);
  ctx.closePath();
}

function traceSpeechBubble(ctx, rect) {
  const { x, y, w } = rect;
  const h = rect.h * 0.8;
  const r = Math.min(w, h) * 0.22;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  // tail
  ctx.lineTo(x + w * 0.34, y + h);
  ctx.lineTo(x + w * 0.2, y + rect.h);
  ctx.lineTo(x + w * 0.24, y + h);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function traceRoundRect(ctx, rect) {
  const r = Math.min(rect.w, rect.h) * 0.12;
  const { x, y, w, h } = rect;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function traceEllipse(ctx, rect) {
  ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2, rect.h / 2, 0, 0, TAU);
}

function drawArrowHead(ctx, from, to, size) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const a = Math.PI / 7;
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(ang - a), to.y - size * Math.sin(ang - a));
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(ang + a), to.y - size * Math.sin(ang + a));
}

/** The list of shapes shown in the picker. */
export const SHAPES = [
  { id: 'line', label: 'خط', emoji: '➖' },
  { id: 'arrow', label: 'سهم', emoji: '➡️' },
  { id: 'rectangle', label: 'مربع', emoji: '⬛' },
  { id: 'circle', label: 'دائرة', emoji: '⚪' },
  { id: 'triangle', label: 'مثلث', emoji: '🔺' },
  { id: 'star', label: 'نجمة', emoji: '⭐' },
  { id: 'polygon', label: 'مضلّع', emoji: '⬡' },
  { id: 'heart', label: 'قلب', emoji: '❤️' },
  { id: 'speech', label: 'فقاعة كلام', emoji: '💬' },
];

/** Fill + stroke a shape mark onto a (document-space) context. */
export function paintShape(ctx, mark) {
  const rect = rectFromPoints(mark.from, mark.to);
  const lineOnly = mark.shape === 'line' || mark.shape === 'arrow';

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = mark.strokeWidth;
  ctx.globalAlpha = mark.opacity ?? 1;

  if (lineOnly) {
    ctx.strokeStyle = mark.stroke;
    ctx.beginPath();
    ctx.moveTo(mark.from.x, mark.from.y);
    ctx.lineTo(mark.to.x, mark.to.y);
    if (mark.shape === 'arrow') {
      const size = Math.max(12, mark.strokeWidth * 3.2);
      drawArrowHead(ctx, mark.from, mark.to, size);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  switch (mark.shape) {
    case 'rectangle': traceRoundRect(ctx, rect); break;
    case 'circle': traceEllipse(ctx, rect); break;
    case 'triangle': traceTriangle(ctx, rect); break;
    case 'star': traceStar(ctx, rect, mark.spikes || 5); break;
    case 'polygon': tracePolygon(ctx, rect, mark.sides || 6); break;
    case 'heart': traceHeart(ctx, rect); break;
    case 'speech': traceSpeechBubble(ctx, rect); break;
    default: traceRoundRect(ctx, rect);
  }
  if (mark.fill && mark.fill !== 'none') { ctx.fillStyle = mark.fill; ctx.fill(); }
  if (mark.strokeWidth > 0) { ctx.strokeStyle = mark.stroke; ctx.stroke(); }
  ctx.restore();
}

export default { SHAPES, paintShape };
