/**
 * exportImage.js — export/print the completed picture. The assembled puzzle IS
 * the source image, so we export the board-resolution raster directly (clean, no
 * seams). Fully offline (canvas + data URLs).
 */
function download(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
function stamp() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; }
function flatten(app) {
  const src = app.model?.imageCanvas;
  if (!src) return null;
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height); // opaque for JPG
  ctx.drawImage(src, 0, 0);
  return c;
}

export function exportPNG(app) { const c = flatten(app); if (c) download(c.toDataURL('image/png'), `لغز-${stamp()}.png`); }
export function exportJPG(app) { const c = flatten(app); if (c) download(c.toDataURL('image/jpeg', 0.92), `لغز-${stamp()}.jpg`); }

export function printImage(app) {
  const c = flatten(app); if (!c) return;
  const url = c.toDataURL('image/png');
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><meta charset="utf-8"><title>طباعة اللغز</title><style>@page{margin:8mm}html,body{margin:0}img{max-width:100%;height:auto;display:block;margin:auto}</style><img src="${url}" alt="اللغز">`);
  doc.close();
  const go = () => { frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(() => frame.remove(), 1000); };
  const img = doc.querySelector('img');
  if (img && !img.complete) img.onload = go; else setTimeout(go, 120);
}
