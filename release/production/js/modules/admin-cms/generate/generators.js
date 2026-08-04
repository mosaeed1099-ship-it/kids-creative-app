/**
 * generators.js — turn the CMS store into the project's data files, with NO
 * manual JSON editing. Reuses the Content Engine models (ContentItem / Pack /
 * Category) to normalise/validate the output shape.
 *
 * Assets may be IndexedDB references (Phase 17A.1, C2), so item shaping is async:
 * each asset is resolved back to inline `{ type, data, … }` in the output, since
 * the shipped data files must be self-contained for the offline kids app.
 *
 * Produces: catalog.json, packs.json, stickers.json, activities.json, story.json
 */
import { ContentItem, Pack } from '../../../content/index.js';
import { resolveAssetData } from '../io/assets.js';

function cleanItem(i) { const { order, _reorder, ...rest } = i; return rest; }

async function shapeItem(i) {
  const clean = cleanItem(i);
  if (clean.asset) { const a = await resolveAssetData(clean.asset); if (a) { const { ref, ...inline } = a; clean.asset = inline; } }
  return new ContentItem(clean).toJSON();
}

export function buildCatalog(store) {
  return {
    version: 1,
    title: { ar: 'مكتبة المحتوى', en: 'Content Library' },
    packs: store.list('packs').slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((p) => ({
      id: p.id, title: p.title, url: `packs/${p.id}.pack.json`,
      thumbnail: { type: 'emoji', value: p.icon || '📦' }, premium: !!p.premium, order: p.order || 0,
    })),
  };
}

export async function buildPacks(store) {
  const out = [];
  for (const p of store.list('packs')) {
    const categories = store.list('categories').filter((c) => c.packId === p.id).map((c) => ({ id: c.id, title: c.title, icon: c.icon, packId: c.packId }));
    const items = await Promise.all(store.list('items').filter((i) => i.packId === p.id).map(shapeItem)); // eslint-disable-line no-await-in-loop
    out.push(new Pack({ ...p, thumbnail: { type: 'emoji', value: p.icon || '📦' }, categories, items }).toJSON());
  }
  return out;
}

export async function buildTypeFile(store, assetType, meta) {
  return { version: 1, ...meta, items: await Promise.all(store.itemsByType(assetType).map(shapeItem)) };
}

/** All output files as { filename: object }. */
export async function generateAll(store) {
  return {
    'catalog.json': buildCatalog(store),
    'packs.json': await buildPacks(store),
    'stickers.json': await buildTypeFile(store, 'sticker', { title: 'Stickers' }),
    'activities.json': await buildTypeFile(store, 'activity', { title: 'Activities' }),
    'story.json': await buildTypeFile(store, 'story', { title: 'Stories' }),
  };
}

export function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  triggerDownload(filename, blob);
}

/** Shared download helper (used for JSON and the deploy ZIP). */
export function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
