/**
 * PrintService — sends pre-rendered page canvases to the browser's print
 * dialog. Uses a hidden iframe with a matching @page size/orientation, one
 * full-bleed image per page. The margins/scale/fit/color are already baked into
 * each page canvas by PreviewRenderer, so printing is WYSIWYG and offline.
 */
export default class PrintService {
  /**
   * @param {HTMLCanvasElement[]} canvases - full page canvases
   * @param {object} settings - { pageSize, orientation }
   */
  static print(canvases, settings = {}) {
    const size = (settings.pageSize || 'A4');
    const orient = settings.orientation === 'landscape' ? 'landscape' : 'portrait';
    const sizeKeyword = size === 'Letter' ? 'letter' : 'A4';

    const imgs = canvases.map((c) => `<div class="pg"><img src="${c.toDataURL('image/png')}"></div>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page { size: ${sizeKeyword} ${orient}; margin: 0; }
      html,body { margin:0; padding:0; }
      .pg { width:100%; height:100vh; display:flex; align-items:center; justify-content:center; page-break-after:always; overflow:hidden; }
      .pg:last-child { page-break-after:auto; }
      img { width:100%; height:100%; object-fit:contain; }
    </style></head><body>${imgs}</body></html>`;

    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:-9999px;bottom:-9999px;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    const done = () => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) {} setTimeout(() => frame.remove(), 60000); };
    // wait for images to decode
    const imgsEl = doc.images;
    if (imgsEl.length && !imgsEl[imgsEl.length - 1].complete) imgsEl[imgsEl.length - 1].onload = () => setTimeout(done, 100);
    else setTimeout(done, 200);
  }
}
