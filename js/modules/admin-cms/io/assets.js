/**
 * assets.js — the single place that mediates between CMS records and the
 * IndexedDB AssetStore (Phase 17A.1, C2).
 *
 * A record's `asset` can be one of:
 *   • emoji            { type:'emoji', data:'⭐' }           — kept inline (tiny)
 *   • inline (legacy)  { type:'image', data:'data:…', … }   — pre-migration
 *   • reference        { type:'image', ref:'ast_…', … }      — data lives in IDB
 *
 * `resolveAssetData` returns a descriptor that always carries `data`, so callers
 * (thumbnails, generators, backup) never care which form it started in.
 */
import AssetStore from '../store/AssetStore.js';
import { uid } from '../store/CmsStore.js';

let _store = null;

/** Create + open the singleton AssetStore. Safe if IDB is unavailable. */
export async function initAssetStore() { const s = new AssetStore(); await s.open(); _store = s; return s; }
export function setAssetStore(s) { _store = s; }
export function assetStore() { return _store; }
export const assetStoreReady = () => !!(_store && _store.ok);

/** True when the asset only references IDB (no inline data). */
export function isRef(asset) { return !!(asset && asset.ref && asset.data == null); }

/** Resolve any asset form to a descriptor carrying `data` (or null). */
export async function resolveAssetData(asset) {
  if (!asset) return null;
  if (asset.type === 'emoji') return asset;
  if (asset.data != null) return asset;                 // inline / legacy
  if (asset.ref && assetStoreReady()) { const rec = await _store.get(asset.ref); return rec ? { ...rec, ref: asset.ref } : null; }
  return null;
}

/**
 * Store an uploaded descriptor's binary in IDB and return a light reference.
 * Emoji (and anything without data) is returned unchanged. If IDB is
 * unavailable the descriptor is returned inline (graceful fallback).
 */
export async function putUploadedAsset(descriptor) {
  if (!descriptor || descriptor.type === 'emoji' || descriptor.data == null) return descriptor;
  if (!assetStoreReady()) return descriptor;
  const ref = descriptor.ref || uid('ast');
  await _store.put(ref, { type: descriptor.type, data: descriptor.data, mime: descriptor.mime, name: descriptor.name, size: descriptor.size });
  return { type: descriptor.type, mime: descriptor.mime, name: descriptor.name, size: descriptor.size, ref };
}

/**
 * One-time migration (C2): move every inline binary asset in the store into
 * IDB, replacing it with a reference. Reduces the localStorage blob, so the
 * write is smaller than before and cannot regress storage pressure. Returns the
 * number of assets moved. No-op (returns 0) if IDB is unavailable.
 */
export async function migrateInlineAssets(cmsStore) {
  if (!assetStoreReady()) return 0;
  let moved = 0;
  for (const coll of ['items', 'assets']) {
    for (const rec of cmsStore.list(coll)) {
      const a = rec.asset;
      if (a && a.type !== 'emoji' && a.data != null) { rec.asset = await putUploadedAsset(a); moved++; } // eslint-disable-line no-await-in-loop
    }
  }
  if (moved) cmsStore.flush();
  return moved;
}
