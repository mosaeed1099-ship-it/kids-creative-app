/**
 * imageImport.js — import a local image file into an ImageObject. Large photos
 * are downscaled + re-encoded (JPEG) so saves stay small and fully offline.
 */
import ImageObject from '../scene/ImageObject.js';
import { loadImage } from '../scene/factory.js';

const MAX_DIM = 1400;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

function downscale(img) {
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale >= 1) return null;
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * scale);
  cv.height = Math.round(img.naturalHeight * scale);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', 0.86);
}

export async function importImageFile(app, file) {
  let src = await fileToDataUrl(file);
  let img = await loadImage(src);
  const small = downscale(img);
  if (small) { src = small; img = await loadImage(src); }
  const maxW = app.PAGE_W * 0.55, maxH = app.PAGE_H * 0.55;
  const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  return new ImageObject({
    src, natW: img.naturalWidth, natH: img.naturalHeight, width: w, height: h,
    x: app.PAGE_W / 2, y: app.PAGE_H / 2, z: app.topZ() + 1,
  }, img);
}
