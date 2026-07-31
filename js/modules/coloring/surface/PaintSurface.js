/**
 * PaintSurface — the raster heart of the Coloring feature.
 *
 * Holds two same-size canvases:
 *   - outline : the black line-art (transparent background) drawn on TOP
 *   - paint   : where fills / brush strokes go, drawn UNDERNEATH
 *
 * The composite (paint below, outline above) is what the child sees, so colors
 * always fill *inside* the lines. A barrier map derived from the outline stops
 * the flood fill at the black lines.
 *
 * This class is pure raster logic — it knows nothing about the Canvas Engine,
 * tools or UI. The ArtworkObject draws it into the engine world.
 */
export default class PaintSurface {
  /**
   * @param {HTMLImageElement|HTMLCanvasElement} outlineImage - loaded line-art
   * @param {object} [opts]
   * @param {number} [opts.maxSize] - cap the longest side for memory/perf
   */
  constructor(outlineImage, { maxSize = 1400 } = {}) {
    const iw = outlineImage.naturalWidth || outlineImage.width;
    const ih = outlineImage.naturalHeight || outlineImage.height;
    const scale = Math.min(1, maxSize / Math.max(iw, ih));
    this.width = Math.max(1, Math.round(iw * scale));
    this.height = Math.max(1, Math.round(ih * scale));

    this.outline = document.createElement('canvas');
    this.outline.width = this.width; this.outline.height = this.height;
    this._octx = this.outline.getContext('2d');
    this._octx.drawImage(outlineImage, 0, 0, this.width, this.height);

    this.paint = document.createElement('canvas');
    this.paint.width = this.width; this.paint.height = this.height;
    this.ctx = this.paint.getContext('2d', { willReadFrequently: true });
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';

    this._buildBarrier();
  }

  /** Barrier = dark, opaque outline pixels (the lines the fill must not cross). */
  _buildBarrier() {
    const { width: w, height: h } = this;
    const data = this._octx.getImageData(0, 0, w, h).data;
    this.barrier = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const a = data[i + 3];
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      this.barrier[p] = (a > 60 && lum < 110) ? 1 : 0;
    }
  }

  // ---------- painting ----------

  static parseColor(hex) {
    let s = String(hex).trim();
    if (s[0] === '#') s = s.slice(1);
    if (s.length === 3) s = s.split('').map((c) => c + c).join('');
    const n = parseInt(s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 };
  }

  /**
   * Flood fill the contiguous region at (x,y) that is bounded by outline lines.
   * Fills on the paint layer regardless of the paint's current color.
   */
  fill(x, y, color) {
    const w = this.width, h = this.height;
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const seed = y * w + x;
    if (this.barrier[seed]) return false; // clicked on a line

    const { r, g, b } = PaintSurface.parseColor(color);
    const img = this.ctx.getImageData(0, 0, w, h);
    const px = img.data;
    const visited = new Uint8Array(w * h);

    // scanline flood fill bounded by the barrier map
    const stack = [[x, y]];
    while (stack.length) {
      let [sx, sy] = stack.pop();
      let idx = sy * w + sx;
      // move to the left edge of the span
      while (sx >= 0 && !this.barrier[idx] && !visited[idx]) { sx--; idx--; }
      sx++; idx++;
      let spanUp = false, spanDown = false;
      while (sx < w && !this.barrier[idx] && !visited[idx]) {
        visited[idx] = 1;
        const p4 = idx * 4;
        px[p4] = r; px[p4 + 1] = g; px[p4 + 2] = b; px[p4 + 3] = 255;

        if (sy > 0) {
          const up = idx - w;
          if (!this.barrier[up] && !visited[up]) { if (!spanUp) { stack.push([sx, sy - 1]); spanUp = true; } }
          else spanUp = false;
        }
        if (sy < h - 1) {
          const dn = idx + w;
          if (!this.barrier[dn] && !visited[dn]) { if (!spanDown) { stack.push([sx, sy + 1]); spanDown = true; } }
          else spanDown = false;
        }
        sx++; idx++;
      }
    }
    this.ctx.putImageData(img, 0, 0);
    return true;
  }

  /** Draw a round dot (used at stroke start / for taps). */
  dot(x, y, { color = '#000', size = 12, erase = false } = {}) {
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, Math.max(0.5, size / 2), 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  /** Draw a stroke segment from (x0,y0) to (x1,y1). */
  stroke(x0, y0, x1, y1, { color = '#000', size = 12, erase = false } = {}) {
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    c.strokeStyle = color;
    c.lineWidth = size;
    c.beginPath();
    c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.restore();
  }

  clearPaint() { this.ctx.clearRect(0, 0, this.width, this.height); }

  // ---------- history / persistence ----------

  snapshot() { return this.ctx.getImageData(0, 0, this.width, this.height); }
  restore(imageData) { this.ctx.putImageData(imageData, 0, 0); }

  /** Load a saved paint layer (dataURL) — async. */
  loadPaint(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.clearPaint(); this.ctx.drawImage(img, 0, 0, this.width, this.height); resolve(true); };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }

  /** PNG dataURL of just the paint layer (for saving progress). */
  paintDataURL() { return this.paint.toDataURL('image/png'); }

  // ---------- composite / export ----------

  /** Draw paint (below) + outline (above) into a target 2D context. */
  drawInto(ctx) {
    ctx.drawImage(this.paint, 0, 0);
    ctx.drawImage(this.outline, 0, 0);
  }

  /** Flattened composite for export/print. */
  compositeCanvas({ background = '#ffffff', scale = 1 } = {}) {
    const out = document.createElement('canvas');
    out.width = Math.round(this.width * scale);
    out.height = Math.round(this.height * scale);
    const ctx = out.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, out.width, out.height); }
    ctx.scale(scale, scale);
    this.drawInto(ctx);
    return out;
  }
}
