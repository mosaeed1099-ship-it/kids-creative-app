/**
 * exportImage.js — render pages and export the story: current page as PNG/JPEG,
 * the whole book as a multi-page PDF (via the offline pdf.js encoder) or Print.
 * A page is rendered from its DATA (so any page exports, not just the open one),
 * reusing the same SceneObject.render used on screen.
 */
import CoverObject from '../scene/CoverObject.js';
import { buildObject, loadImage } from '../scene/factory.js';
import { buildPdf, jpegBinary } from './pdf.js';

function stamp() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`; }
function fileName(app) { return `${(app.story.meta.title || 'قصتي').slice(0, 30)}-${stamp()}`; }
function download(url, fn) { const a = document.createElement('a'); a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); }
function downloadBlob(blob, fn) { const url = URL.createObjectURL(blob); download(url, fn); setTimeout(() => URL.revokeObjectURL(url), 4000); }

export async function renderPageToCanvas(app, pageData, index, scale = 1) {
  const w = app.PAGE_W, h = app.PAGE_H;
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
  const ctx = cv.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = pageData.bgColor || '#ffffff';
  ctx.fillRect(0, 0, w, h);
  if (pageData.bgImage) {
    try {
      const img = await loadImage(pageData.bgImage);
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh); ctx.restore();
    } catch { /* ignore */ }
  }
  if (index === app.story.coverIndex) new CoverObject(app).render(ctx, app.engine);
  const objs = (pageData.objects || []).slice().sort((a, b) => (a.z || 0) - (b.z || 0));
  for (const d of objs) { const obj = await buildObject(app, d); if (obj) obj.render(ctx, app.engine); } // eslint-disable-line no-await-in-loop
  return cv;
}

/** Small JPEG thumbnail data URL for a page (filmstrip / library). */
export async function pageThumb(app, pageData, index, maxW = 220) {
  const cv = await renderPageToCanvas(app, pageData, index, maxW / app.PAGE_W);
  return cv.toDataURL('image/jpeg', 0.7);
}

export async function exportPNG(app) {
  app.syncActivePage();
  const cv = await renderPageToCanvas(app, app.page, app.pageIndex, 2);
  download(cv.toDataURL('image/png'), `${fileName(app)}-${app.pageIndex + 1}.png`);
}

export async function exportJPG(app) {
  app.syncActivePage();
  const cv = await renderPageToCanvas(app, app.page, app.pageIndex, 2);
  download(cv.toDataURL('image/jpeg', 0.92), `${fileName(app)}-${app.pageIndex + 1}.jpg`);
}

export async function exportPDF(app) {
  app.syncActivePage();
  const pages = [];
  for (let i = 0; i < app.story.pages.length; i++) {
    const cv = await renderPageToCanvas(app, app.story.pages[i], i, 1.5); // eslint-disable-line no-await-in-loop
    pages.push({ jpeg: jpegBinary(cv.toDataURL('image/jpeg', 0.85)), pxW: cv.width, pxH: cv.height });
  }
  downloadBlob(buildPdf(pages), `${fileName(app)}.pdf`);
}

export async function printStory(app) {
  app.syncActivePage();
  const urls = [];
  for (let i = 0; i < app.story.pages.length; i++) {
    const cv = await renderPageToCanvas(app, app.story.pages[i], i, 1.5); // eslint-disable-line no-await-in-loop
    urls.push(cv.toDataURL('image/jpeg', 0.9));
  }
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><meta charset="utf-8"><title>${app.story.meta.title || 'قصتي'}</title>
    <style>@page{margin:0}html,body{margin:0}img{width:100%;height:auto;display:block;page-break-after:always}</style>
    ${urls.map((u) => `<img src="${u}">`).join('')}`);
  doc.close();
  const go = () => { frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(() => frame.remove(), 1500); };
  const imgs = [...doc.images];
  if (imgs.length && !imgs[imgs.length - 1].complete) imgs[imgs.length - 1].onload = go; else setTimeout(go, 200);
}
