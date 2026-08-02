/**
 * exportImage.js — flatten the document to a single bitmap and export it as
 * PNG / JPG, produce gallery thumbnails, or print. Fully offline: everything is
 * done with canvas + data URLs, no network.
 */

/** Composite all visible layers (on the paper colour) into one canvas. */
export function compositeCanvas(app, { scale = 1, background = null } = {}) {
  const { w, h } = app.doc;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  const bg = background === null ? app.doc.paper : background;
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  app.doc.compositeTo(ctx);
  return c;
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function download(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportPNG(app) {
  const c = compositeCanvas(app, { background: null });
  download(c.toDataURL('image/png'), `رسمتي-${stamp()}.png`);
}

export function exportJPG(app) {
  const c = compositeCanvas(app, { background: '#ffffff' });
  download(c.toDataURL('image/jpeg', 0.92), `رسمتي-${stamp()}.jpg`);
}

/** Small thumbnail data URL for the save gallery (max ~260px wide). */
export function thumbnail(app, maxW = 260) {
  const scale = Math.min(1, maxW / app.doc.w);
  return compositeCanvas(app, { scale, background: null }).toDataURL('image/png');
}

/** Print the artwork via a hidden iframe (no popup, works offline). */
export function printArtwork(app) {
  const url = compositeCanvas(app, { background: '#ffffff' }).toDataURL('image/png');
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>طباعة الرسمة</title>
    <style>@page{margin:10mm} html,body{margin:0} img{max-width:100%;height:auto;display:block;margin:auto}</style>
    </head><body><img src="${url}" alt="رسمتي"></body></html>`);
  doc.close();
  const go = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 1000);
  };
  const img = doc.querySelector('img');
  if (img && !img.complete) img.onload = go; else setTimeout(go, 120);
}

export default { compositeCanvas, exportPNG, exportJPG, thumbnail, printArtwork };
