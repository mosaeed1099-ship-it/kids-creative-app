/**
 * usage.js — content-hash driven asset intelligence (Phase 17A.3), all offline.
 *
 * A library asset and a content item that share the same bytes have the same
 * `asset.hash` (see io/assets.js). From that we derive, with no backend:
 *   • usage references — which content items use an asset's bytes
 *   • duplicate detection — library assets sharing a hash
 *   • unused detection — library assets no content item references
 */
import { localized } from '../ui/helpers.js';

const nameOf = (r) => localized(r.title) || r.name || r.id;

/** Map hash → [{ coll, id, name, assetType }] over all CONTENT items. */
export function usageIndex(store) {
  const map = new Map();
  for (const it of store.list('items')) {
    const h = it.asset && it.asset.hash;
    if (!h) continue;
    if (!map.has(h)) map.set(h, []);
    map.get(h).push({ coll: 'items', id: it.id, name: nameOf(it), assetType: it.assetType });
  }
  return map;
}

export function usageForHash(index, hash) { return (hash && index.get(hash)) || []; }
export function usageOf(store, asset) { return usageForHash(usageIndex(store), asset && asset.hash); }

/** Groups of library assets that share a hash (each group length > 1). */
export function duplicateGroups(store) {
  const by = new Map();
  for (const a of store.list('assets')) {
    const h = a.asset && a.asset.hash;
    if (!h) continue;
    if (!by.has(h)) by.set(h, []);
    by.get(h).push(a);
  }
  return [...by.values()].filter((g) => g.length > 1);
}

/** Set of library-asset ids that have at least one duplicate. */
export function duplicateIds(store) {
  const s = new Set();
  for (const g of duplicateGroups(store)) for (const a of g) s.add(a.id);
  return s;
}

/** Library assets that no content item references (by hash). */
export function unusedAssets(store, index = usageIndex(store)) {
  return store.list('assets').filter((a) => { const h = a.asset && a.asset.hash; return !h || usageForHash(index, h).length === 0; });
}
