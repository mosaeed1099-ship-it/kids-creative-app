/**
 * compareClip.js — helper for split-comparison. Clips the current context (in
 * WORLD space) to the left or right half of the viewport, split at the camera
 * centre. Used by the reference (left) and drawing (right) layers.
 */
export function applySplitClip(ctx, engine, side) {
  const camX = engine.camera.x;
  const BIG = 1e6;
  ctx.beginPath();
  if (side === 'left') ctx.rect(camX - BIG, -BIG, BIG, BIG * 2);
  else ctx.rect(camX, -BIG, BIG, BIG * 2);
  ctx.clip();
}

export default applySplitClip;
