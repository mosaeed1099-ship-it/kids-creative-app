/**
 * TraceSurface — the paint layer the child draws ON while tracing.
 * Unlike the Coloring PaintSurface there is NO outline/flood-fill: strokes go
 * onto a transparent canvas that sits above the reference image.
 *
 * Stroke/dot signatures match the Coloring module's tools ({color,size,erase})
 * so those tools (Brush/Pencil/Eraser) can be reused directly.
 */
export default class TraceSurface {
  constructor(width, height) {
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.paint = document.createElement('canvas');
    this.paint.width = this.width; this.paint.height = this.height;
    this.ctx = this.paint.getContext('2d', { willReadFrequently: true });
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
  }

  dot(x, y, { color = '#000', size = 12, erase = false } = {}) {
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, Math.max(0.5, size / 2), 0, Math.PI * 2); c.fill();
    c.restore();
  }

  stroke(x0, y0, x1, y1, { color = '#000', size = 12, erase = false } = {}) {
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    c.strokeStyle = color; c.lineWidth = size;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.restore();
  }

  clearPaint() { this.ctx.clearRect(0, 0, this.width, this.height); }

  snapshot() { return this.ctx.getImageData(0, 0, this.width, this.height); }
  restore(imageData) { this.ctx.putImageData(imageData, 0, 0); }

  loadPaint(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.clearPaint(); this.ctx.drawImage(img, 0, 0, this.width, this.height); resolve(true); };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }
  paintDataURL() { return this.paint.toDataURL('image/png'); }

  /** Flattened export: white page + (optional reference) + the drawing. */
  compositeCanvas({ background = '#ffffff', scale = 1, reference = null } = {}) {
    const out = document.createElement('canvas');
    out.width = Math.round(this.width * scale);
    out.height = Math.round(this.height * scale);
    const ctx = out.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, out.width, out.height); }
    ctx.scale(scale, scale);
    if (reference) reference(ctx);       // optional callback to draw the reference beneath
    ctx.drawImage(this.paint, 0, 0);
    return out;
  }
}
