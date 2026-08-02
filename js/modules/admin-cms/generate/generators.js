/**
 * generators.js — turn the CMS store into the project's data files, with NO
 * manual JSON editing. Reuses the Content Engine models (ContentItem / Pack /
 * Category) to normalise/validate the output shape.
 *
 * Produces: catalog.json, packs.json, stickers.json, activities.json, story.json
 */
import { ContentItem, Pack } from '../../../content/index.js';

const shapeItem = (i) => new ContentItem(cleanItem(i)).toJSON();
function cleanItem(i) { const { order, _reorder, ...rest } = i; return rest; }

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

export function buildPacks(store) {
  return store.list('packs').map((p) => {
    const categories = store.list('categories').filter((c) => c.packId === p.id).map((c) => ({ id: c.id, title: c.title, icon: c.icon, packId: c.packId }));
    const items = store.list('items').filter((i) => i.packId === p.id).map(shapeItem);
    return new Pack({ ...p, thumbnail: { type: 'emoji', value: p.icon || '📦' }, categories, items }).toJSON();
  });
}

export function buildTypeFile(store, assetType, meta) {
  return { version: 1, ...meta, items: store.itemsByType(assetType).map(shapeItem) };
}

/** All output files as { filename: object }. */
export function generateAll(store) {
  return {
    'catalog.json': buildCatalog(store),
    'packs.json': buildPacks(store),
    'stickers.json': buildTypeFile(store, 'sticker', { title: 'Stickers' }),
    'activities.json': buildTypeFile(store, 'activity', { title: 'Activities' }),
    'story.json': buildTypeFile(store, 'story', { title: 'Stories' }),
  };
}

export function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
