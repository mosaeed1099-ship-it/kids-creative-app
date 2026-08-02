/**
 * exportImage.js — export/print the sticker scene. Rasterisation is delegated to
 * the engine's public ExportManager (`engine.exporter.toDataURL` with a world
 * region), so there is NO duplicated rendering logic — we just choose the page
 * region, scale and format, then download or print.
 */
function pageRegion(app) { return { x: 0, y: 0, w: app.pageW, h: app.pageH }; }

function download(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

function stamp() {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function exportPNG(app) {
  const url = app.engine.exporter.toDataURL({ type: 'image/png', region: pageRegion(app), scale: 2 });
  download(url, `ملصقاتي-${stamp()}.png`);
}

export function exportJPG(app) {
  const url = app.engine.exporter.toDataURL({ type: 'image/jpeg', quality: 0.92, region: pageRegion(app), scale: 2, background: '#ffffff' });
  download(url, `ملصقاتي-${stamp()}.jpg`);
}

export function thumbnail(app) {
  const scale = Math.min(1, 260 / app.pageW);
  return app.engine.exporter.toDataURL({ type: 'image/png', region: pageRegion(app), scale });
}

export function printScene(app) {
  const url = app.engine.exporter.toDataURL({ type: 'image/png', region: pageRegion(app), scale: 2, background: '#ffffff' });
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><meta charset="utf-8"><title>طباعة الملصقات</title>
    <style>@page{margin:8mm} html,body{margin:0} img{max-width:100%;height:auto;display:block;margin:auto}</style>
    <img src="${url}" alt="ملصقاتي">`);
  doc.close();
  const go = () => { frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(() => frame.remove(), 1000); };
  const img = doc.querySelector('img');
  if (img && !img.complete) img.onload = go; else setTimeout(go, 120);
}
