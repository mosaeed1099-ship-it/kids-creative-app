/**
 * seed.js — import the project's EXISTING data (the Sticker Studio and Puzzle
 * Studio packs) into the CMS store, so the editor starts with real content to
 * manage/preview and the generators have something to emit. Idempotent (skips
 * ids already present). Reuses the shipped data files — no duplicated content.
 */
const SOURCES = ['../../sticker-studio/data/', '../../puzzle-studio/data/'];

async function json(url) { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); }
const tagSlug = (t) => (typeof t === 'string' ? t : (t && (t.slug || t.label)) || '');

export async function importExistingContent(store) {
  let added = 0;
  for (const base of SOURCES) {
    const catalog = await json(new URL(`${base}catalog.json`, import.meta.url).href); // eslint-disable-line no-await-in-loop
    for (const pd of catalog.packs) {
      if (!store.get('packs', pd.id)) {
        store.create('packs', { id: pd.id, title: pd.title, description: { ar: '', en: '' }, icon: pd.thumbnail?.value || '📦', premium: !!pd.premium, order: pd.order || 0, tags: [] });
        added++;
      }
      const pack = await json(new URL(base + pd.url, import.meta.url).href); // eslint-disable-line no-await-in-loop
      for (const c of (pack.categories || [])) {
        if (!store.get('categories', c.id)) store.create('categories', { id: c.id, title: c.title, icon: c.icon || '🗂️', packId: pd.id });
      }
      for (const it of (pack.items || [])) {
        if (store.get('items', it.id)) continue;
        store.create('items', {
          id: it.id, assetType: it.assetType, title: it.title, description: it.description || { ar: '', en: '' },
          tags: (it.tags || []).map(tagSlug).filter(Boolean), categoryId: it.categoryId || '', packId: pd.id, asset: it.asset || null,
        });
        added++;
      }
    }
  }
  return added;
}
