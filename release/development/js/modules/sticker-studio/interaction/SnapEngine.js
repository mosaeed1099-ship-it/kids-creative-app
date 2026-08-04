/**
 * SnapEngine.js — alignment snapping while dragging a sticker. Snaps the moving
 * sticker's centre to the page centre and to other stickers' centres, and
 * reports guide lines to draw. Threshold is in screen pixels (zoom-aware).
 */
export default class SnapEngine {
  constructor(app, { threshold = 7 } = {}) { this.app = app; this.threshold = threshold; }

  snap(obj, cx, cy) {
    const t = this.threshold / this.app.engine.camera.zoom;
    const xs = [this.app.pageW / 2];
    const ys = [this.app.pageH / 2];
    for (const o of this.app.stickers) { if (o === obj) continue; xs.push(o.x); ys.push(o.y); }

    let sx = cx, sy = cy; const guides = [];
    let bx = t, bestX = null;
    for (const p of xs) { const d = Math.abs(cx - p); if (d < bx) { bx = d; bestX = p; } }
    let by = t, bestY = null;
    for (const p of ys) { const d = Math.abs(cy - p); if (d < by) { by = d; bestY = p; } }
    if (bestX != null) { sx = bestX; guides.push({ axis: 'v', pos: bestX }); }
    if (bestY != null) { sy = bestY; guides.push({ axis: 'h', pos: bestY }); }
    return { x: sx, y: sy, guides };
  }
}
