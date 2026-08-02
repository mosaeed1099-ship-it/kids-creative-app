/**
 * upload.js — read an uploaded file into an inline asset descriptor
 * { type, data, name, mime, size }. SVG is kept as text; PDF as a data URL;
 * raster images are downscaled + re-encoded to keep localStorage small. Fully
 * offline (FileReader + canvas only).
 */
const MAX_DIM = 1400;

function guessMime(name) {
  const e = (name.split('.').pop() || '').toLowerCase();
  return { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf' }[e] || 'application/octet-stream';
}

function readText(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsText(file); }); }
function readDataUrl(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(file); }); }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = src; }); }

export async function readAssetFile(file) {
  const name = file.name || 'file';
  const mime = file.type || guessMime(name);
  const base = { name, size: file.size };
  if (/svg/i.test(mime) || /\.svg$/i.test(name)) return { type: 'svg', data: await readText(file), mime: 'image/svg+xml', ...base };
  if (/pdf/i.test(mime) || /\.pdf$/i.test(name)) return { type: 'pdf', data: await readDataUrl(file), mime: 'application/pdf', ...base };
  // raster image → downscale
  const raw = await readDataUrl(file);
  const img = await loadImg(raw);
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const isJpeg = /jpe?g/i.test(mime);
  if (scale >= 1 && raw.length < 400000) return { type: 'image', data: raw, mime, ...base };
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * scale);
  cv.height = Math.round(img.naturalHeight * scale);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return { type: 'image', data: cv.toDataURL(isJpeg ? 'image/jpeg' : 'image/png', 0.86), mime: isJpeg ? 'image/jpeg' : 'image/png', ...base };
}

/** The visual kind used for previews. */
export function assetKind(asset) { return asset ? asset.type : 'none'; }
