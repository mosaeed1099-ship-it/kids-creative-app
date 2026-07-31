/**
 * ExportManager — get pixels or scene data OUT of the engine.
 *
 *  - toDataURL / toBlob: rasterize the current canvas (optionally a world
 *    region at a chosen scale) to PNG/JPEG.
 *  - toJSON: serialize the whole scene (layers + objects) for saving.
 *  - download: convenience to trigger a browser download.
 *
 * Rasterizing a region renders the scene into an offscreen canvas so exports
 * are independent of the on-screen camera/zoom.
 */
export default class ExportManager {
  constructor({ engine } = {}) {
    this.engine = engine;
  }

  /** Rasterize to a data URL. */
  toDataURL({ type = 'image/png', quality = 0.92, region = null, scale = 1, background = null } = {}) {
    const canvas = region
      ? this._renderRegion(region, scale, background)
      : this._renderFull(scale, background);
    return canvas.toDataURL(type, quality);
  }

  /** Rasterize to a Blob (async). */
  toBlob({ type = 'image/png', quality = 0.92, region = null, scale = 1, background = null } = {}) {
    const canvas = region
      ? this._renderRegion(region, scale, background)
      : this._renderFull(scale, background);
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  /** Serialize the scene graph. */
  toJSON() {
    const { layers, camera } = this.engine;
    return {
      version: 1,
      camera: camera.toJSON(),
      layers: layers.layers.map((l) => ({
        id: l.id, name: l.name, zIndex: l.zIndex, visible: l.visible, opacity: l.opacity,
        objects: l.objects.map((o) => o.toJSON()),
      })),
    };
  }

  /** Trigger a file download from a data URL. */
  download(dataUrl, filename = 'export.png') {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  // --- internals ---

  _renderFull(scale, background) {
    // Snapshot the visible canvas at an optional scale multiplier.
    const src = this.engine.viewport.canvas;
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.floor(src.width * scale));
    out.height = Math.max(1, Math.floor(src.height * scale));
    const ctx = out.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, out.width, out.height); }
    ctx.drawImage(src, 0, 0, out.width, out.height);
    return out;
  }

  _renderRegion(region, scale, background) {
    // region = { x, y, w, h } in WORLD units. Render the scene into a fresh
    // canvas of that size, ignoring the on-screen camera.
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.floor(region.w * scale));
    out.height = Math.max(1, Math.floor(region.h * scale));
    const ctx = out.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, out.width, out.height); }
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-region.x, -region.y);
    this.engine.layers.render(ctx, this.engine);
    ctx.restore();
    return out;
  }
}
