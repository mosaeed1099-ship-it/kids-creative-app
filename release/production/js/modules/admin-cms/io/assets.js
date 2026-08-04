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
import { hashString } from '../media/hash.js';

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
  const hash = descriptor.hash || hashString(descriptor.data);
  const meta = { type: descriptor.type, mime: descriptor.mime, name: descriptor.name, size: descriptor.size, width: descriptor.width, height: descriptor.height, hash };
  if (!assetStoreReady()) return { ...descriptor, hash };   // inline fallback still carries the hash
  const ref = descriptor.ref || uid('ast');
  await _store.put(ref, { ...meta, data: descriptor.data });
  return { ...meta, ref };
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

/**
 * Backfill content hashes (+ dimensions) on records whose asset predates 17A.3
 * (a ref with no hash). Resolves the bytes once, hashes them, and stores the
 * hash on the record so duplicate/usage detection works without re-resolving.
 * Idempotent (skips assets that already have a hash). Returns the count updated.
 */
export async function backfillAssetMeta(cmsStore) {
  if (!assetStoreReady()) return 0;
  let n = 0;
  for (const coll of ['items', 'assets']) {
    for (const rec of cmsStore.list(coll)) {
      const a = rec.asset;
      if (!a || a.type === 'emoji' || a.hash || a.data != null) continue;   // no asset / emoji / already hashed / inline (migrated separately)
      const full = await resolveAssetData(a);                                // eslint-disable-line no-await-in-loop
      if (full && full.data != null) { a.hash = full.hash || hashString(full.data); if (full.width) a.width = full.width; if (full.height) a.height = full.height; n++; }
    }
  }
  if (n) cmsStore.flush();
  return n;
}
