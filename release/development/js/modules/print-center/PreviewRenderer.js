/**
 * PreviewRenderer — renders a printable item onto a full PAGE canvas honoring
 * the print settings (page size, orientation, margins, scale, fit-to-page,
 * color / black&white). The same page canvas is used for on-screen preview,
 * printing, PDF embedding and ZIP export. Images are loaded and cached in the
 * browser — nothing leaves the device.
 */
const PAGE_PT = { A4: [595.28, 841.89], Letter: [612, 792] };
const DPI = 140;

export default class PreviewRenderer {
  constructor() { this._cache = new Map(); }

  image(url) {
    if (this._cache.has(url)) return this._cache.get(url);
    const pr = new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = url; });
    this._cache.set(url, pr);
    return pr;
  }

  pagePixels(settings) {
    let [pw, ph] = PAGE_PT[settings.pageSize] || PAGE_PT.A4;
    if (settings.orientation === 'landscape') [pw, ph] = [ph, pw];
    return { w: Math.round((pw / 72) * DPI), h: Math.round((ph / 72) * DPI) };
  }

  /** @returns {Promise<HTMLCanvasElement>} a full-page canvas. */
  async renderPage(url, settings) {
    const img = await this.image(url);
    const { w: PW, h: PH } = this.pagePixels(settings);
    const marginPx = Math.round(((settings.marginMm ?? 10) / 25.4) * DPI);
    const availW = PW - marginPx * 2, availH = PH - marginPx * 2;

    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    let s = settings.fit ? Math.min(availW / iw, availH / ih) : 1;
    s *= (settings.scale ?? 1);
    const dw = iw * s, dh = ih * s;
    const x = (PW - dw) / 2, y = (PH - dh) / 2;

    const c = document.createElement('canvas'); c.width = PW; c.height = PH;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, PW, PH);
    if (settings.color === 'bw') ctx.filter = 'grayscale(1)';
    ctx.drawImage(img, x, y, dw, dh);
    ctx.filter = 'none';
    return c;
  }

  static toJPEG(canvas, quality = 0.9) { return canvas.toDataURL('image/jpeg', quality); }
  static toPNG(canvas) { return canvas.toDataURL('image/png'); }
}
