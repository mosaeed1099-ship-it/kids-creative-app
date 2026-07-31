/**
 * CoordinateSystem — conversions between the three spaces the engine uses:
 *
 *   client  → raw event.clientX/Y (page pixels)
 *   screen  → pixels inside the canvas (CSS px, origin top-left of canvas)
 *   world   → logical scene coordinates (after camera pan/zoom)
 *
 * Depends on Viewport (size + bounding rect) and Camera (pan/zoom).
 */
export default class CoordinateSystem {
  constructor({ viewport, camera }) {
    this.viewport = viewport;
    this.camera = camera;
  }

  /** Raw pointer event → screen-space point relative to the canvas. */
  clientToScreen(clientX, clientY) {
    const r = this.viewport.rect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  /** Screen-space (CSS px) → world-space. */
  screenToWorld(sx, sy) {
    const { width: W, height: H } = this.viewport;
    const cam = this.camera;
    return {
      x: (sx - W / 2) / cam.zoom + cam.x,
      y: (sy - H / 2) / cam.zoom + cam.y,
    };
  }

  /** World-space → screen-space (CSS px). */
  worldToScreen(wx, wy) {
    const { width: W, height: H } = this.viewport;
    const cam = this.camera;
    return {
      x: (wx - cam.x) * cam.zoom + W / 2,
      y: (wy - cam.y) * cam.zoom + H / 2,
    };
  }

  /** Convenience: raw event → world. */
  clientToWorld(clientX, clientY) {
    const s = this.clientToScreen(clientX, clientY);
    return this.screenToWorld(s.x, s.y);
  }

  /**
   * Apply the full camera transform to a context so subsequent draw calls use
   * WORLD coordinates. Includes the device-pixel-ratio scale.
   */
  applyTo(ctx) {
    const { width: W, height: H, dpr } = this.viewport;
    const cam = this.camera;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
  }
}
