/**
 * bgImage.js — read a background-image file and downscale/re-encode it (JPEG) so
 * page backgrounds stay small in localStorage. Fully offline.
 */
import { loadImage } from '../scene/factory.js';

const MAX_DIM = 1600;

export async function fileToStoredDataUrl(file) {
  const raw = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
  const img = await loadImage(raw);
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale >= 1) return raw;
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * scale);
  cv.height = Math.round(img.naturalHeight * scale);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', 0.85);
}
