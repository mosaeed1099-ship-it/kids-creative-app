/**
 * validate.js — pre-release validation of the CMS store (Phase 17B).
 * Checks referential integrity before a release is built. Offline; reuses the
 * asset resolver to detect missing binaries.
 *
 * Issues: { level:'error'|'warning', code, message, ref:{coll,id} }.
 * Errors block a clean release; warnings are advisory.
 */
import { resolveAssetData } from '../io/assets.js';

const hasTitle = (t) => !!(t && (typeof t === 'string' ? t.trim() : (t.ar || t.en)));
const ASSET_TYPES = new Set(['coloring', 'sticker', 'puzzle', 'pdf']);

export async function validateStore(store) {
  const errors = [], warnings = [];
  const err = (code, message, ref) => errors.push({ level: 'error', code, message, ref });
  const warn = (code, message, ref) => warnings.push({ level: 'warning', code, message, ref });

  // duplicate IDs (per collection)
  for (const coll of ['packs', 'items', 'categories', 'assets']) {
    const seen = new Set();
    for (const o of store.list(coll)) {
      if (seen.has(o.id)) err('dup-id', `معرّف مكرر في ${coll}: ${o.id}`, { coll, id: o.id });
      seen.add(o.id);
    }
  }

  const packIds = new Set(store.list('packs').map((p) => p.id));
  const catIds = new Set(store.list('categories').map((c) => c.id));

  // broken references
  for (const it of store.list('items')) {
    if (it.packId && !packIds.has(it.packId)) err('broken-pack', `العنصر ${it.id} يشير إلى حزمة غير موجودة (${it.packId})`, { coll: 'items', id: it.id });
    if (it.categoryId && !catIds.has(it.categoryId)) err('broken-category', `العنصر ${it.id} يشير إلى تصنيف غير موجود (${it.categoryId})`, { coll: 'items', id: it.id });
    if (!hasTitle(it.title)) warn('no-title', `العنصر ${it.id} بدون عنوان`, { coll: 'items', id: it.id });
  }
  for (const c of store.list('categories')) {
    if (c.packId && !packIds.has(c.packId)) err('broken-category-pack', `التصنيف ${c.id} يشير إلى حزمة غير موجودة (${c.packId})`, { coll: 'categories', id: c.id });
  }

  // missing assets (resolve every referenced binary)
  for (const it of store.list('items')) {
    const a = it.asset;
    if (a && a.type !== 'emoji') {
      const full = await resolveAssetData(a); // eslint-disable-line no-await-in-loop
      if (!full || full.data == null) err('missing-asset', `أصل مفقود للعنصر ${it.id}`, { coll: 'items', id: it.id });
    } else if (!a && ASSET_TYPES.has(it.assetType)) {
      warn('no-asset', `العنصر ${it.id} (${it.assetType}) بلا ملف`, { coll: 'items', id: it.id });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
